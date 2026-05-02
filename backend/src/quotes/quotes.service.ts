import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { QuoteStatus } from '@prisma/client';

@Injectable()
export class QuotesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateQuoteDto) {
    const installer = await this.prisma.installer.findUnique({ where: { userId } });
    if (!installer) throw new ForbiddenException('Profil installateur requis');

    const request = await this.prisma.installationRequest.findUnique({ where: { id: dto.requestId } });
    if (!request) throw new NotFoundException('Demande introuvable');

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    const quote = await this.prisma.quote.create({
      data: {
        requestId: dto.requestId,
        installerId: installer.id,
        userId: request.userId,
        amount: dto.laborCost + dto.materialCost,
        laborCost: dto.laborCost,
        materialCost: dto.materialCost,
        vatRate: dto.vatRate ?? 20,
        notes: dto.notes,
        validUntil,
        status: QuoteStatus.SENT,
      },
      include: {
        request: true,
        installer: { select: { companyName: true, city: true } },
      },
    });

    await this.prisma.installationRequest.update({
      where: { id: dto.requestId },
      data: { status: 'QUOTE_SENT' },
    });

    return quote;
  }

  async updateStatus(id: string, userId: string, status: QuoteStatus) {
    const quote = await this.prisma.quote.findUnique({ where: { id } });
    if (!quote) throw new NotFoundException('Devis introuvable');
    if (quote.userId !== userId) throw new ForbiddenException();

    const updated = await this.prisma.quote.update({
      where: { id },
      data: { status },
    });

    if (status === QuoteStatus.ACCEPTED) {
      await this.prisma.installationRequest.update({
        where: { id: quote.requestId },
        data: { status: 'QUOTE_ACCEPTED' },
      });
    }

    return updated;
  }

  async findForClient(userId: string) {
    return this.prisma.quote.findMany({
      where: { userId },
      include: {
        installer: { select: { companyName: true, city: true, averageRating: true } },
        request: { select: { projectType: true, powerLevel: true, address: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findForInstaller(userId: string) {
    const installer = await this.prisma.installer.findUnique({ where: { userId } });
    if (!installer) throw new ForbiddenException();
    return this.prisma.quote.findMany({
      where: { installerId: installer.id },
      include: {
        request: {
          select: { projectType: true, powerLevel: true, address: true, city: true }
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ← Nouveau : détail complet d'un devis avec infos client
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
                lastName: true,
                email: true,
                phone: true,
                createdAt: true,
              }
            }
          }
        },
        installer: true,
      }
    });

    if (!quote) throw new NotFoundException('Devis introuvable');
    if (quote.installerId !== installer.id) throw new ForbiddenException('Accès non autorisé');

    return quote;
  }
}