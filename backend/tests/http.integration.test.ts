import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { InstallersController } from '../src/installers/installers.controller';
import { InstallersService } from '../src/installers/installers.service';
import { MessagingController } from '../src/messaging/messaging.controller';
import { MessagingService } from '../src/messaging/messaging.service';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';

async function createHttpApp(providers: any[]): Promise<{ app: INestApplication; baseUrl: string }> {
  const moduleRef = await Test.createTestingModule({
    controllers: [InstallersController, MessagingController],
    providers,
  })
    .overrideGuard(JwtAuthGuard)
    .useValue({
      canActivate: (context: any) => {
        context.switchToHttp().getRequest().user = {
          id: 'user-integration-1',
          role: 'CLIENT',
        };
        return true;
      },
    })
    .compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(0);
  const address = app.getHttpServer().address();
  return { app, baseUrl: `http://127.0.0.1:${address.port}` };
}

test('HTTP integration: GET /installers/search validates and forwards filters', async () => {
  let receivedDto: any;
  const installersService = {
    search: async (dto: any) => {
      receivedDto = dto;
      return [{ id: 'installer-1', companyName: 'IRVE Pro' }];
    },
    findOne: async () => ({}),
    findByUserId: async () => ({}),
    create: async () => ({}),
    update: async () => ({}),
  };
  const messagingService = {};
  const { app, baseUrl } = await createHttpApp([
    { provide: InstallersService, useValue: installersService },
    { provide: MessagingService, useValue: messagingService },
  ]);

  try {
    const response = await fetch(
      `${baseUrl}/installers/search?address=Paris&projectType=RESIDENTIAL&certificationLevel=IRVE_P2&radius=25&limit=5`,
    );
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, [{ id: 'installer-1', companyName: 'IRVE Pro' }]);
    assert.equal(receivedDto.address, 'Paris');
    assert.equal(receivedDto.projectType, 'RESIDENTIAL');
    assert.equal(receivedDto.certificationLevel, 'IRVE_P2');
    assert.equal(receivedDto.radius, 25);
    assert.equal(receivedDto.limit, 5);
  } finally {
    await app.close();
  }
});

test('HTTP integration: messaging endpoints use authenticated user and accept image-only messages', async () => {
  const calls: any[] = [];
  const installersService = {
    search: async () => [],
    findOne: async () => ({}),
  };
  const messagingService = {
    listConversations: async (userId: string) => {
      calls.push(['list', userId]);
      return [{ id: 'conversation-1', unreadCount: 1 }];
    },
    sendMessage: async (userId: string, conversationId: string, body: string, attachments: any[]) => {
      calls.push(['send', userId, conversationId, body, attachments]);
      return { id: 'message-1', body, attachments };
    },
    unreadTotal: async () => ({ total: 0 }),
    findOne: async () => ({}),
    startConversation: async () => ({}),
    markAllNotificationsRead: async () => ({}),
    listNotifications: async () => [],
    markNotificationRead: async () => ({}),
  };
  const { app, baseUrl } = await createHttpApp([
    { provide: InstallersService, useValue: installersService },
    { provide: MessagingService, useValue: messagingService },
  ]);

  try {
    const listResponse = await fetch(`${baseUrl}/conversations`);
    const listBody = await listResponse.json();
    assert.equal(listResponse.status, 200);
    assert.deepEqual(listBody, [{ id: 'conversation-1', unreadCount: 1 }]);

    const sendResponse = await fetch(`${baseUrl}/conversations/conversation-1/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attachments: [
          { fileName: 'borne.jpg', mimeType: 'image/jpeg', dataUrl: 'data:image/jpeg;base64,abc' },
        ],
      }),
    });
    const sendBody = await sendResponse.json();

    assert.equal(sendResponse.status, 201);
    assert.equal(sendBody.attachments[0].fileName, 'borne.jpg');
    assert.deepEqual(calls[0], ['list', 'user-integration-1']);
    assert.equal(calls[1][0], 'send');
    assert.equal(calls[1][1], 'user-integration-1');
    assert.equal(calls[1][2], 'conversation-1');
    assert.equal(calls[1][3], undefined);
    assert.equal(calls[1][4][0].mimeType, 'image/jpeg');
  } finally {
    await app.close();
  }
});
