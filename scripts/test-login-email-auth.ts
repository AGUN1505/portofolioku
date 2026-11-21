// scripts/test-login-email-auth.ts
// Comprehensive verification of administrator email-based login lifecycle,
// input format validation, timing-attack mitigation, rate-limiting on email identity,
// and Zero-DB compliance.

import * as assert from 'node:assert/strict';
import type { Admin } from '../src/domain/entities/admin';
import type {
  IAdminRepository,
  AdminAuthRecord,
  CreateAdminInput,
  UpdateAdminProfileData,
} from '../src/domain/repositories/admin.repository';
import { PasswordService } from '../src/infrastructure/auth/password.service';
import { MemoryRateLimiter } from '../src/infrastructure/auth/memory-rate-limiter';
import { LoginAdminUseCase } from '../src/application/use-cases/auth/login-admin.use-case';

// In-Memory Admin Repository strictly adhering to Zero-DB guardrails
class InMemoryAdminRepository implements IAdminRepository {
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
    if (this.records.size > 0) throw new Error('Single-admin policy violation');
    const id = 'admin_singleton_1';
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

async function runTestSuite(): Promise<void> {
  console.log('================================================================');
  console.log('   PORTFOLIO CMS — EMAIL AUTHENTICATION LIFECYCLE VERIFICATION  ');
  console.log('================================================================\n');

  // Pre-flight Zero-DB Guardrail Verification
  assert.strictEqual(
    (globalThis as unknown as { prisma?: unknown }).prisma,
    undefined,
    'Prisma client must not be instantiated before tests'
  );
  console.log('0. Zero-DB Pre-flight Guardrail Check: PASS (0 DB connections)\n');

  const repo = new InMemoryAdminRepository();
  const passwordService = new PasswordService();
  const validPassword = 'Secure#P@ssw0rd2026';
  const hashedPassword = await passwordService.hash(validPassword);
  const adminEmail = 'admin@example.com';

  await repo.create({
    username: 'admin',
    email: adminEmail,
    passwordHash: hashedPassword,
  });

  // ---------------------------------------------------------------------------
  // 1. Full Login Lifecycle with Valid Credentials & Case-Insensitive Normalization
  // ---------------------------------------------------------------------------
  console.log('1. Testing Valid Credentials & Email Normalization Lifecycle...');
  {
    const rateLimiter = new MemoryRateLimiter({ maxAttempts: 5, windowMs: 60000 });
    const loginUseCase = new LoginAdminUseCase(repo, passwordService, rateLimiter);

    // Exact email login
    const resExact = await loginUseCase.execute({
      email: adminEmail,
      password: validPassword,
      clientIP: '127.0.0.1',
    });

    assert.strictEqual(resExact.success, true, 'Login with exact valid email must succeed');
    assert.ok(resExact.admin !== undefined, 'Admin record must be returned');
    assert.strictEqual(resExact.admin?.email, adminEmail);
    assert.strictEqual(resExact.sessionVersion, 1);
    assert.strictEqual((resExact.admin as unknown as Record<string, unknown>).passwordHash, undefined);

    // Unnormalized email (whitespace + uppercase)
    const resNormalized = await loginUseCase.execute({
      email: '   AdMiN@ExAmPlE.CoM   ',
      password: validPassword,
      clientIP: '127.0.0.1',
    });

    assert.strictEqual(resNormalized.success, true, 'Login with unnormalized email must succeed');
    assert.strictEqual(resNormalized.admin?.email, adminEmail);
    console.log('   ✓ Valid credentials and email normalization passed.');
  }

  // ---------------------------------------------------------------------------
  // 2. Invalid Email Format Rejections (400 Bad Request)
  // ---------------------------------------------------------------------------
  console.log('\n2. Testing Invalid Email Format Rejections...');
  {
    const rateLimiter = new MemoryRateLimiter({ maxAttempts: 5, windowMs: 60000 });
    const loginUseCase = new LoginAdminUseCase(repo, passwordService, rateLimiter);

    const invalidEmailFormats = [
      'admin',
      'admin@',
      '@example.com',
      'admin@example',
      'admin space@example.com',
      'admin@.com',
      'x'.repeat(250) + '@domain.com', // exceeds 254 characters
    ];

    for (const malformed of invalidEmailFormats) {
      const res = await loginUseCase.execute({
        email: malformed,
        password: validPassword,
        clientIP: '127.0.0.1',
      });

      assert.strictEqual(res.success, false, `Malformed email "${malformed}" must be rejected`);
      assert.strictEqual(res.statusCode, 400, `Malformed email "${malformed}" must return status 400`);
      assert.strictEqual(res.error, 'Invalid email format', `Malformed email "${malformed}" must return "Invalid email format"`);
    }

    // Missing email or password
    const missingEmail = await loginUseCase.execute({
      email: '',
      password: validPassword,
      clientIP: '127.0.0.1',
    });
    assert.strictEqual(missingEmail.statusCode, 400);
    assert.strictEqual(missingEmail.error, 'Invalid email or password');

    const missingPassword = await loginUseCase.execute({
      email: adminEmail,
      password: '',
      clientIP: '127.0.0.1',
    });
    assert.strictEqual(missingPassword.statusCode, 400);
    assert.strictEqual(missingPassword.error, 'Invalid email or password');

    console.log('   ✓ Invalid email formats strictly rejected with 400 Bad Request.');
  }

  // ---------------------------------------------------------------------------
  // 3. Incorrect Password for Existing Admin (401 Unauthorized)
  // ---------------------------------------------------------------------------
  console.log('\n3. Testing Incorrect Password Handling...');
  {
    const rateLimiter = new MemoryRateLimiter({ maxAttempts: 5, windowMs: 60000 });
    const loginUseCase = new LoginAdminUseCase(repo, passwordService, rateLimiter);

    const wrongPasswordRes = await loginUseCase.execute({
      email: adminEmail,
      password: 'IncorrectPassword_999!',
      clientIP: '127.0.0.1',
    });

    assert.strictEqual(wrongPasswordRes.success, false);
    assert.strictEqual(wrongPasswordRes.statusCode, 401);
    assert.strictEqual(wrongPasswordRes.error, 'Invalid email or password');
    console.log('   ✓ Incorrect password rejected with generic 401 error message.');
  }

  // ---------------------------------------------------------------------------
  // 4. Timing Attack Mitigation via Dummy Comparison on Non-Existent Email
  // ---------------------------------------------------------------------------
  console.log('\n4. Testing Timing Attack Mitigation & Dummy Comparison...');
  {
    let dummyCompareInvoked = false;
    const trackedPasswordService = new Proxy(passwordService, {
      get(target, prop, receiver) {
        if (prop === 'performDummyCompare') {
          return async (password: string) => {
            dummyCompareInvoked = true;
            return target.performDummyCompare(password);
          };
        }
        return Reflect.get(target, prop, receiver);
      },
    });

    const rateLimiter = new MemoryRateLimiter({ maxAttempts: 5, windowMs: 60000 });
    const loginUseCase = new LoginAdminUseCase(repo, trackedPasswordService, rateLimiter);

    const nonExistentEmail = 'ghost_administrator@example.com';
    const res = await loginUseCase.execute({
      email: nonExistentEmail,
      password: 'AnyValidPassword123!',
      clientIP: '127.0.0.1',
    });

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.error, 'Invalid email or password');
    assert.strictEqual(dummyCompareInvoked, true, 'performDummyCompare must be executed when email is not found');

    // Compare with incorrect password result: error strings must be identical
    const normalLoginUseCase = new LoginAdminUseCase(repo, passwordService, rateLimiter);
    const incorrectPasswordRes = await normalLoginUseCase.execute({
      email: adminEmail,
      password: 'WrongPassword!',
      clientIP: '127.0.0.1',
    });

    assert.strictEqual(
      res.error,
      incorrectPasswordRes.error,
      'Error message must be identical between non-existent email and wrong password to prevent enumeration'
    );
    console.log('   ✓ Timing-safe dummy comparison and zero error leakage verified.');
  }

  // ---------------------------------------------------------------------------
  // 5. Rate Limiting on Email Identity Dimension (Multi-Dimensional)
  // ---------------------------------------------------------------------------
  console.log('\n5. Testing Rate Limiting on Email Identity Dimension...');
  {
    const rateLimiter = new MemoryRateLimiter({ maxAttempts: 5, windowMs: 60000 });
    const loginUseCase = new LoginAdminUseCase(repo, passwordService, rateLimiter);

    // Record 5 consecutive failed attempts
    for (let i = 1; i <= 5; i++) {
      const failRes = await loginUseCase.execute({
        email: adminEmail,
        password: `bad_attempt_${i}`,
        clientIP: '192.168.1.150',
      });
      assert.strictEqual(failRes.success, false);
      assert.strictEqual(failRes.statusCode, 401);
    }

    // 6th attempt must be blocked by rate limiter with 429 BEFORE password checking
    const blockedRes = await loginUseCase.execute({
      email: adminEmail,
      password: validPassword, // Even with correct password!
      clientIP: '192.168.1.150',
    });

    assert.strictEqual(blockedRes.success, false);
    assert.strictEqual(blockedRes.statusCode, 429);
    assert.ok(blockedRes.error?.includes('Too many failed login attempts'));
    assert.ok((blockedRes.retryAfterMs ?? 0) > 0);

    // Verify rate limit keys format
    const keys = MemoryRateLimiter.buildEmailKeys(adminEmail, '192.168.1.150');
    assert.strictEqual(keys.emailKey, `email:${adminEmail}`);
    assert.strictEqual(keys.ipKey, 'ip:192.168.1.150');
    assert.strictEqual(keys.compositeKey, `email_ip:${adminEmail}#192.168.1.150`);

    // Verify different email from DIFFERENT IP is NOT blocked
    const innocentRes = await loginUseCase.execute({
      email: 'otheradmin@example.com',
      password: 'OtherPassword123!',
      clientIP: '10.0.0.1',
    });
    assert.strictEqual(innocentRes.statusCode, 401, 'Unrelated email on separate IP should not be blocked');

    // Reset rate limiter for the blocked email
    await rateLimiter.resetMultiDimension(adminEmail, '192.168.1.150');
    const recoveredRes = await loginUseCase.execute({
      email: adminEmail,
      password: validPassword,
      clientIP: '192.168.1.150',
    });
    assert.strictEqual(recoveredRes.success, true, 'Login should succeed after rate limit reset');
    console.log('   ✓ Email identity rate-limiting gatekeeper and multi-dimension isolation verified.');
  }

  // Post-flight Zero-DB Guardrail Verification
  assert.strictEqual(
    (globalThis as unknown as { prisma?: unknown }).prisma,
    undefined,
    'Prisma client must remain uninstantiated after test suite completes'
  );
  console.log('\n6. Post-flight Zero-DB Guardrail Check: PASS (0 DB connections)\n');

  console.log('================================================================');
  console.log('   ✅ ALL EMAIL AUTH LIFECYCLE TESTS PASSED (100% SUCCESS)      ');
  console.log('================================================================\n');
}

runTestSuite().catch((err: unknown) => {
  console.error('\n❌ Test failure:', err);
  process.exit(1);
});
