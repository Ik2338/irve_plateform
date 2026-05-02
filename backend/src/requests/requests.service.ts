import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { InstallersService } from '../installers/installers.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { RequestStatus } from '@prisma/client';

@Injectable()
export class RequestsService {
  constructor(
    private prisma: PrismaService,
    private installersService: InstallersService,
  ) {}

  async create(userId: string, dto: CreateRequestDto) {
const coords = await this.installersService.geocodeAddress({
  address: dto.address,
  postalCode: dto.postalCode,
  city: dto.city,
});    await this.prisma.$executeRaw`
  INSERT INTO "installation_requests" (
    id, "userId", "projectType", "powerLevel", quantity,
    address, city, "postalCode", location, description,
    "hasExistingPanel", urgency,
    connectors, "parkingType", "parkingAccess", "parkingSpots", -- ✅ new
    status, "createdAt", "updatedAt"
  )
  VALUES (
    uuid_generate_v4(), ${userId}::uuid,
    ${dto.projectType}::"ProjectType", ${dto.powerLevel}::"PowerLevel",
    ${dto.quantity || 1}, ${dto.address}, ${dto.city}, ${dto.postalCode},
    ST_SetSRID(ST_MakePoint(${coords.lon}, ${coords.lat}), 4326)::geography,
    ${dto.description || null}, ${dto.hasExistingPanel || false}, ${dto.urgency || 'normal'},
    ${dto.connectors || []}, ${dto.parkingType || null},   -- ✅ new
    ${dto.parkingAccess || null}, ${dto.parkingSpots || null}, -- ✅ new
    'SUBMITTED'::"RequestStatus", NOW(), NOW()
  )
`;
    return this.prisma.installationRequest.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async findMyRequests(userId: string) {
    return this.prisma.installationRequest.findMany({
      where: { userId },
      include: { quotes: { include: { installer: { select: { companyName: true, city: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const req = await this.prisma.installationRequest.findUnique({
      where: { id },
      include: { quotes: { include: { installer: true } } },
    });
    if (!req) throw new NotFoundException('Demande introuvable');
    if (req.userId !== userId) throw new ForbiddenException();
    return req;
  }

  async updateStatus(id: string, status: RequestStatus) {
    return this.prisma.installationRequest.update({ where: { id }, data: { status } });
  }

  // Toutes les demandes pour l'admin
  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.installationRequest.findMany({
        skip, take: limit,
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.installationRequest.count(),
    ]);
    return { data, total, page, limit };
  }
}
