import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class MatchingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Algorithme de matching PostGIS :
   * - Cherche les installateurs dans le rayon d'intervention
   * - Score basé sur : proximité (40%) + certifications (40%) + note moyenne (20%)
   */
  async matchRequest(requestId: string) {
    const request = await this.prisma.installationRequest.findUnique({ where: { id: requestId } });
    if (!request) return [];

    const matches: any[] = await this.prisma.$queryRaw`
      SELECT
        i.id AS "installerId",
        i."companyName",
        i.city,
        i."averageRating",
        ST_Distance(i.location, r.location) / 1000 AS distance_km,
        EXISTS(
          SELECT 1 FROM installer_project_types ipt
          WHERE ipt."installerId" = i.id AND ipt."projectType" = ${request.projectType}::"ProjectType"
        ) AS matches_project_type,
        (
          SELECT COUNT(*) FROM installer_certifications ic
          WHERE ic."installerId" = i.id AND ic."isVerified" = true
        ) AS cert_count,
        -- Score composite
        ROUND((
          GREATEST(0, 100 - (ST_Distance(i.location, r.location) / 1000)) * 0.4 +
          (CASE WHEN EXISTS(
            SELECT 1 FROM installer_project_types ipt
            WHERE ipt."installerId" = i.id AND ipt."projectType" = ${request.projectType}::"ProjectType"
          ) THEN 40 ELSE 0 END) +
          COALESCE(i."averageRating", 3) / 5.0 * 20
        )::numeric, 2) AS score
      FROM installers i
      CROSS JOIN installation_requests r
      WHERE r.id = ${requestId}::uuid
        AND i."isActive" = true
        AND i."isVerified" = true
        AND ST_DWithin(i.location, r.location, i."interventionRadius" * 1000)
      ORDER BY score DESC
      LIMIT 5
    `;

    // Persiste les matches
    if (matches.length > 0) {
      await this.prisma.requestMatch.createMany({
        data: matches.map((m) => ({
          requestId,
          installerId: m.installerId,
          distance: parseFloat(m.distance_km),
          score: parseFloat(m.score),
        })),
        skipDuplicates: true,
      });

      await this.prisma.installationRequest.update({
        where: { id: requestId },
        data: { status: 'MATCHED' },
      });
    }

    return matches;
  }

  // Leads disponibles pour un installateur (demandes dans sa zone)
  async getInstallerLeads(userId: string) {
    const installer = await this.prisma.installer.findUnique({ where: { userId } });
    if (!installer) return [];

    const leads: any[] = await this.prisma.$queryRaw`
      SELECT
        r.id,
        r."userId",
        r."projectType",
        r."powerLevel",
        r.quantity,
        r.address,
        r.city,
        r."postalCode",
        r.description,
        r."hasExistingPanel",
        r."parkingType",
        r.urgency,
        r.status,
        r."createdAt",
        r."updatedAt",
        r.connectors,
        r."parkingAccess",
        r."parkingSpots",
        r."installerNote",
        r."isTargeted",
        r."respondedAt",
        r."targetInstallerId",
        r.source,
        r."contactPreference",
        r."desiredInstallDate",
        r."indicativeBudget",
        r."evModel",
        r."panelDistanceMeters",
        r."drillingCount",
        r."structuralDrillingCount",
        r."drillingThickness",
        r."reception4g",
        r."hasInternetBox",
        r."internetBoxDistanceMeters",
        r."mediaAttachments",
        ST_Distance(i.location, r.location) / 1000 AS distance_km,
        json_build_object(
          'id', u.id,
          'firstName', u."firstName",
          'lastName', u."lastName",
          'email', u.email,
          'phone', u.phone
        ) AS user
      FROM installation_requests r
      CROSS JOIN installers i
      JOIN users u ON u.id = r."userId"
      WHERE i.id = ${installer.id}::uuid
        AND r.status IN ('SUBMITTED', 'MATCHED')
        AND (
          r."targetInstallerId" = i.id
          OR (
            r.source <> 'DIRECT'
            AND ST_DWithin(i.location, r.location, i."interventionRadius" * 1000)
          )
        )
      ORDER BY r."createdAt" DESC
      LIMIT 50
    `;

    return leads;
  }
}
