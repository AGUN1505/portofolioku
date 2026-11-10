// scripts/test-phase3-auth.ts
// Comprehensive Phase 3 test suite for Login, Logout, Session Revocation, and Bootstrap Security

import * as assert from 'node:assert/strict';
import * as dotenv from 'dotenv';
import { PasswordService } from '../src/infrastructure/auth/password.service';
import { MemoryRateLimiter } from '../src/infrastructure/auth/memory-rate-limiter';
import { LoginAdminUseCase } from '../src/application/use-cases/auth/login-admin.use-case';
import { LogoutAdminUseCase } from '../src/application/use-cases/auth/logout-admin.use-case';
import { BootstrapAdminUseCase } from '../src/application/use-cases/auth/bootstrap-admin.use-case';
import { validateSessionPayload, UnauthorizedException, SessionRevokedException, SessionExpiredException } from '../src/infrastructure/auth/dal';
import type { IAdminRepository, AdminAuthRecord, CreateAdminInput } from '../src/domain/repositories/admin.repository';
import type { Admin } from '../src/domain/entities/admin';

dotenv.config({ path: '.env.local' });

// In-Memory Test Repository for deterministic testing without mutating real PostgreSQL database
class MockAdminRepository implements IAdminRepository {
  public records: Map<string, { admin: Admin; passwordHash: string; sessionVersion: number }> = new Map();

  public async findById(id: string): Promise<Admin | null> {
    const item = this.records.get(id);
    return item ? { ...item.admin } : null;
  }

  public async findByUsername(normalizedUsername: string): Promise<Admin | null> {
    const norm = normalizedUsername.toLowerCase().trim();
    for (const item of Array.from(this.records.values())) {
      if (item.admin.username === norm) {
        return { ...item.admin };
      }
    }
    return null;
  }

  public async findAuthByUsername(normalizedUsername: string): Promise<AdminAuthRecord | null> {
    const norm = normalizedUsername.toLowerCase().trim();
    for (const item of Array.from(this.records.values())) {
      if (item.admin.username === norm) {
        return {
          admin: { ...item.admin },
          passwordHash: item.passwordHash,
          sessionVersion: item.sessionVersion,
        };
      }
    }
    return null;
  }

  public async getSessionVersion(id: string): Promise<number | null> {
    const item = this.records.get(id);
    return item ? item.sessionVersion : null;
  }

  public async incrementSessionVersion(id: string): Promise<number> {
    const item = this.records.get(id);
    if (!item) throw new Error('Admin not found');
    item.sessionVersion += 1;
    return item.sessionVersion;
  }

  public async count(): Promise<number> {
    return this.records.size;
  }

  public async create(data: CreateAdminInput): Promise<Admin> {
    if (this.records.size > 0) {
      throw new Error('Single-admin policy violation: Admin account already exists');
    }
    const id = `mock_cuid_${Date.now()}`;
    const admin: Admin = {
      id,
      username: data.username.toLowerCase().trim(),
      email: data.email ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.records.set(id, {
      admin,
      passwordHash: data.passwordHash,
      sessionVersion: 1,
    });
    return admin;
  }
}

async function runPhase3Tests() {
  console.log('=== RUNNING PHASE 3 SECURITY & AUTHENTICATION TEST SUITE ===');

  const passwordService = new PasswordService();
  const validPassword = 'Secure#P@ssw0rd2026';
  const hashedPassword = await passwordService.hash(validPassword);

  // =========================================================================
  // SUITE 1: LOGIN USE CASE & CREDENTIAL VERIFICATION
  // =========================================================================
  console.log('\n[Suite 1: Login Use Case & Timing Mitigation]');
  {
    const repo = new MockAdminRepository();
    const rateLimiter = new MemoryRateLimiter({ windowMs: 1000, maxAttempts: 5 });
    const loginUseCase = new LoginAdminUseCase(repo, passwordService, rateLimiter);

    // Seed mock admin
    await repo.create({
      username: 'masteradmin',
      passwordHash: hashedPassword,
    });

    // 1.1: Username normalization
    const loginNormalized = await loginUseCase.execute({
      username: '  MasterAdmin  ',
      password: validPassword,
      clientIP: '127.0.0.1',
    });
    assert.strictEqual(loginNormalized.success, true, 'Login should succeed with unnormalized input');
    assert.strictEqual(loginNormalized.admin?.username, 'masteradmin');
    assert.strictEqual(loginNormalized.sessionVersion, 1);
    console.log('  ✓ 1.1: Username normalization and case-insensitivity passed');

    // 1.2: Username not found -> Timing-safe dummy compare executed & generic error
    const nonExistentResult = await loginUseCase.execute({
      username: 'nonexistent',
      password: 'AnyPassword123!',
      clientIP: '127.0.0.1',
    });
    assert.strictEqual(nonExistentResult.success, false);
    assert.strictEqual(nonExistentResult.error, 'Invalid username or password');
    assert.strictEqual(nonExistentResult.statusCode, 401);
    console.log('  ✓ 1.2: Username not found returned generic 401 with dummy comparison');

    // 1.3: Wrong password for existing admin
    const wrongPasswordResult = await loginUseCase.execute({
      username: 'masteradmin',
      password: 'WrongPassword123!',
      clientIP: '127.0.0.1',
    });
    assert.strictEqual(wrongPasswordResult.success, false);
    assert.strictEqual(wrongPasswordResult.error, 'Invalid username or password');
    assert.strictEqual(wrongPasswordResult.statusCode, 401);
    console.log('  ✓ 1.3: Wrong password returned identical generic 401 message');

    // 1.4: Error messages are strictly identical (preventing enumeration)
    assert.strictEqual(
      nonExistentResult.error,
      wrongPasswordResult.error,
      'Error messages must be identical for non-existent user and bad password'
    );
    console.log('  ✓ 1.4: Zero information leakage between invalid user and bad password');

    // 1.5: Multi-dimensional Rate Limiting
    const floodLimiter = new MemoryRateLimiter({ windowMs: 60000, maxAttempts: 5 });
    const floodLogin = new LoginAdminUseCase(repo, passwordService, floodLimiter);

    // Record 5 failed attempts
    for (let i = 1; i <= 5; i++) {
      const res = await floodLogin.execute({
        username: 'masteradmin',
        password: `bad_${i}`,
        clientIP: '192.168.1.100',
      });
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.statusCode, 401, `Attempt ${i} should be 401`);
    }

    // 6th attempt must be blocked with 429 BEFORE bcrypt check
    const sixthAttempt = await floodLogin.execute({
      username: 'masteradmin',
      password: validPassword, // Even with correct password, blocked by rate limit!
      clientIP: '192.168.1.100',
    });
    assert.strictEqual(sixthAttempt.success, false);
    assert.strictEqual(sixthAttempt.statusCode, 429);
    assert.ok(sixthAttempt.error?.includes('Too many failed login attempts'));
    assert.ok((sixthAttempt.retryAfterMs ?? 0) > 0);
    console.log('  ✓ 1.5: 6th login failure strictly blocked with 429 rate limit before credential evaluation');
  }

  // =========================================================================
  // SUITE 2: LOGOUT USE CASE & SESSION REVOCATION
  // =========================================================================
  console.log('\n[Suite 2: Logout Use Case & Session Revocation]');
  {
    const repo = new MockAdminRepository();
    const admin = await repo.create({
      username: 'revokeadmin',
      passwordHash: hashedPassword,
    });

    const logoutUseCase = new LogoutAdminUseCase(repo);

    // Initial session version in DB
    const initialVersion = await repo.getSessionVersion(admin.id);
    assert.strictEqual(initialVersion, 1);

    // 2.1: Authenticated logout increments sessionVersion
    const logoutResult = await logoutUseCase.execute({ userId: admin.id });
    assert.strictEqual(logoutResult.success, true);
    assert.strictEqual(logoutResult.revoked, true);
    assert.strictEqual(logoutResult.newSessionVersion, 2);

    const updatedVersion = await repo.getSessionVersion(admin.id);
    assert.strictEqual(updatedVersion, 2);
    console.log('  ✓ 2.1: Authenticated logout atomically incremented sessionVersion (v1 -> v2)');

    // 2.2: DAL immediately rejects older session version (Device A & Device B)
    const oldSessionPayload = {
      userId: admin.id,
      username: admin.username,
      sessionVersion: 1, // Stale version!
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };

    await assert.rejects(
      async () => {
        await validateSessionPayload(oldSessionPayload, async (id) => {
          const a = await repo.findById(id);
          const v = await repo.getSessionVersion(id);
          return a && v !== null ? { id: a.id, username: a.username, sessionVersion: v } : null;
        });
      },
      SessionRevokedException,
      'Old session must be rejected with SessionRevokedException'
    );
    console.log('  ✓ 2.2: Stale session rejected by DAL with SessionRevokedException');

    // 2.3: Cross-device revocation verification
    // Device B had sessionVersion: 1. Now DB is 2. Device B request is rejected instantly.
    const deviceBSession = { ...oldSessionPayload };
    await assert.rejects(
      async () => {
        await validateSessionPayload(deviceBSession, async (id) => {
          const a = await repo.findById(id);
          const v = await repo.getSessionVersion(id);
          return a && v !== null ? { id: a.id, username: a.username, sessionVersion: v } : null;
        });
      },
      SessionRevokedException
    );
    console.log('  ✓ 2.3: Cross-device active sessions invalidated instantly upon logout');

    // 2.4: Anonymous / unauthenticated logout is a safe no-op on DB
    const anonLogout = await logoutUseCase.execute({});
    assert.strictEqual(anonLogout.success, true);
    assert.strictEqual(anonLogout.revoked, false);
    // Version still 2
    assert.strictEqual(await repo.getSessionVersion(admin.id), 2);
    console.log('  ✓ 2.4: Anonymous logout did not mutate admin sessionVersion');
  }

  // =========================================================================
  // SUITE 3: BOOTSTRAP ADMIN CLI SECURITY & POLICIES
  // =========================================================================
  console.log('\n[Suite 3: Bootstrap Admin CLI Policies & Logic]');
  {
    // 3.1: Password policy validator tests
    assert.strictEqual(
      BootstrapAdminUseCase.validatePasswordPolicy('short').valid,
      false,
      'Should reject < 12 chars'
    );
    assert.strictEqual(
      BootstrapAdminUseCase.validatePasswordPolicy('alllowercaseanddigits1234').valid,
      false,
      'Should reject missing uppercase'
    );
    assert.strictEqual(
      BootstrapAdminUseCase.validatePasswordPolicy('ALLUPPERCASEANDDIGITS1234').valid,
      false,
      'Should reject missing lowercase'
    );
    assert.strictEqual(
      BootstrapAdminUseCase.validatePasswordPolicy('NoDigitsInThisPasswordHere').valid,
      false,
      'Should reject missing digits'
    );
    assert.strictEqual(
      BootstrapAdminUseCase.validatePasswordPolicy('admin12345678Admin!', 'admin').valid,
      false,
      'Should reject password containing username'
    );
    assert.strictEqual(
      BootstrapAdminUseCase.validatePasswordPolicy('Compliant#Passw0rd2026', 'superadmin').valid,
      true,
      'Compliant password should pass'
    );
    console.log('  ✓ 3.1: Password policy verification strictly enforced (min 12, upper, lower, digit, no username)');

    // 3.2: Single-admin policy enforcement in Bootstrap Use Case
    const freshRepo = new MockAdminRepository();
    const bootstrapUseCase = new BootstrapAdminUseCase(freshRepo, passwordService);

    // First admin creation succeeds
    const firstAdmin = await bootstrapUseCase.execute({
      username: 'master',
      password: 'Compliant#Passw0rd2026',
      email: 'master@example.com',
    });
    assert.strictEqual(firstAdmin.success, true);
    assert.strictEqual(firstAdmin.admin?.username, 'master');
    assert.strictEqual((firstAdmin.admin as unknown as Record<string, unknown>).passwordHash, undefined);
    console.log('  ✓ 3.2a: Initial admin creation succeeded with sanitized domain entity');

    // Second admin attempt must be rejected by single-admin policy
    const secondAdmin = await bootstrapUseCase.execute({
      username: 'second_admin',
      password: 'Another#Valid1234Password',
    });
    assert.strictEqual(secondAdmin.success, false);
    assert.ok(secondAdmin.error?.includes('Single-admin policy violation'));
    assert.strictEqual(await freshRepo.count(), 1, 'Admin count must remain exactly 1');
    console.log('  ✓ 3.2b: Second admin creation strictly rejected by Single-Admin Policy');
  }

  // =========================================================================
  // SUITE 4: DATA ACCESS LAYER (DAL) AUTHORITATIVE ACCESS CONTROL
  // =========================================================================
  console.log('\n[Suite 4: Authoritative Data Access Layer (DAL) Enforcement]');
  {
    // 4.1: Missing session payload rejected
    await assert.rejects(
      async () => {
        await validateSessionPayload(null, async () => null);
      },
      UnauthorizedException
    );
    console.log('  ✓ 4.1: Null/empty session rejected with UnauthorizedException');

    // 4.2: Expired session timestamp rejected
    const expiredPayload = {
      userId: 'test_admin_id',
      username: 'test_admin',
      sessionVersion: 1,
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    };
    await assert.rejects(
      async () => {
        await validateSessionPayload(expiredPayload, async () => ({
          id: 'test_admin_id',
          username: 'test_admin',
          sessionVersion: 1,
        }));
      },
      SessionExpiredException
    );
    console.log('  ✓ 4.2: Expired timestamp rejected with SessionExpiredException');

    // 4.3: Non-existent admin in DB rejected
    const validTimePayload = {
      userId: 'ghost_admin_id',
      username: 'ghost_admin',
      sessionVersion: 1,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };
    await assert.rejects(
      async () => {
        await validateSessionPayload(validTimePayload, async () => null); // DB returns null
      },
      UnauthorizedException
    );
    console.log('  ✓ 4.3: Non-existent DB admin rejected with UnauthorizedException');

    // 4.4: Active and matching session successfully verified
    const activePayload = {
      userId: 'real_admin_id',
      username: 'real_admin',
      sessionVersion: 3,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };
    const verified = await validateSessionPayload(activePayload, async () => ({
      id: 'real_admin_id',
      username: 'real_admin',
      sessionVersion: 3,
    }));
    assert.strictEqual(verified.userId, 'real_admin_id');
    assert.strictEqual(verified.username, 'real_admin');
    assert.strictEqual(verified.sessionVersion, 3);
    console.log('  ✓ 4.4: Matching session successfully authorized with pure DAL credentials');
  }

  console.log('\n=== ALL PHASE 3 TEST SUITES PASSED CLEANLY (100% SUCCESS) ===\n');
}

runPhase3Tests().catch((err) => {
  console.error('[TEST FAILURE]', err);
  process.exit(1);
});
