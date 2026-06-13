import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { MailService }   from '../mail/mail.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { ConversationContext, NotificationType, QuoteStatus } from '@prisma/client';
import { MessagingService } from '../messaging/messaging.service';

@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);

  constructor(
    private prisma:      PrismaService,
    private mailService: MailService,
    private messaging:   MessagingService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  async create(userId: string, dto: CreateQuoteDto) {
    const installer = await this.prisma.installer.findUnique({ where: { userId } });
    if (!installer) throw new ForbiddenException('Profil installateur requis');

    const request = await this.prisma.installationRequest.findUnique({ where: { id: dto.requestId } });
    if (!request) throw new NotFoundException('Demande introuvable');

    // Bloquer uniquement si le client a déjà accepté un devis
    if (request.status === 'QUOTE_ACCEPTED' || request.status === 'IN_PROGRESS' || request.status === 'COMPLETED') {
      throw new BadRequestException('Cette demande ne peut plus recevoir de devis — elle est déjà traitée.');
    }

    // Empêcher un même installateur d'envoyer deux devis pour la même demande
    const existing = await this.prisma.quote.findFirst({
      where: { requestId: dto.requestId, installerId: installer.id, status: { not: QuoteStatus.REFUSED } },
    });
    if (existing) {
      throw new BadRequestException('Vous avez déjà envoyé un devis pour cette demande.');
    }

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    const quote = await this.prisma.quote.create({
  data: {
    request:   { connect: { id: dto.requestId } },
    installer: { connect: { id: installer.id } },
    sentBy:    { connect: { id: request.userId } },   // ← was "user:", now "sentBy:"
    amount:    dto.laborCost,
    laborCost: dto.laborCost,
    vatRate:   dto.vatRate ?? 20,
    notes:     dto.notes,
    validUntil,
    status:    QuoteStatus.SENT,
  },
      include: {
        request:   true,
        installer: { select: { companyName: true, city: true } },
      },
    });

    // Passer le statut de la demande à QUOTE_SENT (seulement si ce n'est pas déjà plus avancé)
    if (request.status === 'SUBMITTED' || request.status === 'MATCHED') {
      await this.prisma.installationRequest.update({
        where: { id: dto.requestId },
        data:  { status: 'QUOTE_SENT' },
      });
    }

    const conversation = await this.messaging.ensureConversation({
      clientId: request.userId,
      installerId: installer.id,
      requestId: request.id,
      quoteId: quote.id,
      context: ConversationContext.QUOTE,
    });
    await this.messaging.createNotification({
      userId: request.userId,
      actorId: installer.userId,
      type: NotificationType.NEW_QUOTE,
      title: 'Nouveau devis recu',
      body: `${installer.companyName} vous a envoye un devis de ${quote.amount.toLocaleString('fr-FR')} EUR HT.`,
      link: `/messages/${conversation.id}`,
    });

    // Email au client — fire-and-forget
    this.prisma.user.findUnique({
      where:  { id: request.userId },
      select: { firstName: true, lastName: true, email: true },
    }).then(client => {
      if (!client) return;
      this.mailService.sendQuoteNotificationToClient({
        quote, request, installer, client,
      }).catch(err => this.logger.error('Email devis client échoué: ' + err.message));
    }).catch(err => this.logger.error('Récupération client échouée: ' + err.message));

    return quote;
  }

  // ─────────────────────────────────────────────────────────────────────────
  async updateStatus(id: string, userId: string, status: QuoteStatus) {
    const quote = await this.prisma.quote.findUnique({ where: { id } });
    if (!quote) throw new NotFoundException('Devis introuvable');
    if (quote.userId !== userId) throw new ForbiddenException();

    // Vérifier que le devis est encore en attente avant d'accepter/refuser
    if (quote.status !== QuoteStatus.SENT) {
      throw new BadRequestException('Ce devis a déjà été traité.');
    }

    const updated = await this.prisma.quote.update({
      where: { id },
      data:  { status },
    });

    if (status === QuoteStatus.ACCEPTED) {
      // Mettre la demande en QUOTE_ACCEPTED
      await this.prisma.installationRequest.update({
        where: { id: quote.requestId },
        data:  { status: 'QUOTE_ACCEPTED' },
      });

      // Refuser automatiquement tous les autres devis SENT de la même demande
      const otherQuotes = await this.prisma.quote.findMany({
        where: {
          requestId: quote.requestId,
          id:        { not: id },
          status:    QuoteStatus.SENT,
        },
      });

      if (otherQuotes.length > 0) {
        await this.prisma.quote.updateMany({
          where: {
            requestId: quote.requestId,
            id:        { not: id },
            status:    QuoteStatus.SENT,
          },
          data: { status: QuoteStatus.REFUSED },
        });
        this.logger.log(
          `🚫 ${otherQuotes.length} autre(s) devis automatiquement refusé(s) pour la demande ${quote.requestId}`
        );
      }

      const installer = await this.prisma.installer.findUnique({
        where: { id: quote.installerId },
        select: { userId: true, companyName: true },
      });
      const conversation = await this.messaging.ensureConversation({
        clientId: quote.userId,
        installerId: quote.installerId,
        requestId: quote.requestId,
        quoteId: quote.id,
        context: ConversationContext.PROJECT,
      });
      await this.messaging.createNotification({
        userId: installer?.userId ?? quote.userId,
        actorId: quote.userId,
        type: NotificationType.QUOTE_ACCEPTED,
        title: 'Devis accepte',
        body: `Votre devis a ete accepte. La conversation devient le canal principal du projet.`,
        link: `/messages/${conversation.id}`,
      });
    }

    return updated;
  }

  // ─────────────────────────────────────────────────────────────────────────
  async findForClient(userId: string) {
    return this.prisma.quote.findMany({
      where: { userId },
      include: {
        installer: { select: { companyName: true, city: true, averageRating: true } },
        request:   { select: { projectType: true, powerLevel: true, address: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  async findForInstaller(userId: string) {
    const installer = await this.prisma.installer.findUnique({ where: { userId } });
    if (!installer) throw new ForbiddenException();

    return this.prisma.quote.findMany({
      where: { installerId: installer.id },
      include: {
        request: {
          select: { projectType: true, powerLevel: true, address: true, city: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  async findOneForInstaller(quoteId: string, userId: string) {
    const installer = await this.prisma.installer.findUnique({ where: { userId } });
    if (!installer) throw new ForbiddenException('Profil installateur requis');

    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        request: {
          include: {
            user: {
              select: {
                firstName: true, lastName: true,
                email: true, phone: true, createdAt: true,
              },
            },
          },
        },
        installer: true,
      },
    });

    if (!quote) throw new NotFoundException('Devis introuvable');
    if (quote.installerId !== installer.id) throw new ForbiddenException('Accès non autorisé');

    return quote;
  }

  // ─────────────────────────────────────────────────────────────────────────
  async findOneForClient(quoteId: string, userId: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        installer: { select: { companyName: true, city: true } },
        request:   { select: { projectType: true, powerLevel: true, address: true, city: true } },
      },
    });

    if (!quote) throw new NotFoundException('Devis introuvable');
    if (quote.userId !== userId) throw new ForbiddenException('Accès non autorisé');

    return quote;
  }
}
