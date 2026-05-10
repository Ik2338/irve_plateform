import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
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
    // ✅ Géocodage via API officielle française (data.gouv.fr)
    // Ne jamais fallback sur Paris (0,0) — coordonnées invalides = lead invisible
    let coords: { lat: number; lon: number } | null = null;

    try {
      // 1. Essai via le service existant (geocodeAddress)
      const result = await this.installersService.geocodeAddress({
        address:    dto.address,
        postalCode: dto.postalCode,
        city:       dto.city,
      });
      // ✅ Rejeter les coordonnées (0,0) — invalides
      if (result && !(result.lat === 0 && result.lon === 0)) {
        coords = result;
      }
    } catch (err: any) {
      console.warn('[RequestsService] geocodeAddress échoué:', err.message);
    }

    // 2. Fallback : API adresse.data.gouv.fr sur le code postal seul
    if (!coords) {
      try {
        const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(dto.postalCode + ' ' + dto.city)}&type=municipality&limit=1`;
        const res  = await fetch(url);
        const json = await res.json();
        const feature = json?.features?.[0];
        if (feature) {
          const [lon, lat] = feature.geometry.coordinates;
          if (lat !== 0 && lon !== 0) {
            coords = { lat, lon };
          }
        }
      } catch (err: any) {
        console.warn('[RequestsService] API data.gouv.fr échouée:', err.message);
      }
    }

    // ✅ Si toujours pas de coordonnées valides → rejeter la demande
    if (!coords) {
      throw new BadRequestException(
        'Impossible de géolocaliser ce code postal. Vérifiez votre adresse.'
      );
    }

    await this.prisma.$executeRaw`
      INSERT INTO "installation_requests" (
        id, "userId", "projectType", "powerLevel", quantity,
        address, city, "postalCode", location, description,
        "hasExistingPanel", urgency,
        connectors, "parkingType", "parkingAccess", "parkingSpots",
        status, "createdAt", "updatedAt"
      )
      VALUES (
        uuid_generate_v4(), ${userId}::uuid,
        ${dto.projectType}::"ProjectType", ${dto.powerLevel}::"PowerLevel",
        ${dto.quantity || 1}, ${dto.address}, ${dto.city}, ${dto.postalCode},
        ST_SetSRID(ST_MakePoint(${coords.lon}, ${coords.lat}), 4326)::geography,
        ${dto.description || null}, ${dto.hasExistingPanel || false}, ${dto.urgency || 'normal'},
        ${dto.connectors || []}, ${dto.parkingType || null},
        ${dto.parkingAccess || null}, ${dto.parkingSpots || null},
        'SUBMITTED'::"RequestStatus", NOW(), NOW()
      )
    `;

    return this.prisma.installationRequest.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMyRequests(userId: string) {
    return this.prisma.installationRequest.findMany({
      where: { userId },
      include: {
        quotes: {
          include: {
            installer: { select: { companyName: true, city: true } },
          },
        },
      },
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

  async remove(id: string, userId: string) {
    // Vérifie que la demande existe et appartient à l'utilisateur
    const req = await this.prisma.installationRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Demande introuvable');
    if (req.userId !== userId) throw new ForbiddenException();

    // Bloquer la suppression si la demande est trop avancée (devis accepté ou terminée)
    const nonDeletableStatuses: RequestStatus[] = ['IN_PROGRESS', 'COMPLETED'];
    if (nonDeletableStatuses.includes(req.status)) {
      throw new BadRequestException(
        'Impossible de supprimer une demande en cours d\'installation ou terminée.'
      );
    }

    // Suppression en cascade (les quotes liées seront supprimées via onDelete: Cascade dans le schema Prisma)
    await this.prisma.installationRequest.delete({ where: { id } });
  }

  async updateStatus(id: string, status: RequestStatus) {
    return this.prisma.installationRequest.update({
      where: { id },
      data: { status },
    });
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.installationRequest.findMany({
        skip,
        take: limit,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.installationRequest.count(),
    ]);
    return { data, total, page, limit };
  }
}