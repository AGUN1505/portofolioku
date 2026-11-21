// scripts/test-phase2-auth.ts
// Comprehensive Phase 2 test suite for Auth Infrastructure & Services

import * as assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as dotenv from 'dotenv';

// Load .env.local safely without printing
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Ensure SESSION_SECRET exists for test environment
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  process.env.SESSION_SECRET = 'temporary_test_session_secret_at_least_32_characters_long_for_auth_tests';
}

import type { PrismaClient } from '@prisma/client';
import { PasswordService } from '../src/infrastructure/auth/password.service';
import { sealSession, unsealSession, type SessionPayload } from '../src/infrastructure/auth/session';
import { MemoryRateLimiter } from '../src/infrastructure/auth/memory-rate-limiter';
import {
  validateSessionPayload,
  UnauthorizedException,
  SessionRevokedException,
  SessionExpiredException,
} from '../src/infrastructure/auth/dal';
import { PrismaAdminRepository } from '../src/infrastructure/repositories/prisma-admin.repository';
import { extractClientIPFromHeaders, normalizeIP } from '../src/infrastructure/auth/ip-extractor';
import { CompositionRoot } from '../src/infrastructure/composition-root';
import { StaticPortfolioRepository } from '../src/infrastructure/repositories/static-portfolio.repository';
import { PrismaPortfolioRepository } from '../src/infrastructure/repositories/prisma-portfolio.repository';

async function runTestSuite() {
  console.log('--- STARTING STAGE 10.3 PHASE 2 AUTH TEST SUITE ---');

  // =========================================================================
  // 1. PASSWORD SERVICE TESTS
  // =========================================================================
  console.log('\n[Suite 1] Password Service Tests...');
  const passwordService = new PasswordService();

  // Test 1.1: Hash & Verify
  const plainPassword = 'SuperSecretPassword_2026!';
  const hash = await passwordService.hash(plainPassword);
  assert.ok(hash.startsWith('$2b$12$') || hash.startsWith('$2a$12$'), 'Hash should use cost factor 12');
  assert.strictEqual(hash.length, 60, 'Bcrypt hash length must be 60 characters');

  const verifySuccess = await passwordService.compare(plainPassword, hash);
  assert.strictEqual(verifySuccess, true, 'Valid password must verify as true');

  // Test 1.2: Incorrect password rejected
  const verifyFailure = await passwordService.compare('WrongPassword_999!', hash);
  assert.strictEqual(verifyFailure, false, 'Invalid password must verify as false');

  // Test 1.3: Dummy hash validity
  const dummyHash = await passwordService.getDummyHash();
  assert.ok(
    dummyHash.startsWith('$2b$12$') || dummyHash.startsWith('$2a$12$'),
    'Dummy hash must be a genuine 12-round bcrypt hash'
  );
  assert.strictEqual(dummyHash.length, 60, 'Dummy bcrypt hash length must be 60 characters');

  // Test 1.4: Dummy comparison executes and returns false
  const t0 = Date.now();
  const dummyResult = await passwordService.performDummyCompare('attempted_user_password');
  const elapsed = Date.now() - t0;
  assert.strictEqual(dummyResult, false, 'Dummy comparison must always return false');
  assert.ok(elapsed >= 50, `Dummy comparison should take measurable bcrypt time (~50-500ms), took ${elapsed}ms`);
  console.log('  ✓ Password hashing, verification, dummy hash, and timing mitigation passed');

  // =========================================================================
  // 2. SESSION & DAL TESTS
  // =========================================================================
  console.log('\n[Suite 2] Session & DAL Tests...');
  const now = new Date();
  const validPayload: SessionPayload = {
    userId: 'admin_test_cuid_123',
    username: 'agun_admin',
    sessionVersion: 1,
    expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };

  // Test 2.1: Seal and unseal
  const sealed = await sealSession(validPayload);
  assert.ok(typeof sealed === 'string' && sealed.length > 50, 'Sealed session must be non-empty encrypted string');

  const unsealed = await unsealSession(sealed);
  assert.ok(unsealed !== null, 'Valid sealed session must unseal successfully');
  assert.strictEqual(unsealed?.userId, validPayload.userId);
  assert.strictEqual(unsealed?.username, validPayload.username);
  assert.strictEqual(unsealed?.sessionVersion, 1);

  // Test 2.2: Tampered / invalid seal rejected
  const tamperedSeal = sealed.slice(0, -6) + 'xxxxxx';
  const tamperedResult = await unsealSession(tamperedSeal);
  assert.strictEqual(tamperedResult, null, 'Tampered session seal must return null');

  // Test 2.3: Expired session payload rejected
  const expiredPayload: SessionPayload = {
    userId: 'admin_test_cuid_123',
    username: 'agun_admin',
    sessionVersion: 1,
    expiresAt: new Date(now.getTime() - 10000).toISOString(), // 10 seconds ago
  };
  const expiredSeal = await sealSession(expiredPayload);
  const unsealedExpired = await unsealSession(expiredSeal);
  assert.strictEqual(unsealedExpired, null, 'Expired session must return null on unseal');

  // Test DAL direct handling of expired payload
  await assert.rejects(
    async () => {
      await validateSessionPayload(expiredPayload, async () => ({ id: 'admin_test_cuid_123', username: 'agun_admin', sessionVersion: 1 }));
    },
    (err: Error) => {
      assert.ok(err instanceof SessionExpiredException, 'Must throw SessionExpiredException');
      return true;
    }
  );

  // Test 2.4: DAL validation - success case
  const mockGetDbAdminValid = async (id: string) => {
    if (id === validPayload.userId) {
      return { id, username: validPayload.username, sessionVersion: 1 };
    }
    return null;
  };
  const dalVerified = await validateSessionPayload(validPayload, mockGetDbAdminValid);
  assert.strictEqual(dalVerified.userId, validPayload.userId);
  assert.strictEqual(dalVerified.sessionVersion, 1);

  // Test 2.5: DAL validation - session version mismatch (revoked session)
  const mockGetDbAdminRevoked = async (id: string) => {
    if (id === validPayload.userId) {
      return { id, username: validPayload.username, sessionVersion: 2 }; // DB incremented to 2
    }
    return null;
  };
  await assert.rejects(
    async () => {
      await validateSessionPayload(validPayload, mockGetDbAdminRevoked);
    },
    (err: Error) => {
      assert.ok(err instanceof SessionRevokedException, 'Must throw SessionRevokedException on version mismatch');
      return true;
    }
  );

  // Test 2.6: DAL validation - admin no longer exists in DB
  const mockGetDbAdminDeleted = async () => null;
  await assert.rejects(
    async () => {
      await validateSessionPayload(validPayload, mockGetDbAdminDeleted);
    },
    (err: Error) => {
      assert.ok(err instanceof UnauthorizedException, 'Must throw UnauthorizedException if admin missing');
      return true;
    }
  );

  // Test 2.7: DAL validation - null payload
  await assert.rejects(
    async () => {
      await validateSessionPayload(null, mockGetDbAdminValid);
    },
    (err: Error) => {
      assert.ok(err instanceof UnauthorizedException, 'Must throw UnauthorizedException on null payload');
      return true;
    }
  );
  console.log('  ✓ Session sealing, unsealing, tampering protection, expiration, and DAL verification passed');

  // =========================================================================
  // 3. RATE LIMITER TESTS
  // =========================================================================
  console.log('\n[Suite 3] Rate Limiter Tests...');
  const rateLimiter = new MemoryRateLimiter({ maxAttempts: 5, windowMs: 1000 });

  // Test 3.1: Record attempts 1 to 5 (all allowed)
  for (let i = 1; i <= 5; i++) {
    const res = await rateLimiter.recordFailure('test_target_key');
    assert.strictEqual(res.allowed, true, `Attempt ${i} must be allowed`);
    assert.strictEqual(res.remainingAttempts, 5 - i, `Remaining attempts should be ${5 - i}`);
  }

  // Test 3.2: 6th attempt blocked
  const blockedRes = await rateLimiter.recordFailure('test_target_key');
  assert.strictEqual(blockedRes.allowed, false, '6th attempt must be blocked');
  assert.strictEqual(blockedRes.remainingAttempts, 0, 'Remaining attempts must be 0');
  assert.ok(blockedRes.retryAfterMs > 0, 'retryAfterMs must be positive');

  // Test 3.3: Sliding window expiry
  const shortLimiter = new MemoryRateLimiter({ maxAttempts: 2, windowMs: 150 });
  await shortLimiter.recordFailure('sliding_key');
  await shortLimiter.recordFailure('sliding_key');
  const checkBlocked = await shortLimiter.check('sliding_key');
  assert.strictEqual(checkBlocked.allowed, false, 'Should be blocked after 2 failures');

  // Wait 180ms for window to slide past
  await new Promise((r) => setTimeout(r, 180));
  const checkRecovered = await shortLimiter.check('sliding_key');
  assert.strictEqual(checkRecovered.allowed, true, 'Should be allowed after sliding window expires');

  // Test 3.4: Multi-dimension isolation
  const multiLimiter = new MemoryRateLimiter({ maxAttempts: 3, windowMs: 10000 });
  await multiLimiter.recordMultiDimensionFailure('alice', '192.168.1.100');
  await multiLimiter.recordMultiDimensionFailure('alice', '192.168.1.100');
  await multiLimiter.recordMultiDimensionFailure('alice', '192.168.1.100');

  // alice is blocked
  const aliceStatus = await multiLimiter.checkMultiDimension('alice', '192.168.1.100');
  assert.strictEqual(aliceStatus.allowed, false, 'Alice should be blocked');

  // bob on different IP is NOT blocked
  const bobStatus = await multiLimiter.checkMultiDimension('bob', '192.168.1.200');
  assert.strictEqual(bobStatus.allowed, true, 'Bob should not be blocked by Alice failures');

  // bob on the same IP (192.168.1.100) IS blocked by IP dimension!
  const bobSameIpStatus = await multiLimiter.checkMultiDimension('bob', '192.168.1.100');
  assert.strictEqual(bobSameIpStatus.allowed, false, 'Bob on abusive IP should be blocked by IP dimension');
  assert.strictEqual(bobSameIpStatus.blockedDimension, 'ip');

  // Reset alice clears alice
  await multiLimiter.resetMultiDimension('alice', '192.168.1.100');
  const aliceResetStatus = await multiLimiter.checkMultiDimension('alice', '192.168.1.100');
  assert.strictEqual(aliceResetStatus.allowed, true, 'Alice should be allowed after reset');

  // Test 3.5: Email rate-limiting keys and dimensions
  const emailKeys = MemoryRateLimiter.buildEmailKeys('Admin@Domain.com', '127.0.0.1');
  assert.strictEqual(emailKeys.emailKey, 'email:admin@domain.com');
  assert.strictEqual(emailKeys.ipKey, 'ip:127.0.0.1');
  assert.strictEqual(emailKeys.compositeKey, 'email_ip:admin@domain.com#127.0.0.1');

  const dynEmailKeys = MemoryRateLimiter.buildKeys('Admin@Domain.com', '127.0.0.1');
  assert.strictEqual(dynEmailKeys.emailKey, 'email:admin@domain.com');
  assert.strictEqual(dynEmailKeys.compositeKey, 'email_ip:admin@domain.com#127.0.0.1');

  const emailLimiter = new MemoryRateLimiter({ maxAttempts: 3, windowMs: 10000 });
  await emailLimiter.recordMultiDimensionFailure('admin@domain.com', '192.168.1.50');
  await emailLimiter.recordMultiDimensionFailure('admin@domain.com', '192.168.1.50');
  await emailLimiter.recordMultiDimensionFailure('admin@domain.com', '192.168.1.50');
  const emailCheck = await emailLimiter.checkMultiDimension('admin@domain.com', '192.168.1.50');
  assert.strictEqual(emailCheck.allowed, false, 'Email should be blocked after 3 attempts');
  assert.strictEqual(emailCheck.blockedDimension, 'email', 'Blocked dimension must be email');
  await emailLimiter.resetMultiDimension('admin@domain.com', '192.168.1.50');
  const emailResetCheck = await emailLimiter.checkMultiDimension('admin@domain.com', '192.168.1.50');
  assert.strictEqual(emailResetCheck.allowed, true, 'Email should be allowed after reset');

  console.log('  ✓ Rate limiting sliding window, thresholds, and multi-dimension isolation passed');

  // =========================================================================
  // 4. PRISMA ADMIN REPOSITORY TESTS
  // =========================================================================
  console.log('\n[Suite 4] Prisma Admin Repository Tests...');
  const adminRepo = new PrismaAdminRepository();

  // Test 4.1: Database count is 0
  const count = await adminRepo.count();
  assert.strictEqual(count, 0, 'Admin table must have 0 records in current state');

  // Test 4.2: Non-existent admin lookup returns null
  const byUsername = await adminRepo.findByUsername('nonexistent_admin');
  assert.strictEqual(byUsername, null, 'Non-existent admin lookup must return null');

  const byId = await adminRepo.findById('cuid_nonexistent_123');
  assert.strictEqual(byId, null, 'Non-existent admin ID lookup must return null');

  const authRecord = await adminRepo.findAuthByUsername('nonexistent_admin');
  assert.strictEqual(authRecord, null, 'Non-existent admin auth lookup must return null');

  const sessionVersion = await adminRepo.getSessionVersion('cuid_nonexistent_123');
  assert.strictEqual(sessionVersion, null, 'Non-existent admin sessionVersion must return null');

  // Test 4.3: Mock check to verify passwordHash is never on Admin domain entity
  const mockPrisma = {
    admin: {
      findUnique: async () => ({
        id: 'mock_cuid_1',
        username: 'admin',
        email: 'admin@example.com',
        passwordHash: '$2b$12$dummyhashsecretmustneverleak',
        sessionVersion: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      count: async () => 1,
      update: async () => ({ sessionVersion: 2 }),
    },
  };
  const mockRepo = new PrismaAdminRepository(mockPrisma as unknown as PrismaClient);
  const foundAdmin = await mockRepo.findByUsername('admin');
  assert.ok(foundAdmin !== null);
  assert.strictEqual(foundAdmin.id, 'mock_cuid_1');
  assert.strictEqual(foundAdmin.username, 'admin');
  const foundAdminRecord = foundAdmin as unknown as Record<string, unknown>;
  assert.strictEqual(foundAdminRecord.passwordHash, undefined, 'passwordHash must NEVER exist on Admin domain entity');
  assert.strictEqual('passwordHash' in foundAdminRecord, false, 'passwordHash key must not exist on Admin entity');

  const foundAuth = await mockRepo.findAuthByUsername('admin');
  assert.ok(foundAuth !== null);
  assert.strictEqual(foundAuth.passwordHash, '$2b$12$dummyhashsecretmustneverleak');
  const foundAuthAdminRecord = foundAuth.admin as unknown as Record<string, unknown>;
  assert.strictEqual(foundAuthAdminRecord.passwordHash, undefined, 'foundAuth.admin entity must not contain passwordHash');

  const foundAuthEmail = await mockRepo.findAuthByEmail('admin@example.com');
  assert.ok(foundAuthEmail !== null);
  assert.strictEqual(foundAuthEmail.passwordHash, '$2b$12$dummyhashsecretmustneverleak');
  assert.strictEqual(foundAuthEmail.admin.email, 'admin@example.com');
  const foundAuthEmailAdminRecord = foundAuthEmail.admin as unknown as Record<string, unknown>;
  assert.strictEqual(foundAuthEmailAdminRecord.passwordHash, undefined, 'foundAuthEmail.admin entity must not contain passwordHash');

  console.log('  ✓ PrismaAdminRepository queries, entity isolation, and leak prevention passed');

  // =========================================================================
  // 5. IP EXTRACTION & TRUSTED PROXY TESTS
  // =========================================================================
  console.log('\n[Suite 5] IP Extraction & Trusted Proxy Tests...');
  const fakeHeaders = (map: Record<string, string>) => ({
    get: (name: string) => map[name.toLowerCase()] ?? null,
  });

  // Test 5.1: Untrusted proxy (TRUSTED_PROXIES is empty) -> ignore X-Forwarded-For
  const origTrusted = process.env.TRUSTED_PROXIES;
  delete process.env.TRUSTED_PROXIES;
  const untrustedIP = extractClientIPFromHeaders(
    fakeHeaders({ 'x-forwarded-for': '203.0.113.195', 'cf-connecting-ip': '203.0.113.195' })
  );
  assert.strictEqual(untrustedIP, undefined, 'Direct connection without TRUSTED_PROXIES must ignore forwarded headers');

  // Test 5.2: Vercel trusted proxy
  process.env.TRUSTED_PROXIES = 'vercel';
  const vercelIP = extractClientIPFromHeaders(
    fakeHeaders({ 'x-forwarded-for': '203.0.113.195, 10.0.0.1', 'x-real-ip': '203.0.113.195' })
  );
  assert.strictEqual(vercelIP, '203.0.113.195', 'Vercel trusted proxy must extract client IP');

  // Test 5.3: Cloudflare trusted proxy
  process.env.TRUSTED_PROXIES = 'cloudflare';
  const cfIP = extractClientIPFromHeaders(fakeHeaders({ 'cf-connecting-ip': '198.51.100.42' }));
  assert.strictEqual(cfIP, '198.51.100.42', 'Cloudflare trusted proxy must extract cf-connecting-ip');

  // Test 5.4: IPv6-mapped IPv4 normalization
  assert.strictEqual(normalizeIP('::ffff:192.168.1.1'), '192.168.1.1', 'Must strip ::ffff: prefix');
  assert.strictEqual(normalizeIP('2001:db8::1'), '2001:db8::1', 'Must preserve standard IPv6');

  // Restore env
  if (origTrusted !== undefined) process.env.TRUSTED_PROXIES = origTrusted;
  else delete process.env.TRUSTED_PROXIES;
  console.log('  ✓ IP extraction and spoofing mitigation passed');

  // =========================================================================
  // 6. ARCHITECTURE & REPOSITORY SOURCE TESTS
  // =========================================================================
  console.log('\n[Suite 6] Architecture & Repository Source Tests...');

  // Test 6.1: Domain layer purity check
  const domainDir = path.resolve(process.cwd(), 'src/domain/repositories');
  const domainFiles = fs.readdirSync(domainDir);
  for (const file of domainFiles) {
    const content = fs.readFileSync(path.join(domainDir, file), 'utf-8');
    assert.ok(!content.includes('@prisma/client'), `${file} must not import @prisma/client`);
    assert.ok(!content.includes('from \'prisma\''), `${file} must not import prisma`);
    assert.ok(!content.includes('bcrypt'), `${file} must not import bcrypt`);
    assert.ok(!content.includes('iron-session'), `${file} must not import iron-session`);
    assert.ok(!content.includes('src/infrastructure'), `${file} must not import infrastructure`);
  }

  // Test 6.2: Composition Root wiring
  CompositionRoot.resetForTesting();
  const defaultPortfolioRepo = CompositionRoot.getPortfolioRepository();
  assert.ok(
    defaultPortfolioRepo instanceof StaticPortfolioRepository,
    'Default portfolio repository must be StaticPortfolioRepository'
  );

  const prismaPortfolioRepo = CompositionRoot.getPortfolioRepository('prisma');
  assert.ok(
    prismaPortfolioRepo instanceof PrismaPortfolioRepository,
    'Explicit prisma request must return PrismaPortfolioRepository'
  );

  const adminRepoFromRoot = CompositionRoot.getAdminRepository();
  assert.ok(
    adminRepoFromRoot instanceof PrismaAdminRepository,
    'getAdminRepository must return PrismaAdminRepository'
  );

  const passwordServiceFromRoot = CompositionRoot.getPasswordService();
  assert.ok(
    passwordServiceFromRoot instanceof PasswordService,
    'getPasswordService must return PasswordService'
  );

  const rateLimiterFromRoot = CompositionRoot.getRateLimiter();
  assert.ok(
    rateLimiterFromRoot instanceof MemoryRateLimiter,
    'getRateLimiter must return MemoryRateLimiter'
  );
  console.log('  ✓ Domain layer purity and Composition Root dependency injection passed');

  console.log('\n--- ALL STAGE 10.3 PHASE 2 TESTS PASSED SUCCESSFULLY! ---');
}

runTestSuite().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
