import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateLeadDto } from './dto/create-lead.dto';

@Injectable()
export class LeadsService {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
  ) {}

  async create(currentUser: any, dto: CreateLeadDto) {
    // 1. Vérifier que l'installateur existe et est actif
    const installer = await this.prisma.installer.findUnique({
      where: { id: dto.installerId },
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
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

    return this.prisma.lead.update({
      where: { id: leadId },
      data: { status },
    });
  }
}