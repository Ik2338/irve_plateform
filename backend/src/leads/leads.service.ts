import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { MessagingService } from '../messaging/messaging.service';
import { ConversationContext, NotificationType } from '@prisma/client';

@Injectable()
export class LeadsService {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
    private messaging: MessagingService,
  ) {}

  async create(currentUser: any, dto: CreateLeadDto) {
    // 1. Vérifier que l'installateur existe et est actif
    const installer = await this.prisma.installer.findUnique({
      where: { id: dto.installerId },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    if (!installer || !installer.isActive) {
      throw new NotFoundException('Installateur introuvable ou inactif.');
    }

    // 2. Récupérer les infos complètes du client
    const client = await this.prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true },
    });

    if (!client) throw new NotFoundException('Utilisateur introuvable.');

    // 3. Créer la demande en base
    const lead = await this.prisma.lead.create({
      data: {
        installerId: installer.id,
        clientId:    client.id,
        address:     dto.address,
        message:     dto.message,
        status:      'PENDING',
      },
    });

    const conversation = await this.messaging.ensureConversation({
      clientId: client.id,
      installerId: installer.id,
      leadId: lead.id,
      context: ConversationContext.LEAD,
    });
    await this.messaging.sendMessage(client.id, conversation.id, dto.message);
    await this.messaging.createNotification({
      userId: installer.user.id,
      actorId: client.id,
      type: NotificationType.NEW_REQUEST,
      title: 'Nouvelle demande recue',
      body: `${client.firstName} ${client.lastName} vous a envoye une demande.`,
      link: `/messages/${conversation.id}`,
    });

    // 4. Notifier l'installateur par email (via votre MailService)
    await this.mail.sendLeadNotification(
      installer.user.email,
      installer.user.firstName,
      {
        clientName:  `${client.firstName} ${client.lastName}`,
        clientEmail: client.email,
        clientPhone: client.phone || 'Non renseigné',
        address:     dto.address,
        message:     dto.message,
      },
    );

    return {
      success: true,
      leadId:  lead.id,
      conversationId: conversation.id,
      message: "Votre demande a bien été envoyée à l'installateur.",
    };
  }

  // ─── Dashboard installateur : demandes reçues ─────────────────────────────
  async findForInstaller(userId: string) {
    const installer = await this.prisma.installer.findUnique({ where: { userId } });
    if (!installer) throw new NotFoundException('Profil installateur introuvable.');

    return this.prisma.lead.findMany({
      where: { installerId: installer.id },
      include: {
        client: {
          select: { firstName: true, lastName: true, email: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Dashboard client : demandes envoyées ─────────────────────────────────
  async findForClient(userId: string) {
    return this.prisma.lead.findMany({
      where: { clientId: userId },
      include: {
        installer: {
          select: { companyName: true, city: true, averageRating: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Installateur : accepter ou refuser une demande ───────────────────────
  async updateStatus(userId: string, leadId: string, status: 'ACCEPTED' | 'REJECTED') {
    const installer = await this.prisma.installer.findUnique({ where: { userId } });
    if (!installer) throw new NotFoundException('Profil installateur introuvable.');

    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead || lead.installerId !== installer.id) {
      throw new BadRequestException('Demande introuvable ou accès refusé.');
    }

    const updated = await this.prisma.lead.update({
      where: { id: leadId },
      data: { status },
    });

    await this.messaging.createNotification({
      userId: updated.clientId,
      actorId: userId,
      type: NotificationType.REQUEST_RESPONSE,
      title: status === 'ACCEPTED' ? 'Demande acceptee' : 'Demande refusee',
      body: `L'installateur a repondu a votre demande.`,
      link: '/dashboard',
    });

    return updated;
  }
}
