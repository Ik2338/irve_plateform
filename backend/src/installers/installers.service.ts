import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateInstallerDto } from './dto/create-installer.dto';
import { SearchInstallersDto } from './dto/search-installers.dto';
import axios from 'axios';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Coordonnées par défaut (Paris) utilisées si le géocodage échoue
const DEFAULT_COORDS = { lat: 48.8566, lon: 2.3522 };

@Injectable()
export class InstallersService {
  constructor(private prisma: PrismaService) {}

  // ─── Créer OU mettre à jour (upsert) ──────────────────────────────────────
  async create(userId: string, dto: any) {
    let coords = DEFAULT_COORDS;
    try {
      coords = await this.geocodeAddress(dto);
    } catch (e) {
      console.warn('[create] Géocodage ignoré, coordonnées par défaut utilisées:', (e as any).message);
    }

    await this.prisma.$executeRaw`
      INSERT INTO "installers" (
        id, "userId", "companyName", siret, description, website,
        address, city, "postalCode", location, "interventionRadius",
        "isVerified", "isActive", "createdAt", "updatedAt"
      )
      VALUES (
        uuid_generate_v4(), ${userId}::uuid,
        ${dto.companyName}, ${dto.siret}, ${dto.description || null}, ${dto.website || null},
        ${dto.address || ''}, ${dto.city}, ${dto.postalCode},
        ST_SetSRID(ST_MakePoint(${coords.lon}, ${coords.lat}), 4326)::geography,
        ${dto.interventionRadius || 50}, false, true, NOW(), NOW()
      )
      ON CONFLICT ("userId") DO UPDATE SET
        "companyName"        = EXCLUDED."companyName",
        siret                = EXCLUDED.siret,
        description          = EXCLUDED.description,
        website              = EXCLUDED.website,
        address              = EXCLUDED.address,
        city                 = EXCLUDED.city,
        "postalCode"         = EXCLUDED."postalCode",
        location             = EXCLUDED.location,
        "interventionRadius" = EXCLUDED."interventionRadius",
        "updatedAt"          = NOW()
    `;

    const installer = await this.prisma.installer.findUnique({ where: { userId } });
    if (!installer) throw new NotFoundException('Profil introuvable après upsert');

    // ─── Project types ─────────────────────────────────────────────────────
    if (dto.projectTypes && Array.isArray(dto.projectTypes)) {
      await this.prisma.installerProjectType.deleteMany({
        where: { installerId: installer.id },
      });
      if (dto.projectTypes.length > 0) {
        await this.prisma.installerProjectType.createMany({
          data: dto.projectTypes.map((pt: string) => ({
            installerId: installer.id,
            projectType: pt as any,
          })),
          skipDuplicates: true,
        });
      }
    }

    // ─── Certifications ────────────────────────────────────────────────────
    if (dto.certifications && Array.isArray(dto.certifications)) {
      await this.prisma.installerCertification.deleteMany({
        where: { installerId: installer.id },
      });
      const validCerts = dto.certifications.filter(
        (c: any) => c.level && c.certNumber && c.expiresAt,
      );
      if (validCerts.length > 0) {
        await this.prisma.installerCertification.createMany({
          data: validCerts.map((c: any) => ({
            installerId:  installer.id,
            level:        c.level,
            certNumber:   c.certNumber,
            issuedAt:     new Date(),
            expiresAt:    new Date(c.expiresAt),
            documentUrl:  c.documentUrl || null,
            isVerified:   false,
          })),
          skipDuplicates: true,
        });
      }
    }

    return this.prisma.installer.findUnique({
      where: { userId },
      include: { certifications: true, projectTypes: true },
    });
  }

  // ─── PATCH /installers/profile ────────────────────────────────────────────
  async update(userId: string, dto: any) {
    const installer = await this.prisma.installer.findUnique({ where: { userId } });
    if (!installer) throw new NotFoundException('Profil introuvable');

    const hasLocation = dto.city || dto.postalCode || dto.address;
    if (hasLocation) {
      try {
        const coords = await this.geocodeAddress({
          address:    dto.address    || installer.address    || '',
          postalCode: dto.postalCode || installer.postalCode || '',
          city:       dto.city       || installer.city       || '',
        });
        await this.prisma.$executeRaw`
          UPDATE installers
          SET location = ST_SetSRID(ST_MakePoint(${coords.lon}, ${coords.lat}), 4326)::geography
          WHERE "userId" = ${userId}::uuid
        `;
      } catch (e) {
        console.warn('[update] Géocodage ignoré :', (e as any).message);
      }
    }

    if (dto.phone !== undefined) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { phone: dto.phone },
      });
    }

    await this.prisma.installer.update({
      where: { userId },
      data: {
        ...(dto.companyName        !== undefined && { companyName:        dto.companyName }),
        ...(dto.description        !== undefined && { description:        dto.description }),
        ...(dto.address            !== undefined && { address:            dto.address }),
        ...(dto.city               !== undefined && { city:               dto.city }),
        ...(dto.postalCode         !== undefined && { postalCode:         dto.postalCode }),
        ...(dto.interventionRadius !== undefined && { interventionRadius: dto.interventionRadius }),
        updatedAt: new Date(),
      },
    });

    return this.prisma.installer.findUnique({
      where: { userId },
      include: { certifications: true, projectTypes: true },
    });
  }

  // ─── Recherche géographique ───────────────────────────────────────────────
  async search(dto: SearchInstallersDto) {
    let coords = DEFAULT_COORDS;
    try {
      coords = await this.geocodeAddress({ address: dto.address });
    } catch (e) {
      console.warn('[search] Géocodage ignoré, recherche depuis Paris par défaut:', (e as any).message);
    }

    const installers: any[] = await this.prisma.$queryRaw`
      SELECT
        i.id, i."companyName", i.city, i."postalCode", i.description,
        i."averageRating", i."totalReviews", i."isVerified",
        u."firstName", u."lastName",
        ST_Distance(
          i.location,
          ST_SetSRID(ST_MakePoint(${coords.lon}, ${coords.lat}), 4326)::geography
        ) / 1000 AS distance_km
      FROM installers i
      JOIN users u ON u.id = i."userId"
      WHERE i."isActive" = true
        AND ST_DWithin(
          i.location,
          ST_SetSRID(ST_MakePoint(${coords.lon}, ${coords.lat}), 4326)::geography,
          i."interventionRadius" * 1000
        )
      ORDER BY distance_km ASC
      LIMIT ${dto.limit || 20}
    `;
    return installers;
  }

  // ─── Détail public ────────────────────────────────────────────────────────
  async findOne(id: string) {
    if (!id || !UUID_REGEX.test(id)) {
      throw new BadRequestException(`ID invalide : "${id}"`);
    }
    const inst = await this.prisma.installer.findUnique({
      where: { id },
      include: {
        user:           { select: { firstName: true, lastName: true, email: true, phone: true } },
        certifications: true,
        projectTypes:   true,
        reviews:        { take: 10, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!inst) throw new NotFoundException('Installateur introuvable');
    return inst;
  }

  async findByUserId(userId: string) {
    return this.prisma.installer.findUnique({
      where: { userId },
      include: { certifications: true, projectTypes: true },
    });
  }

  // ─── Géocodage API Adresse gouv.fr (avec fallback silencieux) ─────────────
  async geocodeAddress(dto: {
    address?: string;
    postalCode?: string;
    city?: string;
  }): Promise<{ lat: number; lon: number }> {

    const tryGeocode = async (q: string): Promise<{ lat: number; lon: number } | null> => {
      if (!q.trim()) return null;
      try {
        const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=1`;
        const { data } = await axios.get(url, { timeout: 5000 });
        if (data.features?.length) {
          const [lon, lat] = data.features[0].geometry.coordinates;
          console.log(`[Geocode] "${q}" → lat=${lat} lon=${lon}`);
          return { lat, lon };
        }
        console.warn(`[Geocode] Aucun résultat pour "${q}"`);
      } catch (e) {
        console.warn(`[Geocode] API indisponible pour "${q}" :`, (e as any).message);
      }
      return null;
    };

    // Niveau 1 — adresse complète
    const fullAddress = [dto.address, dto.postalCode, dto.city]
      .filter(Boolean)
      .join(', ');
    const result1 = await tryGeocode(fullAddress);
    if (result1) return result1;

    // Niveau 2 — code postal seul
    if (dto.postalCode) {
      const result2 = await tryGeocode(dto.postalCode);
      if (result2) return result2;
    }

    // Niveau 3 — ville seule
    if (dto.city) {
      const result3 = await tryGeocode(dto.city);
      if (result3) return result3;
    }

    // Niveau 4 — fallback silencieux au lieu de lancer une exception
    console.warn(`[Geocode] Fallback Paris pour : "${fullAddress}"`);
    return DEFAULT_COORDS;
  }
}