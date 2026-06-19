import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import {
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ProjectType, PowerLevel, RequestStatus } from '@prisma/client';
import { RequestsService } from '../src/requests/requests.service';

const baseDto = {
  projectType: ProjectType.RESIDENTIAL,
  powerLevel: PowerLevel.P2,
  quantity: 1,
  address: '1 rue de Test',
  city: 'Paris',
  postalCode: '75001',
};

function createRequestsService(overrides: any = {}) {
  const calls: any[] = [];
  const savedRequest = {
    id: 'request-1',
    userId: 'client-1',
    status: RequestStatus.SUBMITTED,
    source: 'ZONE',
    ...overrides.savedRequest,
  };
  const targetedInstaller = overrides.targetedInstaller ?? null;

  const prisma = {
    installer: {
      findUnique: async () => targetedInstaller,
      ...(overrides.prisma?.installer ?? {}),
    },
    user: {
      findUnique: async () => ({ firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.test' }),
      ...(overrides.prisma?.user ?? {}),
    },
    installationRequest: {
      findUnique: async ({ where }: any) => {
        if (where.id === 'missing-request') return null;
        return savedRequest;
      },
      delete: async ({ where }: any) => {
        calls.push(['delete', where.id]);
      },
      update: async ({ data }: any) => ({ ...savedRequest, ...data }),
      ...(overrides.prisma?.installationRequest ?? {}),
    },
    $queryRaw: async () => [{ id: savedRequest.id, allowed: false }],
    $executeRaw: async () => undefined,
    ...(overrides.prisma ?? {}),
  };
  const installersService = {
    geocodeAddress: async () => ({ lat: 48.8566, lon: 2.3522 }),
    ...(overrides.installersService ?? {}),
  };
  const mailService = {
    sendRequestToInstaller: async (...args: any[]) => {
      calls.push(['sendRequestToInstaller', args]);
    },
    sendZoneRequestNotification: async (...args: any[]) => {
      calls.push(['sendZoneRequestNotification', args]);
    },
    sendResponseToClient: async () => undefined,
    ...(overrides.mailService ?? {}),
  };
  const messagingService = {
    ensureConversation: async (input: any) => {
      calls.push(['ensureConversation', input]);
      return { id: 'conversation-1' };
    },
    createNotification: async (input: any) => {
      calls.push(['createNotification', input]);
      return input;
    },
    ...(overrides.messagingService ?? {}),
  };

  return {
    calls,
    prisma,
    service: new RequestsService(
      prisma as any,
      installersService as any,
      mailService as any,
      messagingService as any,
    ),
  };
}

test('RequestsService create stores a SUBMITTED request', async () => {
  const { service } = createRequestsService();

  const result = await service.create('client-1', baseDto);

  assert.equal(result.id, 'request-1');
  assert.equal(result.status, RequestStatus.SUBMITTED);
});

test('RequestsService remove rejects deletion when request is IN_PROGRESS', async () => {
  const { service } = createRequestsService({
    savedRequest: { status: RequestStatus.IN_PROGRESS },
  });

  await assert.rejects(
    () => service.remove('request-1', 'client-1'),
    BadRequestException,
  );
});

test('RequestsService findOne rejects access for a non-owner and non-eligible installer', async () => {
  const { service } = createRequestsService({
    savedRequest: {
      userId: 'client-owner',
      source: 'DIRECT',
      targetInstallerId: 'target-installer',
      conversations: [],
      quotes: [],
      user: { id: 'client-owner' },
    },
  });

  await assert.rejects(
    () => service.findOne('request-1', 'another-user', 'other-installer'),
    ForbiddenException,
  );
});

test('RequestsService create targeted request creates conversation and notifies installer', async () => {
  const { service, calls } = createRequestsService({
    targetedInstaller: {
      id: 'installer-1',
      user: {
        id: 'installer-user-1',
        email: 'installer@example.test',
        firstName: 'Nikola',
        lastName: 'Tesla',
      },
    },
    savedRequest: {
      id: 'request-targeted-1',
      userId: 'client-1',
      status: RequestStatus.SUBMITTED,
      targetInstallerId: 'installer-1',
      isTargeted: true,
      source: 'DIRECT',
    },
  });

  const result = await service.create('client-1', {
    ...baseDto,
    targetInstallerId: 'installer-1',
  });

  assert.equal(result.id, 'request-targeted-1');
  assert.equal(result.source, 'DIRECT');
  assert.equal(calls.some(([name]) => name === 'ensureConversation'), true);
  assert.equal(calls.some(([name]) => name === 'createNotification'), true);
  assert.equal(calls.some(([name]) => name === 'sendRequestToInstaller'), true);
});
