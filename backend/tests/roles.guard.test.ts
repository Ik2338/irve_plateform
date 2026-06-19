import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { UserRole } from '@prisma/client';
import { RolesGuard } from '../src/common/guards/roles.guard';

function createContext(role: UserRole) {
  return {
    getHandler: () => 'handler',
    getClass: () => 'class',
    switchToHttp: () => ({
      getRequest: () => ({ user: { role } }),
    }),
  };
}

test('RolesGuard allows access when no role metadata is required', () => {
  const reflector = { getAllAndOverride: () => undefined };
  const guard = new RolesGuard(reflector as any);

  assert.equal(guard.canActivate(createContext(UserRole.CLIENT) as any), true);
});

test('RolesGuard checks the authenticated user role', () => {
  const reflector = { getAllAndOverride: () => [UserRole.ADMIN] };
  const guard = new RolesGuard(reflector as any);

  assert.equal(guard.canActivate(createContext(UserRole.ADMIN) as any), true);
  assert.equal(guard.canActivate(createContext(UserRole.CLIENT) as any), false);
});
