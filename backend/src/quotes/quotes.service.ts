import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { MailService }   from '../mail/mail.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { QuoteStatus } from '@prisma/client';

@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);

  constructor(
    private prisma:      PrismaService,
    private mailService: MailService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  async create(userId: string, dto: CreateQuoteDto) {
    const installer = await this.prisma.installer.findUnique({ where: { userId } });
    if (!installer) throw new ForbiddenException('Profil installateur requis');

    const request = await this.prisma.installationRequest.findUnique({ where: { id: dto.requestId } });
    if (!request) throw new NotFoundException('Demande introuvable');

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    const quote = await this.prisma.quote.create({
  data: {
    request:   { connect: { id: dto.requestId } },
    installer: { connect: { id: installer.id } },
    user:      { connect: { id: request.userId } },
    amount:    dto.laborCost,
    laborCost: dto.laborCost,
    vatRate:   dto.vatRate ?? 20,
    notes:     dto.notes,
    validUntil,
    status:    QuoteStatus.SENT,
  } as any,
  include: {
    request:   true,
    installer: { select: { companyName: true, city: true } },
  },
});

    await this.prisma.installationRequest.update({
      where: { id: dto.requestId },
      data:  { status: 'QUOTE_SENT' },
    });

    // Fire-and-forget : ne bloque pas la réponse HTTP
    this.prisma.user.findUnique({
      where:  { id: request.userId },
      select: { firstName: true, lastName: true, email: true },
    }).then(client => {
      if (!client) return;
      this.mailService.sendQuoteNotificationToClient({
        quote,
        request,
        installer,
        client,
      }).catch(err => this.logger.error('Email devis client échoué: ' + err.message));
    }).catch(err => this.logger.error('Récupération client échouée: ' + err.message));

    return quote;
  }

  // ─────────────────────────────────────────────────────────────────────────
  async updateStatus(id: string, userId: string, status: QuoteStatus) {
    const quote = await this.prisma.quote.findUnique({ where: { id } });
    if (!quote) throw new NotFoundException('Devis introuvable');
    if (quote.userId !== userId) throw new ForbiddenException();

    const updated = await this.prisma.quote.update({
      where: { id },
      data:  { status },
    });

    if (status === QuoteStatus.ACCEPTED) {
      await this.prisma.installationRequest.update({
        where: { id: quote.requestId },
        data:  { status: 'QUOTE_ACCEPTED' },
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
  // Détail complet d'un devis avec infos client (pour l'installateur)
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
                firstName: true,
                lastName:  true,
                email:     true,
                phone:     true,
                createdAt: true,
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
  // Détail d'un devis pour le client
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