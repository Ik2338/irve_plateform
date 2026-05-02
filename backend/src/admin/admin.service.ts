import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

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

  async getAllUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        skip, take: limit,
        select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true, emailVerified: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);
    return { data, total, page, limit };
  }

  async getAllInstallers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.installer.findMany({
        skip, take: limit,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          certifications: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.installer.count(),
    ]);
    return { data, total, page, limit };
  }

  async verifyInstaller(id: string) {
    return this.prisma.installer.update({
      where: { id },
      data: { isVerified: true },
    });
  }

  async deactivateInstaller(id: string) {
    return this.prisma.installer.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getAllRequests(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.installationRequest.findMany({
        skip, take: limit,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          quotes: { select: { status: true, amount: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.installationRequest.count(),
    ]);
    return { data, total, page, limit };
  }
}
