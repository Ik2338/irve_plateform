import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { QuoteStatus } from '@prisma/client';
import { QuotesService } from '../src/quotes/quotes.service';

test('create stores a quote without vatRate and uses laborCost as amount', async () => {
  let quoteCreateArgs: any;
  const prisma = {
    installer: {
      findUnique: async () => ({ id: 'installer-1', userId: 'installer-user-1', companyName: 'IRVE Pro' }),
    },
    installationRequest: {
      findUnique: async () => ({ id: 'request-1', userId: 'client-1', status: 'SUBMITTED' }),
      update: async () => ({}),
    },
    quote: {
      findFirst: async () => null,
      create: async (args: any) => {
        quoteCreateArgs = args;
        return {
          id: 'quote-1',
          amount: args.data.amount,
          laborCost: args.data.laborCost,
          status: QuoteStatus.SENT,
          installer: { companyName: 'IRVE Pro' },
          request: { id: 'request-1' },
        };
      },
    },
    user: {
      findUnique: async () => null,
    },
  };
  const mailService = { sendQuoteNotificationToClient: async () => undefined };
  const messaging = {
    ensureConversation: async () => ({ id: 'conversation-1' }),
    createNotification: async () => ({}),
  };
  const service = new QuotesService(prisma as any, mailService as any, messaging as any);

  const quote = await service.create('installer-user-1', {
    requestId: 'request-1',
    laborCost: 1250,
    notes: 'Pose et mise en service',
  });

  assert.equal(quote.amount, 1250);
  assert.equal(quoteCreateArgs.data.amount, 1250);
  assert.equal(quoteCreateArgs.data.laborCost, 1250);
  assert.equal('vatRate' in quoteCreateArgs.data, false);
});
