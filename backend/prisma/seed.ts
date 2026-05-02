import { PrismaClient, UserRole, CertificationLevel, ProjectType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding IRVE database...');

  // Admin
  const adminPass = await bcrypt.hash('Admin1234!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@irve-platform.fr' },
    update: {},
    create: {
      email: 'admin@irve-platform.fr',
      password: adminPass,
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.ADMIN,
      emailVerified: true,
    },
  });
  console.log('✅ Admin créé:', admin.email);

  // Client test
  const clientPass = await bcrypt.hash('Client1234!', 12);
  await prisma.user.upsert({
    where: { email: 'client@test.fr' },
    update: {},
    create: {
      email: 'client@test.fr',
      password: clientPass,
      firstName: 'Marie',
      lastName: 'Dupont',
      phone: '0612345678',
      role: UserRole.CLIENT,
      emailVerified: true,
    },
  });

  // Installateur test
  const installerPass = await bcrypt.hash('Install1234!', 12);
  const installerUser = await prisma.user.upsert({
    where: { email: 'installateur@test.fr' },
    update: {},
    create: {
      email: 'installateur@test.fr',
      password: installerPass,
      firstName: 'Pierre',
      lastName: 'Martin',
      phone: '0687654321',
      role: UserRole.INSTALLER,
      emailVerified: true,
    },
  });

  // Profil installateur avec localisation Paris (lon, lat)
  const existingInstaller = await prisma.installer.findUnique({ where: { userId: installerUser.id } });
  if (!existingInstaller) {
    await prisma.$executeRaw`
      INSERT INTO "installers" (id, "userId", "companyName", siret, description, address, city, "postalCode",
        location, "interventionRadius", "isVerified", "isActive", "averageRating", "totalReviews", "createdAt", "updatedAt")
      VALUES (
        uuid_generate_v4(), ${installerUser.id}::uuid,
        'ElectroPro SARL', '12345678901234',
        'Spécialiste IRVE P1/P2/P3 - 10 ans d''expérience en Île-de-France',
        '42 Avenue de la République', 'Paris', '75011',
        ST_SetSRID(ST_MakePoint(2.3717, 48.8628), 4326)::geography,
        80, true, true, 4.7, 23, NOW(), NOW()
      )
    `;

    const installer = await prisma.installer.findUnique({ where: { userId: installerUser.id } });
    if (installer) {
      await prisma.installerCertification.createMany({
        data: [
          { installerId: installer.id, level: CertificationLevel.IRVE_P1, certNumber: 'IRVE-P1-2024-001', issuedAt: new Date('2024-01-01'), expiresAt: new Date('2026-01-01'), isVerified: true },
          { installerId: installer.id, level: CertificationLevel.IRVE_P2, certNumber: 'IRVE-P2-2024-001', issuedAt: new Date('2024-01-01'), expiresAt: new Date('2026-01-01'), isVerified: true },
        ],
        skipDuplicates: true,
      });

      await prisma.installerProjectType.createMany({
        data: [
          { installerId: installer.id, projectType: ProjectType.RESIDENTIAL },
          { installerId: installer.id, projectType: ProjectType.COMMERCIAL },
          { installerId: installer.id, projectType: ProjectType.COPROPRIETE },
        ],
        skipDuplicates: true,
      });
    }
  }

  console.log('✅ Seed terminé !');
  console.log('\n📋 Comptes de test :');
  console.log('  Admin     : admin@irve-platform.fr / Admin1234!');
  console.log('  Client    : client@test.fr / Client1234!');
  console.log('  Installateur : installateur@test.fr / Install1234!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
