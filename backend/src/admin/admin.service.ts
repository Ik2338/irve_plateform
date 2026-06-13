import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CertificationLevel } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ─── Stats dashboard ──────────────────────────────────────────────────────
  async getDashboardStats() {
    const since30Days = new Date();
    since30Days.setDate(since30Days.getDate() - 30);

    const [users, installers, requests, quotes, leads, reviews, conversations] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.installer.count(),
      this.prisma.installationRequest.count(),
      this.prisma.quote.count(),
      this.prisma.lead.count(),
      this.prisma.review.count(),
      this.prisma.conversation.count(),
    ]);

    const [
      requestsByStatus,
      quotesByStatus,
      usersByRole,
      pendingInstallers,
      verifiedInstallers,
      activeInstallers,
      inactiveInstallers,
      newUsers30Days,
      newRequests30Days,
      newQuotes30Days,
      topCities,
      quoteAmounts,
    ] = await Promise.all([
      this.prisma.installationRequest.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.quote.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
      }),
      this.prisma.installer.count({ where: { isVerified: false } }),
      this.prisma.installer.count({ where: { isVerified: true } }),
      this.prisma.installer.count({ where: { isActive: true } }),
      this.prisma.installer.count({ where: { isActive: false } }),
      this.prisma.user.count({ where: { createdAt: { gte: since30Days } } }),
      this.prisma.installationRequest.count({ where: { createdAt: { gte: since30Days } } }),
      this.prisma.quote.count({ where: { createdAt: { gte: since30Days } } }),
      this.prisma.installationRequest.groupBy({
        by: ['city'],
        where: { city: { not: '' } },
        _count: { city: true },
        orderBy: { _count: { city: 'desc' } },
        take: 5,
      }),
      this.prisma.quote.aggregate({
        _avg: { amount: true },
        _sum: { amount: true },
      }),
    ]);

    const countByStatus = (rows: { status: string; _count: Record<string, number> }[], status: string) =>
      rows.find((row) => row.status === status)?._count.status ?? 0;

    const completedRequests = countByStatus(requestsByStatus, 'COMPLETED');
    const acceptedQuotes = countByStatus(quotesByStatus, 'ACCEPTED');

    return {
      totals: { users, installers, requests, quotes, leads, reviews, conversations },
      requestsByStatus,
      quotesByStatus,
      usersByRole,
      pendingInstallers,
      installers: {
        pending: pendingInstallers,
        verified: verifiedInstallers,
        active: activeInstallers,
        inactive: inactiveInstallers,
      },
      recentActivity: {
        newUsers30Days,
        newRequests30Days,
        newQuotes30Days,
      },
      performance: {
        completionRate: requests ? Math.round((completedRequests / requests) * 100) : 0,
        quoteAcceptanceRate: quotes ? Math.round((acceptedQuotes / quotes) * 100) : 0,
        averageQuoteAmount: Math.round(quoteAmounts._avg.amount ?? 0),
        totalQuoteAmount: Math.round(quoteAmounts._sum.amount ?? 0),
      },
      topCities: topCities.map((city) => ({
        city: city.city,
        count: city._count.city,
      })),
    };
  }

  // ─── Tous les utilisateurs ────────────────────────────────────────────────
  async getAllUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id:            true,
          email:         true,
          firstName:     true,
          lastName:      true,
          role:          true,
          createdAt:     true,
          emailVerified: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);
    return { data, total, page, limit };
  }

  // ─── Tous les installateurs ───────────────────────────────────────────────
  async getAllInstallers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.installer.findMany({
        skip,
        take: limit,
        include: {
          user:           { select: { firstName: true, lastName: true, email: true } },
          certifications: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.installer.count(),
    ]);
    return { data, total, page, limit };
  }

  // ─── Valider un installateur ──────────────────────────────────────────────
  async verifyInstaller(id: string) {
  const installer = await this.prisma.installer.findUnique({
    where: { id },
    select: {
      id: true,
      qualifelecCertNumber: true,
      qualifelecIndices: true,
      qualifelecExpiresAt: true,
    },
  });

  if (!installer) throw new NotFoundException('Installateur introuvable');

  await this.prisma.installer.update({
    where: { id },
    data: { isVerified: true },
  });

  await this.prisma.installerCertification.deleteMany({
    where: { installerId: id },
  });

  // ✅ FIX : mapper IRVE1/2/3 → IRVE_P1/P2/P3
  const LEVEL_MAP: Record<string, string> = {
    IRVE1: 'IRVE_P1',
    IRVE2: 'IRVE_P2',
    IRVE3: 'IRVE_P3',
    IRVE_P1: 'IRVE_P1',
    IRVE_P2: 'IRVE_P2',
    IRVE_P3: 'IRVE_P3',
  };

  if (installer.qualifelecIndices?.length > 0 && installer.qualifelecCertNumber) {
    const mappedLevels = installer.qualifelecIndices
      .map((l: string) => LEVEL_MAP[l])
      .filter(Boolean); // ignore les valeurs inconnues

    if (mappedLevels.length > 0) {
      await this.prisma.installerCertification.createMany({
        data: mappedLevels.map((level: string) => ({
          installerId: id,
          level: level as CertificationLevel,
          certNumber: installer.qualifelecCertNumber as string,
          issuedAt: new Date(),
          expiresAt: installer.qualifelecExpiresAt ?? new Date('2030-01-01'),
          isVerified: true,
        })),
        skipDuplicates: true,
      });
    }
  }

  return this.prisma.installer.findUnique({
    where: { id },
    include: {
      certifications: true,
      user: { select: { firstName: true, lastName: true, email: true } },
    },
  });
}

  // ─── Désactiver un installateur ───────────────────────────────────────────
  async deactivateInstaller(id: string) {
    return this.prisma.installer.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ─── Réactiver un installateur ─────────────────────────────────────────────
async activateInstaller(id: string) {
  return this.prisma.installer.update({
    where: { id },
    data: { isActive: true },
  });
}

  // ─── Toutes les demandes ──────────────────────────────────────────────────
  async getAllRequests(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.installationRequest.findMany({
        skip,
        take: limit,
        include: {
          user:   { select: { firstName: true, lastName: true, email: true } },
          quotes: { select: { status: true, amount: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.installationRequest.count(),
    ]);
    return { data, total, page, limit };
  }
}
