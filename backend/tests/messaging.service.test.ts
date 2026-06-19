import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { NotificationType } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';
import { MessagingService } from '../src/messaging/messaging.service';

function createPrismaMock() {
  const createdMessages: any[] = [];
  const notifications: any[] = [];
  const conversation = {
    id: 'conversation-1',
    participants: [{ userId: 'sender-1' }, { userId: 'recipient-1' }],
  };

  return {
    createdMessages,
    notifications,
    prisma: {
      conversation: {
        findUnique: async () => conversation,
        update: async ({ data }: any) => ({ ...conversation, ...data }),
      },
      message: {
        create: async ({ data }: any) => {
          const message = {
            id: 'message-1',
            ...data,
            createdAt: new Date('2026-06-19T12:00:00.000Z'),
            sender: { firstName: 'Ada', lastName: 'Lovelace' },
          };
          createdMessages.push(message);
          return message;
        },
      },
      notification: {
        create: async ({ data }: any) => {
          notifications.push(data);
          return data;
        },
      },
    },
  };
}

test('sendMessage accepts image-only attachments and creates an attachment notification', async () => {
  const { prisma, createdMessages, notifications } = createPrismaMock();
  const service = new MessagingService(prisma as any);

  const message = await service.sendMessage('sender-1', 'conversation-1', '', [
    { fileName: 'photo.jpg', mimeType: 'image/jpeg', dataUrl: 'data:image/jpeg;base64,abc' },
  ]);

  assert.equal(message.body, '');
  assert.equal(createdMessages[0].attachments[0].fileName, 'photo.jpg');
  assert.equal(notifications[0].type, NotificationType.NEW_MESSAGE);
  assert.match(notifications[0].body, /Piece jointe/);
});

test('sendMessage rejects an empty message without attachments', async () => {
  const { prisma } = createPrismaMock();
  const service = new MessagingService(prisma as any);

  await assert.rejects(
    () => service.sendMessage('sender-1', 'conversation-1', '   ', []),
    BadRequestException,
  );
});

test('listConversations loads unread counts with one grouped query and keeps unread first', async () => {
  let countCalls = 0;
  let groupByArgs: any;
  const prisma = {
    conversation: {
      findMany: async () => [
        {
          id: 'read-new',
          updatedAt: new Date('2026-06-19T12:00:00.000Z'),
          messages: [{ createdAt: new Date('2026-06-19T12:00:00.000Z'), body: 'recent' }],
        },
        {
          id: 'unread-old',
          updatedAt: new Date('2026-06-18T12:00:00.000Z'),
          messages: [{ createdAt: new Date('2026-06-18T12:00:00.000Z'), body: 'older' }],
        },
      ],
    },
    message: {
      count: async () => {
        countCalls += 1;
        return 0;
      },
      groupBy: async (args: any) => {
        groupByArgs = args;
        return [{ conversationId: 'unread-old', _count: { _all: 2 } }];
      },
    },
  };
  const service = new MessagingService(prisma as any);

  const conversations = await service.listConversations('user-1');

  assert.equal(countCalls, 0);
  assert.deepEqual(groupByArgs.where.conversationId.in, ['read-new', 'unread-old']);
  assert.deepEqual(conversations.map((conversation: any) => conversation.id), ['unread-old', 'read-new']);
  assert.equal((conversations[0] as any).unreadCount, 2);
});
