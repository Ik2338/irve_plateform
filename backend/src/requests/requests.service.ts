import {
  Injectable, NotFoundException, ForbiddenException,
  BadRequestException, Logger,
} from '@nestjs/common';
import { PrismaService }     from '../common/prisma/prisma.service';
import { InstallersService } from '../installers/installers.service';
import { MailService }       from '../mail/mail.service';
import { CreateRequestDto }  from './dto/create-request.dto';
import { RequestStatus }     from '@prisma/client';

export class RespondToRequestDto {
  action:   'ACCEPT' | 'DECLINE';
  message?: string;
}

@Injectable()
export class RequestsService {
  private readonly logger = new Logger(RequestsService.name);

  constructor(
    private prisma:            PrismaService,
    private installersService: InstallersService,
    private mailService:       MailService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  async create(userId: string, dto: CreateRequestDto) {

    // 1. Géocodage
    let coords: { lat: number; lon: number } | null = null;

    try {
      const result = await this.installersService.geocodeAddress({
        address: dto.address, postalCode: dto.postalCode, city: dto.city,
      });
      if (result && !(result.lat === 0 && result.lon === 0)) coords = result;
    } catch (err: any) {
      this.logger.warn('geocodeAddress échoué: ' + err.message);
    }

    if (!coords) {
      try {
        const q   = encodeURIComponent(`${dto.address}, ${dto.postalCode} ${dto.city}`);
        const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`;
        const res  = await fetch(url, { headers: { 'User-Agent': 'IRVE-Platform/1.0' } });
        const json = await res.json();
        if (json?.[0]) {
          const lat = parseFloat(json[0].lat);
          const lon = parseFloat(json[0].lon);
          if (lat !== 0 && lon !== 0) coords = { lat, lon };
        }
      } catch (err: any) {
        this.logger.warn('Nominatim échoué: ' + err.message);
      }
    }

    if (!coords) {
      this.logger.warn(`Géocodage impossible pour ${dto.city} — coordonnées par défaut`);
      coords = { lat: 0, lon: 0 };
    }

    // 2. Si demande ciblée, vérifier que l'installateur existe
    let targetedInstaller: any = null;
    if (dto.targetInstallerId) {
      targetedInstaller = await this.prisma.installer.findUnique({
        where:   { id: dto.targetInstallerId },
        include: { user: { select: { email: true, firstName: true, lastName: true } } },
      });
      if (!targetedInstaller) {
        throw new NotFoundException(`Installateur introuvable : ${dto.targetInstallerId}`);
      }
    }

    // 3. Récupérer le client pour l'email
    const client = await this.prisma.user.findUnique({
      where:  { id: userId },
      select: { firstName: true, lastName: true, email: true },
    });

    // 4. Insérer la demande
    const inserted = await this.prisma.$queryRaw<{ id: string }[]>`
      INSERT INTO "installation_requests" (
        id, "userId", "projectType", "powerLevel", quantity,
        address, city, "postalCode", location, description,
        "hasExistingPanel", urgency,
        connectors, "parkingType", "parkingAccess", "parkingSpots",
        "targetInstallerId", "isTargeted",
        source, status, "createdAt", "updatedAt"
      )
      VALUES (
        uuid_generate_v4(), ${userId}::uuid,
        ${dto.projectType}::"ProjectType", ${dto.powerLevel}::"PowerLevel",
        ${dto.quantity || 1}, ${dto.address}, ${dto.city}, ${dto.postalCode},
        ST_SetSRID(ST_MakePoint(${coords.lon}, ${coords.lat}), 4326)::geography,
        ${dto.description || null}, ${dto.hasExistingPanel || false}, ${dto.urgency || 'normal'},
        ${dto.connectors || []}, ${dto.parkingType || null},
        ${dto.parkingAccess || null}, ${dto.parkingSpots || null},
        ${dto.targetInstallerId || null}::uuid, ${!!dto.targetInstallerId},
        ${dto.targetInstallerId ? 'DIRECT' : 'ZONE'},
        'SUBMITTED'::"RequestStatus", NOW(), NOW()
      )
      RETURNING id
    `;

    const newId = inserted[0]?.id;
    if (!newId) throw new BadRequestException('Erreur lors de la création de la demande.');

    const saved = await this.prisma.installationRequest.findUnique({ where: { id: newId } });
    if (!saved) throw new BadRequestException('Demande créée mais introuvable — réessayez.');

    // 5a. Demande CIBLÉE → email à l'installateur cible uniquement
    if (targetedInstaller) {
      this.logger.log(
        `📧 Envoi email demande ciblée → ${targetedInstaller.user.email} (demande ${saved.id})`
      );
      this.mailService.sendRequestToInstaller({
        request: saved, installer: targetedInstaller, client,
      }).catch(err =>
        this.logger.error(`❌ Email installateur ciblé échoué (${saved.id}): ${err.message}`)
      );
    }

    // 5b. Demande ZONE → notifier tous les installateurs dont la zone couvre l'adresse
    if (!dto.targetInstallerId && coords.lat !== 0 && coords.lon !== 0) {
      this.notifyZoneInstallers(saved, coords, client).catch(err =>
        this.logger.error(`❌ notifyZoneInstallers échoué (${saved.id}): ${err.message}`)
      );
    }

    return saved;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Notification asynchrone des installateurs de la zone
  // ─────────────────────────────────────────────────────────────────────────
  private async notifyZoneInstallers(
    request: any,
    coords:  { lat: number; lon: number },
    client:  any,
  ) {
    // Trouver tous les installateurs actifs/vérifiés dont la zone couvre le point
    const installers = await this.prisma.$queryRaw<any[]>`
      SELECT
        i.id,
        i."companyName",
        i."interventionRadius",
        u.email,
        u."firstName",
        u."lastName"
      FROM "installers" i
      JOIN "users" u ON u.id = i."userId"
      WHERE i."isActive"   = true
        AND i."isVerified" = true
        AND i.location IS NOT NULL
        AND ST_DWithin(
          i.location,
          ST_SetSRID(ST_MakePoint(${coords.lon}, ${coords.lat}), 4326)::geography,
          i."interventionRadius" * 1000
        )
      LIMIT 50
    `;

    this.logger.log(
      `📍 Demande zone ${request.id} (${request.city}) → ${installers.length} installateur(s) dans la zone`
    );

    for (const installer of installers) {
      this.mailService.sendZoneRequestNotification({
        request,
        installer,
        client,
      }).catch(err =>
        this.logger.error(`❌ Email zone installateur ${installer.email} échoué: ${err.message}`)
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RESPOND — Installateur accepte ou refuse (demande ciblée)
  // ─────────────────────────────────────────────────────────────────────────
  async respondToRequest(
    requestId:   string,
    installerId: string,
    dto:         RespondToRequestDto,
  ) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT
        r.id, r."userId", r."projectType", r."powerLevel", r.quantity,
        r.address, r.city, r."postalCode", r.description,
        r."hasExistingPanel", r.urgency, r.connectors,
        r."parkingType", r."parkingAccess", r."parkingSpots",
        r."targetInstallerId", r."isTargeted", r.source, r.status,
        r."createdAt", r."updatedAt",
        ST_AsText(r.location) AS location,
        u.email AS "userEmail",
        u."firstName" AS "userFirstName",
        u."lastName" AS "userLastName"
      FROM "installation_requests" r
      JOIN "users" u ON u.id = r."userId"
      WHERE r.id = ${requestId}::uuid
    `;
    const request = rows[0];

    if (!request)                                  throw new NotFoundException('Demande introuvable');
    if (request.targetInstallerId !== installerId)  throw new ForbiddenException('Cette demande ne vous est pas destinée');
    if (request.status !== 'SUBMITTED')             throw new BadRequestException('Cette demande a déjà été traitée');

    const newStatus: RequestStatus = dto.action === 'ACCEPT' ? 'IN_PROGRESS' : 'CANCELLED';

    const updated = await this.prisma.installationRequest.update({
      where:   { id: requestId },
      data:    { status: newStatus },
      include: { user: { select: { email: true, firstName: true, lastName: true } } },
    });

    await this.prisma.$executeRaw`
      UPDATE "installation_requests"
      SET "installerNote" = ${dto.message || null},
          "respondedAt"   = NOW()
      WHERE id = ${requestId}::uuid
    `;

    await this.mailService.sendResponseToClient({
      request: { ...updated, installerNote: dto.message || null },
      action:  dto.action,
    }).catch(err => this.logger.error('Email client échoué: ' + err.message));

    return updated;
  }

  // ─────────────────────────────────────────────────────────────────────────
  async findOne(id: string, userId: string, installerId?: string) {
    const req = await this.prisma.installationRequest.findUnique({
      where:   { id },
      include: {
        quotes:  { include: { installer: true } },
        user:    { select: { firstName: true, lastName: true, email: true, phone: true } },
      },
    });

    if (!req) throw new NotFoundException('Demande introuvable');

    const isOwner              = req.userId === userId;
    const isTargetedInstaller  = !!installerId && (req as any).targetInstallerId === installerId;

    if (!isOwner && !isTargetedInstaller) {
      throw new ForbiddenException('Accès non autorisé à cette demande');
    }

    return req;
  }

  // ─────────────────────────────────────────────────────────────────────────
  async findPendingForInstaller(installerId: string) {
    return this.prisma.$queryRaw<any[]>`
      SELECT
        r.*,
        json_build_object(
          'firstName', u."firstName",
          'lastName',  u."lastName",
          'email',     u.email,
          'phone',     u.phone
        ) AS user
      FROM "installation_requests" r
      JOIN "users" u ON u.id = r."userId"
      WHERE r."targetInstallerId" = ${installerId}::uuid
        AND r.status = 'SUBMITTED'::"RequestStatus"
      ORDER BY r."createdAt" DESC
    `;
  }

  // ─────────────────────────────────────────────────────────────────────────
  async findMyRequests(userId: string) {
    return this.prisma.installationRequest.findMany({
      where:   { userId },
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

  async remove(id: string, userId: string) {
    const req = await this.prisma.installationRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Demande introuvable');
    if (req.userId !== userId) throw new ForbiddenException();

    const nonDeletableStatuses: RequestStatus[] = ['IN_PROGRESS', 'COMPLETED'];
    if (nonDeletableStatuses.includes(req.status)) {
      throw new BadRequestException(
        "Impossible de supprimer une demande en cours d'installation ou terminée."
      );
    }

    await this.prisma.installationRequest.delete({ where: { id } });
  }

  async updateStatus(id: string, status: RequestStatus) {
    return this.prisma.installationRequest.update({
      where: { id },
      data:  { status },
    });
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.installationRequest.findMany({
        skip, take: limit,
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