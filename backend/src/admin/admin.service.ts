import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CertificationLevel } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ─── Stats dashboard ──────────────────────────────────────────────────────
  async getDashboardStats() {
    const [users, installers, requests, quotes] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.installer.count(),
      this.prisma.installationRequest.count(),
      this.prisma.quote.count(),
    ]);

    const requestsByStatus = await this.prisma.installationRequest.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const pendingInstallers = await this.prisma.installer.count({
      where: { isVerified: false },
    });

    return {
      totals: { users, installers, requests, quotes },
      requestsByStatus,
      pendingInstallers,
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