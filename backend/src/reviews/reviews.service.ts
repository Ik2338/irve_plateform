import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  // ─── POST /reviews ────────────────────────────────────────────────────────
  async create(
    clientId: string,
    dto: {
      requestId:   string;
      installerId: string;
      rating:      number;   // champ réel = "rating"
      comment?:    string;
    },
  ) {
    // 1. La demande doit exister et appartenir à ce client
    const request = await this.prisma.installationRequest.findUnique({
      where: { id: dto.requestId },           // modèle réel = installationRequest
    });
    if (!request) throw new NotFoundException('Demande introuvable');
    if (request.userId !== clientId) {
      throw new ForbiddenException('Cette demande ne vous appartient pas');
    }

    // 2. La demande doit être COMPLETED
    if (request.status !== 'COMPLETED') {
      throw new ForbiddenException(
        "Vous ne pouvez évaluer qu'une installation terminée (statut COMPLETED)",
      );
    }

    // 3. Pas de double avis pour la même demande
    const existing = await this.prisma.review.findFirst({
      where: { requestId: dto.requestId, clientId },
    });
    if (existing) {
      throw new ConflictException('Vous avez déjà évalué cette installation');
    }

    // 4. Créer l'avis
    const review = await this.prisma.review.create({
      data: {
        installerId: dto.installerId,
        requestId:   dto.requestId,
        clientId,
        rating:      dto.rating,
        comment:     dto.comment ?? null,
      },
    });

    // 5. Recalculer la note moyenne de l'installateur
    await this.recalcInstallerRating(dto.installerId);

    return review;
  }

  // ─── GET /reviews/installer/:installerId ─────────────────────────────────
  async findByInstaller(installerId: string) {
    const installer = await this.prisma.installer.findUnique({
      where:  { id: installerId },
      select: {
        id: true, companyName: true, averageRating: true, totalReviews: true,
      },
    });
    if (!installer) throw new NotFoundException('Installateur introuvable');

    const reviews = await this.prisma.review.findMany({
      where:   { installerId },
      orderBy: { createdAt: 'desc' },
      take:    20,
      select:  {
        id:        true,
        rating:    true,
        comment:   true,
        createdAt: true,
        client: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    return { installer, reviews };
  }

  // ─── Recalcul note moyenne après chaque avis ─────────────────────────────
  private async recalcInstallerRating(installerId: string) {
    const agg = await this.prisma.review.aggregate({
      where:  { installerId },
      _avg:   { rating: true },
      _count: { rating: true },
    });

    await this.prisma.installer.update({
      where: { id: installerId },
      data: {
        averageRating: agg._avg.rating   ?? 0,
        totalReviews:  agg._count.rating ?? 0,
      },
    });
  }
}