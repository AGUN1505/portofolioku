// scripts/test-email-auth-zero-db.ts
// Comprehensive Zero-DB verification test suite for Email-Based Authentication.
// Strictly adheres to Zero-DB guardrails: 0 PostgreSQL connections, 0 DB mutations.

import * as assert from 'node:assert/strict';
import type { PrismaClient } from '@prisma/client';
import type { Admin } from '../src/domain/entities/admin';
import type {
  IAdminRepository,
  AdminAuthRecord,
  CreateAdminInput,
  UpdateAdminProfileData,
} from '../src/domain/repositories/admin.repository';
import { PrismaAdminRepository } from '../src/infrastructure/repositories/prisma-admin.repository';
import { MemoryRateLimiter } from '../src/infrastructure/auth/memory-rate-limiter';
import { PasswordService } from '../src/infrastructure/auth/password.service';
import { LoginAdminUseCase } from '../src/application/use-cases/auth/login-admin.use-case';

// In-Memory Repository implementing IAdminRepository without any database connection
class InMemoryAdminRepo implements IAdminRepository {
  private records = new Map<string, { admin: Admin; passwordHash: string; sessionVersion: number }>();

  public async findById(id: string): Promise<Admin | null> {
    const item = this.records.get(id);
    return item ? { ...item.admin } : null;
  }

  public async findByUsername(normalizedUsername: string): Promise<Admin | null> {
    const target = normalizedUsername.toLowerCase().trim();
    for (const r of this.records.values()) {
      if (r.admin.username === target) return { ...r.admin };
    }
    return null;
  }

  public async findByEmail(normalizedEmail: string): Promise<Admin | null> {
    const target = normalizedEmail.toLowerCase().trim();
    for (const r of this.records.values()) {
      if (r.admin.email === target) return { ...r.admin };
    }
    return null;
  }

  public async findAuthByUsername(normalizedUsername: string): Promise<AdminAuthRecord | null> {
    const target = normalizedUsername.toLowerCase().trim();
    for (const r of this.records.values()) {
      if (r.admin.username === target) {
        return {
          admin: { ...r.admin },
          passwordHash: r.passwordHash,
          sessionVersion: r.sessionVersion,
        };
      }
    }
    return null;
  }

  public async findAuthByEmail(normalizedEmail: string): Promise<AdminAuthRecord | null> {
    const target = normalizedEmail.toLowerCase().trim();
    for (const r of this.records.values()) {
      if (r.admin.email === target) {
        return {
          admin: { ...r.admin },
          passwordHash: r.passwordHash,
          sessionVersion: r.sessionVersion,
        };
      }
    }
    return null;
  }

  public async findAuthById(id: string): Promise<AdminAuthRecord | null> {
    const item = this.records.get(id);
    if (!item) return null;
    return {
      admin: { ...item.admin },
      passwordHash: item.passwordHash,
      sessionVersion: item.sessionVersion,
    };
  }

  public async getSessionVersion(id: string): Promise<number | null> {
    return this.records.get(id)?.sessionVersion ?? null;
  }

  public async incrementSessionVersion(id: string): Promise<number> {
    const item = this.records.get(id);
    if (!item) throw new Error('Admin not found');
    item.sessionVersion += 1;
    return item.sessionVersion;
  }

  public async updateProfile(id: string, data: UpdateAdminProfileData): Promise<Admin> {
    const item = this.records.get(id);
    if (!item) throw new Error('Admin not found');
    item.admin = {
      ...item.admin,
      ...(data.username !== undefined ? { username: data.username.toLowerCase().trim() } : {}),
      ...(data.email !== undefined ? { email: data.email ? data.email.toLowerCase().trim() : null } : {}),
      updatedAt: new Date(),
    };
    return { ...item.admin };
  }

  public async updatePassword(id: string, passwordHash: string): Promise<{ admin: Admin; sessionVersion: number }> {
    const item = this.records.get(id);
    if (!item) throw new Error('Admin not found');
    item.passwordHash = passwordHash;
    item.sessionVersion += 1;
    item.admin = { ...item.admin, updatedAt: new Date() };
    return { admin: { ...item.admin }, sessionVersion: item.sessionVersion };
  }

  public async count(): Promise<number> {
    return this.records.size;
  }

  public async create(data: CreateAdminInput): Promise<Admin> {
    if (this.records.size > 0) throw new Error('Single admin policy');
    const id = 'admin_id_1';
    const now = new Date();
    const admin: Admin = {
      id,
      username: data.username.toLowerCase().trim(),
      email: data.email ? data.email.toLowerCase().trim() : null,
      createdAt: now,
      updatedAt: now,
    };
    this.records.set(id, {
      admin,
      passwordHash: data.passwordHash,
      sessionVersion: 1,
    });
    return { ...admin };
  }
}

async function runEmailAuthVerification(): Promise<void> {
  console.log('================================================================');
  console.log('   PORTFOLIO CMS — EMAIL-BASED AUTH ZERO-DB TEST SUITE          ');
  console.log('================================================================\n');

  // Guardrail pre-flight: ensure prisma is uninstantiated
  assert.strictEqual(
    (globalThis as unknown as { prisma?: unknown }).prisma,
    undefined,
    'Prisma client must not be instantiated'
  );
  console.log('0. Zero-DB Guardrail Pre-flight: PASS (0 DB connections)\n');

  // ---------------------------------------------------------------------------
  // SUITE 1: IAdminRepository & PrismaAdminRepository findAuthByEmail
  // ---------------------------------------------------------------------------
  console.log('1. Testing PrismaAdminRepository.findAuthByEmail (Zero-DB Mock)...');
  {
    let lastWhereClause: unknown = null;

    const mockClient = {
      admin: {
        findUnique: async (args: { where: { email?: string; id?: string; username?: string }; select: unknown }) => {
          lastWhereClause = args.where;
          if (args.where.email === 'registered@example.com') {
            return {
              id: 'cuid_admin_123',
              username: 'superadmin',
              email: 'registered@example.com',
              passwordHash: '$2b$12$securehashvalue123456789012345678901234567890123456',
              sessionVersion: 2,
              createdAt: new Date('2026-01-01T00:00:00Z'),
              updatedAt: new Date('2026-01-02T00:00:00Z'),
            };
          }
          return null;
        },
      },
    } as unknown as PrismaClient;

    const repo = new PrismaAdminRepository(mockClient);

    // 1.1: Invalid / empty inputs return null
    assert.strictEqual(await repo.findAuthByEmail(''), null, 'Empty string must return null');
    assert.strictEqual(await repo.findAuthByEmail(null as unknown as string), null, 'Null must return null');
    assert.strictEqual(await repo.findAuthByEmail(undefined as unknown as string), null, 'Undefined must return null');
    assert.strictEqual(await repo.findAuthByEmail(123 as unknown as string), null, 'Non-string must return null');

    // 1.2: Normalization (lowercase + trim)
    const result = await repo.findAuthByEmail('   Registered@Example.COM   ');
    assert.ok(result !== null, 'Should find admin with unnormalized email');
    assert.deepStrictEqual(lastWhereClause, { email: 'registered@example.com' });
    assert.strictEqual(result.admin.id, 'cuid_admin_123');
    assert.strictEqual(result.admin.username, 'superadmin');
    assert.strictEqual(result.admin.email, 'registered@example.com');
    assert.strictEqual(result.passwordHash, '$2b$12$securehashvalue123456789012345678901234567890123456');
    assert.strictEqual(result.sessionVersion, 2);

    // 1.3: Admin entity purity (no passwordHash on domain entity)
    const adminObj = result.admin as unknown as Record<string, unknown>;
    assert.strictEqual(adminObj.passwordHash, undefined, 'Admin domain entity must never expose passwordHash');
    assert.strictEqual('passwordHash' in adminObj, false, 'passwordHash property must not exist on Admin entity');

    // 1.4: Non-existent email returns null
    const notFound = await repo.findAuthByEmail('unknown@example.com');
    assert.strictEqual(notFound, null, 'Non-existent email must return null');

    console.log('   ✓ findAuthByEmail normalization, entity purity, and credentials mapping verified.');
  }

  // ---------------------------------------------------------------------------
  // SUITE 2: MemoryRateLimiter Email Dimension Keys & Isolation
  // ---------------------------------------------------------------------------
  console.log('\n2. Testing MemoryRateLimiter Email Keys and Multi-Dimension Isolation...');
  {
    // 2.1: Key generation
    const emailKeys = MemoryRateLimiter.buildEmailKeys('  User.Admin@Company.ORG  ', '192.168.1.1');
    assert.strictEqual(emailKeys.emailKey, 'email:user.admin@company.org');
    assert.strictEqual(emailKeys.ipKey, 'ip:192.168.1.1');
    assert.strictEqual(emailKeys.compositeKey, 'email_ip:user.admin@company.org#192.168.1.1');

    const dynEmailKeys = MemoryRateLimiter.buildKeys('  User.Admin@Company.ORG  ', '192.168.1.1');
    assert.strictEqual(dynEmailKeys.emailKey, 'email:user.admin@company.org');
    assert.strictEqual(dynEmailKeys.usernameKey, 'email:user.admin@company.org');
    assert.strictEqual(dynEmailKeys.compositeKey, 'email_ip:user.admin@company.org#192.168.1.1');

    const usernameKeys = MemoryRateLimiter.buildKeys('superadmin', '192.168.1.1');
    assert.strictEqual(usernameKeys.usernameKey, 'usr:superadmin');
    assert.strictEqual(usernameKeys.emailKey, undefined);
    assert.strictEqual(usernameKeys.compositeKey, 'usr_ip:superadmin#192.168.1.1');

    // 2.2: Email rate-limiting multi-dimension isolation
    const limiter = new MemoryRateLimiter({ maxAttempts: 3, windowMs: 15000 });
    const targetEmail = 'admin@security.io';
    const targetIP = '10.0.0.1';

    // 3 failed attempts
    await limiter.recordMultiDimensionFailure(targetEmail, targetIP);
    await limiter.recordMultiDimensionFailure(targetEmail, targetIP);
    await limiter.recordMultiDimensionFailure(targetEmail, targetIP);

    // Target email is blocked
    const checkTarget = await limiter.checkMultiDimension(targetEmail, targetIP);
    assert.strictEqual(checkTarget.allowed, false, 'Target email must be blocked after 3 failures');
    assert.strictEqual(checkTarget.blockedDimension, 'email', 'Blocked dimension must be email');
    assert.ok(checkTarget.retryAfterMs > 0, 'Retry-after must be greater than 0');

    // Target email from different IP is still blocked by email dimension
    const checkDiffIP = await limiter.checkMultiDimension(targetEmail, '10.0.0.99');
    assert.strictEqual(checkDiffIP.allowed, false, 'Target email must be blocked even from another IP');
    assert.strictEqual(checkDiffIP.blockedDimension, 'email');

    // Different email from SAME abusive IP is blocked by IP dimension
    const checkSameIPDiffEmail = await limiter.checkMultiDimension('innocent@security.io', targetIP);
    assert.strictEqual(checkSameIPDiffEmail.allowed, false, 'Abusive IP must block attempts for different emails');
    assert.strictEqual(checkSameIPDiffEmail.blockedDimension, 'ip');

    // Reset clears email and IP
    await limiter.resetMultiDimension(targetEmail, targetIP);
    const checkAfterReset = await limiter.checkMultiDimension(targetEmail, targetIP);
    assert.strictEqual(checkAfterReset.allowed, true, 'Target must be allowed after resetMultiDimension');

    // Dedicated email methods test
    await limiter.recordMultiDimensionEmailFailure(targetEmail, targetIP);
    await limiter.recordMultiDimensionEmailFailure(targetEmail, targetIP);
    await limiter.recordMultiDimensionEmailFailure(targetEmail, targetIP);
    const emailRes = await limiter.checkMultiDimensionEmail(targetEmail, targetIP);
    assert.strictEqual(emailRes.allowed, false);
    assert.strictEqual(emailRes.blockedDimension, 'email');
    await limiter.resetMultiDimensionEmail(targetEmail, targetIP);
    const emailResReset = await limiter.checkMultiDimensionEmail(targetEmail, targetIP);
    assert.strictEqual(emailResReset.allowed, true);

    console.log('   ✓ MemoryRateLimiter email keys, IP dimension, and composite keys verified.');
  }

  // ---------------------------------------------------------------------------
  // SUITE 3: LoginAdminUseCase Email-Based Authentication & Timing-Safe Security
  // ---------------------------------------------------------------------------
  console.log('\n3. Testing LoginAdminUseCase Email Authentication & Timing Safety...');
  {
    const repo = new InMemoryAdminRepo();
    const passwordService = new PasswordService();
    const rateLimiter = new MemoryRateLimiter({ maxAttempts: 5, windowMs: 60000 });
    const loginUseCase = new LoginAdminUseCase(repo, passwordService, rateLimiter);

    const validPassword = 'Secure#P@ssw0rd2026';
    const passwordHash = await passwordService.hash(validPassword);
    const adminEmail = 'master@domain.com';

    await repo.create({
      username: 'masteradmin',
      email: adminEmail,
      passwordHash,
    });

    // 3.1: Missing email rejection
    const emptyEmail = await loginUseCase.execute({
      email: '',
      password: validPassword,
      clientIP: '127.0.0.1',
    });
    assert.strictEqual(emptyEmail.success, false);
    assert.strictEqual(emptyEmail.statusCode, 400);
    assert.strictEqual(emptyEmail.error, 'Invalid email or password');

    // 3.2: Missing password rejection
    const emptyPassword = await loginUseCase.execute({
      email: adminEmail,
      password: '',
      clientIP: '127.0.0.1',
    });
    assert.strictEqual(emptyPassword.success, false);
    assert.strictEqual(emptyPassword.statusCode, 400);
    assert.strictEqual(emptyPassword.error, 'Invalid email or password');

    // 3.3: Invalid email format rejections
    const invalidFormats = [
      'not-an-email',
      'user@',
      '@domain.com',
      'user@domain',
      'user space@domain.com',
      'a'.repeat(250) + '@example.com', // > 254 chars
    ];

    for (const invalid of invalidFormats) {
      const res = await loginUseCase.execute({
        email: invalid,
        password: validPassword,
        clientIP: '127.0.0.1',
      });
      assert.strictEqual(res.success, false, `Format "${invalid}" should be rejected`);
      assert.strictEqual(res.statusCode, 400, `Format "${invalid}" should yield 400`);
      assert.strictEqual(res.error, 'Invalid email format', `Format "${invalid}" should yield Invalid email format`);
    }

    // 3.4: Case-insensitive email normalization
    const normalizedRes = await loginUseCase.execute({
      email: '  MaStEr@DoMaIn.CoM  ',
      password: validPassword,
      clientIP: '127.0.0.1',
    });
    assert.strictEqual(normalizedRes.success, true, 'Case-insensitive email login must succeed');
    assert.strictEqual(normalizedRes.admin?.email, 'master@domain.com');
    assert.strictEqual(normalizedRes.sessionVersion, 1);

    // 3.5: Non-existent email -> timing-safe comparison & generic 401
    let dummyCompareCalled = false;
    const trackingPasswordService = new Proxy(passwordService, {
      get(target, prop, receiver) {
        if (prop === 'performDummyCompare') {
          return async (password: string) => {
            dummyCompareCalled = true;
            return target.performDummyCompare(password);
          };
        }
        return Reflect.get(target, prop, receiver);
      },
    });

    const timingUseCase = new LoginAdminUseCase(repo, trackingPasswordService, rateLimiter);
    const nonExistentRes = await timingUseCase.execute({
      email: 'ghost@domain.com',
      password: 'AnyPassword123!',
      clientIP: '127.0.0.1',
    });
    assert.strictEqual(nonExistentRes.success, false);
    assert.strictEqual(nonExistentRes.statusCode, 401);
    assert.strictEqual(nonExistentRes.error, 'Invalid email or password');
    assert.strictEqual(dummyCompareCalled, true, 'performDummyCompare MUST be called when email not found');

    // 3.6: Wrong password for existing admin -> identical generic 401
    const wrongPasswordRes = await loginUseCase.execute({
      email: adminEmail,
      password: 'WrongPassword123!',
      clientIP: '127.0.0.1',
    });
    assert.strictEqual(wrongPasswordRes.success, false);
    assert.strictEqual(wrongPasswordRes.statusCode, 401);
    assert.strictEqual(wrongPasswordRes.error, 'Invalid email or password');

    // 3.7: Error message equality (prevents email enumeration)
    assert.strictEqual(
      nonExistentRes.error,
      wrongPasswordRes.error,
      'Error message for non-existent email and bad password must be strictly identical'
    );

    // 3.8: Rate limit gating (5 attempts allowed, 6th attempt blocked before bcrypt)
    const floodLimiter = new MemoryRateLimiter({ maxAttempts: 5, windowMs: 60000 });
    const floodUseCase = new LoginAdminUseCase(repo, passwordService, floodLimiter);

    for (let i = 1; i <= 5; i++) {
      const res = await floodUseCase.execute({
        email: adminEmail,
        password: `bad_pass_${i}`,
        clientIP: '192.168.1.88',
      });
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.statusCode, 401);
    }

    const sixthRes = await floodUseCase.execute({
      email: adminEmail,
      password: validPassword,
      clientIP: '192.168.1.88',
    });
    assert.strictEqual(sixthRes.success, false);
    assert.strictEqual(sixthRes.statusCode, 429);
    assert.ok(sixthRes.error?.includes('Too many failed login attempts'));
    assert.ok((sixthRes.retryAfterMs ?? 0) > 0);

    console.log('   ✓ Email validation, normalization, timing-safe dummy compare, and 429 gatekeeper verified.');
  }

  // Post-flight verification: zero prisma connection
  assert.strictEqual(
    (globalThis as unknown as { prisma?: unknown }).prisma,
    undefined,
    'Prisma client must remain uninstantiated after test run'
  );
  console.log('\n4. Post-flight Zero-DB Guardrail Verification: PASS (0 DB connections)\n');

  console.log('================================================================');
  console.log('   ✅ ALL EMAIL-BASED AUTH ZERO-DB TESTS PASSED (100% SUCCESS)   ');
  console.log('================================================================');
}

runEmailAuthVerification().catch((err: unknown) => {
  console.error('\n❌ Email-based auth test failed:', err);
  process.exit(1);
});
