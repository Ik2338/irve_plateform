import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { AuthService } from '../src/auth/auth.service';

function createAuthService(prismaOverrides: any = {}) {
  const sentEmails: any[] = [];
  const prisma = {
    user: {
      findUnique: async () => null,
      create: async ({ data }: any) => ({
        id: 'user-1',
        createdAt: new Date('2026-06-19T10:00:00.000Z'),
        updatedAt: new Date('2026-06-19T10:00:00.000Z'),
        ...data,
      }),
      update: async ({ data }: any) => ({ id: 'user-1', ...data }),
      findFirst: async () => null,
      delete: async () => ({}),
      ...(prismaOverrides.user ?? {}),
    },
    installer: {
      findUnique: async () => null,
      create: async () => ({}),
      ...(prismaOverrides.installer ?? {}),
    },
  };
  const jwt = {
    sign: (payload: any) => `signed:${payload.sub}:${payload.email}:${payload.role}`,
  };
  const mail = {
    sendVerificationEmail: async (...args: any[]) => {
      sentEmails.push(args);
    },
    sendPasswordResetEmail: async () => undefined,
  };

  return {
    service: new AuthService(prisma as any, jwt as any, mail as any),
    prisma,
    sentEmails,
  };
}

test('AuthService register creates a CLIENT with email verification disabled', async () => {
  const { service, sentEmails } = createAuthService();

  const result = await service.register({
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.test',
    password: 'password123',
    role: UserRole.CLIENT,
  });

  assert.equal(result.user.email, 'ada@example.test');
  assert.equal(result.user.role, UserRole.CLIENT);
  assert.equal(result.user.emailVerified, false);
  assert.equal('password' in result.user, false);
  assert.equal(sentEmails.length, 1);
});

test('AuthService register rejects an already used email', async () => {
  const { service } = createAuthService({
    user: {
      findUnique: async () => ({ id: 'existing-user' }),
    },
  });

  await assert.rejects(
    () => service.register({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.test',
      password: 'password123',
      role: UserRole.CLIENT,
    }),
    ConflictException,
  );
});

test('AuthService validateUser rejects an incorrect password', async () => {
  const hash = await bcrypt.hash('correct-password', 4);
  const { service } = createAuthService({
    user: {
      findUnique: async () => ({
        id: 'user-1',
        email: 'ada@example.test',
        password: hash,
        role: UserRole.CLIENT,
        emailVerified: true,
      }),
    },
  });

  await assert.rejects(
    () => service.validateUser('ada@example.test', 'wrong-password'),
    UnauthorizedException,
  );
});

test('AuthService validateUser rejects a non-verified email', async () => {
  const hash = await bcrypt.hash('password123', 4);
  const { service } = createAuthService({
    user: {
      findUnique: async () => ({
        id: 'user-1',
        email: 'ada@example.test',
        password: hash,
        role: UserRole.CLIENT,
        emailVerified: false,
      }),
    },
  });

  await assert.rejects(
    () => service.validateUser('ada@example.test', 'password123'),
    (error: any) => error instanceof UnauthorizedException && error.message === 'EMAIL_NOT_VERIFIED',
  );
});

test('AuthService verifyEmail accepts a valid token and clears verification fields', async () => {
  let updateArgs: any;
  const { service } = createAuthService({
    user: {
      findUnique: async () => ({
        id: 'user-1',
        email: 'ada@example.test',
        role: UserRole.CLIENT,
        emailVerified: false,
        emailVerificationExpires: new Date(Date.now() + 60_000),
      }),
      update: async (args: any) => {
        updateArgs = args;
        return { id: 'user-1', ...args.data };
      },
    },
  });

  const result = await service.verifyEmail('valid-token');

  assert.match(result.token, /^signed:user-1:ada@example\.test:CLIENT$/);
  assert.equal(updateArgs.data.emailVerified, true);
  assert.equal(updateArgs.data.emailVerificationToken, null);
});

test('AuthService verifyEmail rejects an invalid token', async () => {
  const { service } = createAuthService({
    user: {
      findUnique: async () => null,
    },
  });

  await assert.rejects(
    () => service.verifyEmail('invalid-token'),
    BadRequestException,
  );
});
