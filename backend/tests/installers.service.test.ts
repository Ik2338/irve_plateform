import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { CertificationLevel, ProjectType } from '@prisma/client';
import { InstallersService } from '../src/installers/installers.service';

function createService() {
  const queries: string[] = [];
  const prisma = {
    $queryRawUnsafe: async (query: string) => {
      queries.push(query);
      return [];
    },
  };
  const service = new InstallersService(prisma as any);
  return { service, queries };
}

test('search without address filters by certificationLevel and projectType', async () => {
  const { service, queries } = createService();

  await service.search({
    certificationLevel: CertificationLevel.IRVE_P2,
    projectType: ProjectType.RESIDENTIAL,
    limit: 12,
  });

  assert.match(queries[0], /c\.level = 'IRVE_P2'/);
  assert.match(queries[0], /pt\."projectType" = 'RESIDENTIAL'/);
  assert.match(queries[0], /LIMIT 12/);
});

test('search with address applies requested radius together with installer intervention radius', async () => {
  const { service, queries } = createService();
  service.geocodeAddress = async () => ({ lat: 48.8566, lon: 2.3522 });

  await service.search({
    address: 'Paris',
    certificationLevel: CertificationLevel.IRVE_P1,
    radius: 25,
  });

  assert.match(queries[0], /LEAST\(i\."interventionRadius", 25\) \* 1000/);
  assert.match(queries[0], /c\.level = 'IRVE_P1'/);
  assert.match(queries[0], /ORDER BY distance_km ASC/);
});
