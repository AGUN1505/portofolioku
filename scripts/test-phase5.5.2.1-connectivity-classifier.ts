// scripts/test-phase5.5.2.1-connectivity-classifier.ts
// Comprehensive Unit Test Matrix for Phase 5.5.2.1 Connectivity Classifier Hardening

import * as assert from 'node:assert';
import {
  ResilientPortfolioRepository,
  isDatabaseConnectivityError,
} from '../src/infrastructure/repositories/resilient-portfolio.repository';
import type { IPortfolioRepository } from '../src/domain/repositories/portfolio.repository';
import type { Portfolio } from '../src/domain/entities';

const dummyStaticPortfolio: Portfolio = {
  hero: {
    name: 'Agun Firmansyah',
    tagline: 'Static Tagline',
    bio: 'Static Bio',
    roles: [],
    location: { country: 'Indonesia', code: 'ID', timezone: 'UTC+7' },
    engineeringNodes: [],
    discipline: 'Backend Engineering',
  },
  about: {
    heading: 'Static About',
    quote: 'Static Quote',
    narratives: { primary: 'P', secondary: 'S' },
    domains: [],
    pillars: [],
  },
  projects: [],
  experiences: [],
  skills: { categories: [] },
  contact: {
    heading: 'Static Contact',
    ctaLabel: 'CTA',
    description: 'Desc',
    channels: [],
  },
};

const dummyPrismaPortfolio: Portfolio = {
  ...dummyStaticPortfolio,
  hero: {
    ...dummyStaticPortfolio.hero,
    tagline: 'Prisma Live Tagline',
  },
};

async function runClassifierTests() {
  console.log('=== RUNNING PHASE 5.5.2.1 CONNECTIVITY CLASSIFIER TEST MATRIX ===');
  let passedTests = 0;

  // ==========================================
  // SECTION 1: POSITIVE FALLBACK CASES (Must return true)
  // ==========================================
  console.log('\n[Section 1] Positive Fallback Cases (Must trigger static fallback)');

  // 1.1 ECONNREFUSED
  assert.equal(isDatabaseConnectivityError({ code: 'ECONNREFUSED' }), true);
  passedTests++;
  console.log('  ✓ 1.1: ECONNREFUSED classified as connectivity failure');

  // 1.2 ETIMEDOUT
  assert.equal(isDatabaseConnectivityError({ code: 'ETIMEDOUT' }), true);
  passedTests++;
  console.log('  ✓ 1.2: ETIMEDOUT classified as connectivity failure');

  // 1.3 ENOTFOUND
  assert.equal(isDatabaseConnectivityError({ code: 'ENOTFOUND' }), true);
  passedTests++;
  console.log('  ✓ 1.3: ENOTFOUND classified as connectivity failure');

  // 1.4 ECONNRESET
  assert.equal(isDatabaseConnectivityError({ code: 'ECONNRESET' }), true);
  passedTests++;
  console.log('  ✓ 1.4: ECONNRESET classified as connectivity failure');

  // 1.5 P1001 (Can\'t reach database server)
  assert.equal(isDatabaseConnectivityError({ code: 'P1001' }), true);
  passedTests++;
  console.log('  ✓ 1.5: P1001 classified as connectivity failure');

  // 1.6 P1002 (Database server timed out)
  assert.equal(isDatabaseConnectivityError({ code: 'P1002' }), true);
  passedTests++;
  console.log('  ✓ 1.6: P1002 classified as connectivity failure');

  // 1.7 P1017 (Server has closed the connection)
  assert.equal(isDatabaseConnectivityError({ code: 'P1017' }), true);
  passedTests++;
  console.log('  ✓ 1.7: P1017 classified as connectivity failure');

  // 1.8 Recognized nested connectivity cause
  {
    const outerError = new Error('Database query failed in PrismaPortfolioRepository: Can\'t reach database server');
    (outerError as { cause?: unknown }).cause = { code: 'P1001' };
    assert.equal(isDatabaseConnectivityError(outerError), true);
    passedTests++;
    console.log('  ✓ 1.8: Recognized nested connectivity cause ({ code: "P1001" }) triggers fallback');
  }

  // 1.9 Recognized nested socket error via PrismaClientInitializationError
  {
    const initError = {
      name: 'PrismaClientInitializationError',
      errorCode: 'P1001',
      cause: { code: 'ECONNREFUSED' },
    };
    assert.equal(isDatabaseConnectivityError(initError), true);
    passedTests++;
    console.log('  ✓ 1.9: PrismaClientInitializationError with underlying P1001/ECONNREFUSED triggers fallback');
  }

  // ==========================================
  // SECTION 2: NEGATIVE FALLBACK CASES (Must return false and be re-thrown)
  // ==========================================
  console.log('\n[Section 2] Negative Fallback Cases (Must NOT trigger fallback; re-thrown)');

  // 2.1 P1000 (Authentication failure — configuration error)
  assert.equal(isDatabaseConnectivityError({ code: 'P1000' }), false);
  passedTests++;
  console.log('  ✓ 2.1: P1000 (Authentication failed) rejected from fallback');

  // 2.2 P1003 (Database does not exist — configuration error)
  assert.equal(isDatabaseConnectivityError({ code: 'P1003' }), false);
  passedTests++;
  console.log('  ✓ 2.2: P1003 (Database does not exist) rejected from fallback');

  // 2.3 P2002 (Unique constraint violation)
  assert.equal(isDatabaseConnectivityError({ code: 'P2002' }), false);
  passedTests++;
  console.log('  ✓ 2.3: P2002 (Unique constraint violation) rejected from fallback');

  // 2.4 P2025 (Record not found)
  assert.equal(isDatabaseConnectivityError({ code: 'P2025' }), false);
  passedTests++;
  console.log('  ✓ 2.4: P2025 (Record not found) rejected from fallback');

  // 2.5 TypeError (Programming defect)
  assert.equal(isDatabaseConnectivityError(new TypeError('Cannot read properties of undefined')), false);
  passedTests++;
  console.log('  ✓ 2.5: TypeError rejected from fallback');

  // 2.6 SyntaxError (Programming defect)
  assert.equal(isDatabaseConnectivityError(new SyntaxError('Unexpected token in JSON')), false);
  passedTests++;
  console.log('  ✓ 2.6: SyntaxError rejected from fallback');

  // 2.7 ReferenceError (Programming defect)
  assert.equal(isDatabaseConnectivityError(new ReferenceError('variable is not defined')), false);
  passedTests++;
  console.log('  ✓ 2.7: ReferenceError rejected from fallback');

  // 2.8 Validation error
  assert.equal(isDatabaseConnectivityError({ name: 'ValidationError', message: 'Validation error: invalid project' }), false);
  assert.equal(isDatabaseConnectivityError(new Error('Invalid project title: cannot be empty')), false);
  passedTests++;
  console.log('  ✓ 2.8: Validation errors rejected from fallback');

  // 2.9 Mapping error
  assert.equal(isDatabaseConnectivityError({ name: 'MappingError', message: 'Mapping error: failed to map row' }), false);
  passedTests++;
  console.log('  ✓ 2.9: Mapping errors rejected from fallback');

  // 2.10 Unknown Prisma error (e.g. P2003 Foreign Key, P3000 Migration)
  assert.equal(isDatabaseConnectivityError({ code: 'P2003' }), false);
  assert.equal(isDatabaseConnectivityError({ code: 'P3000' }), false);
  passedTests++;
  console.log('  ✓ 2.10: Unknown Prisma codes (P2003, P3000) rejected from fallback');

  // 2.11 Unknown nested error
  {
    const unknownNested = new Error('Unhandled exception in repository');
    (unknownNested as { cause?: unknown }).cause = { code: 'CUSTOM_UNKNOWN_CODE' };
    assert.equal(isDatabaseConnectivityError(unknownNested), false);
    passedTests++;
    console.log('  ✓ 2.11: Unknown nested error structure fails closed (rejected)');
  }

  // 2.12 Circular cause structure (Must not loop infinitely; must fail closed)
  {
    const errA: { name: string; cause?: unknown } = { name: 'ErrorA' };
    const errB: { name: string; cause?: unknown } = { name: 'ErrorB' };
    errA.cause = errB;
    errB.cause = errA; // Circular reference

    assert.doesNotThrow(() => {
      const result = isDatabaseConnectivityError(errA);
      assert.equal(result, false, 'Circular cause without recognized code must fail closed');
    }, 'Circular reference must never cause infinite recursion or stack overflow');
    passedTests++;
    console.log('  ✓ 2.12: Circular cause structure safely terminates and fails closed');
  }

  // 2.13 Nested connectivity cause with higher-priority configuration error (P1000)
  {
    const conflictError: { code: string; cause: { code: string } } = {
      code: 'P1000', // Configuration failure (disqualifier)
      cause: { code: 'P1001' }, // Nested connectivity failure
    };
    assert.equal(isDatabaseConnectivityError(conflictError), false);
    passedTests++;
    console.log('  ✓ 2.13: Higher-priority configuration error (P1000) overrides nested P1001');
  }

  // 2.14 Nested connectivity cause with higher-priority programming error (TypeError)
  {
    const typeErrorWithCause = new TypeError('Cannot read properties of null');
    (typeErrorWithCause as { cause?: unknown }).cause = { code: 'ECONNREFUSED' };
    assert.equal(isDatabaseConnectivityError(typeErrorWithCause), false);
    passedTests++;
    console.log('  ✓ 2.14: Higher-priority programming error (TypeError) overrides nested ECONNREFUSED');
  }

  // ==========================================
  // SECTION 3: REPOSITORY BEHAVIOR TESTS
  // ==========================================
  console.log('\n[Section 3] Repository Behavior Tests (ResilientPortfolioRepository)');

  // 3.1 Primary repository is called first
  {
    const callOrder: string[] = [];
    const mockPrimary: IPortfolioRepository<Promise<Portfolio>> = {
      getPortfolioData: async () => {
        callOrder.push('primary');
        return dummyPrismaPortfolio;
      },
    };
    const mockFallback: IPortfolioRepository<Portfolio> = {
      getPortfolioData: () => {
        callOrder.push('fallback');
        return dummyStaticPortfolio;
      },
    };

    const resilient = new ResilientPortfolioRepository(mockPrimary, mockFallback);
    const result = await resilient.getPortfolioData();
    assert.deepEqual(callOrder, ['primary']);
    assert.equal(result.hero.tagline, 'Prisma Live Tagline');
    passedTests++;
    console.log('  ✓ 3.1: Primary repository is called first and exclusively on success');
  }

  // 3.2 Static repository is called ONLY for recognized connectivity failures
  {
    let primaryAttempted = false;
    let fallbackAttempted = false;

    const mockPrimary: IPortfolioRepository<Promise<Portfolio>> = {
      getPortfolioData: async () => {
        primaryAttempted = true;
        const err = new Error('Connection timed out');
        (err as { code?: string }).code = 'ETIMEDOUT';
        throw err;
      },
    };
    const mockFallback: IPortfolioRepository<Portfolio> = {
      getPortfolioData: () => {
        fallbackAttempted = true;
        return dummyStaticPortfolio;
      },
    };

    const resilient = new ResilientPortfolioRepository(mockPrimary, mockFallback);
    const result = await resilient.getPortfolioData();
    assert.equal(primaryAttempted, true);
    assert.equal(fallbackAttempted, true);
    assert.equal(result.hero.tagline, 'Static Tagline');
    passedTests++;
    console.log('  ✓ 3.2: Static repository called when primary throws ETIMEDOUT');
  }

  // 3.3 Static repository is NOT called for configuration errors (P1000)
  {
    let fallbackCalled = false;
    const authError = new Error('Authentication failed against database');
    (authError as { code?: string }).code = 'P1000';

    const mockPrimary: IPortfolioRepository<Promise<Portfolio>> = {
      getPortfolioData: async () => {
        throw authError;
      },
    };
    const mockFallback: IPortfolioRepository<Portfolio> = {
      getPortfolioData: () => {
        fallbackCalled = true;
        return dummyStaticPortfolio;
      },
    };

    const resilient = new ResilientPortfolioRepository(mockPrimary, mockFallback);
    await assert.rejects(
      async () => {
        await resilient.getPortfolioData();
      },
      (err: unknown) => {
        assert.strictEqual(err, authError, 'Original auth error object must be preserved');
        return true;
      },
      'P1000 must be re-thrown'
    );
    assert.equal(fallbackCalled, false, 'Fallback must NOT be called on P1000');
    passedTests++;
    console.log('  ✓ 3.3: Static repository is NOT called for configuration error P1000');
  }

  // 3.4 Static repository is NOT called for programming errors (TypeError)
  {
    let fallbackCalled = false;
    const programmingError = new TypeError('Undefined variable in mapping');

    const mockPrimary: IPortfolioRepository<Promise<Portfolio>> = {
      getPortfolioData: async () => {
        throw programmingError;
      },
    };
    const mockFallback: IPortfolioRepository<Portfolio> = {
      getPortfolioData: () => {
        fallbackCalled = true;
        return dummyStaticPortfolio;
      },
    };

    const resilient = new ResilientPortfolioRepository(mockPrimary, mockFallback);
    await assert.rejects(
      async () => {
        await resilient.getPortfolioData();
      },
      (err: unknown) => {
        assert.strictEqual(err, programmingError, 'Original TypeError must be preserved');
        return true;
      },
      'Programming error must be re-thrown'
    );
    assert.equal(fallbackCalled, false, 'Fallback must NOT be called on TypeError');
    passedTests++;
    console.log('  ✓ 3.4: Static repository is NOT called for programming error TypeError');
  }

  // 3.5 Fallback repository failures propagate unchanged
  {
    const fallbackError = new Error('Static repository file read failure');

    const mockPrimary: IPortfolioRepository<Promise<Portfolio>> = {
      getPortfolioData: async () => {
        const err = new Error('Socket closed');
        (err as { code?: string }).code = 'ECONNRESET';
        throw err;
      },
    };
    const mockFallback: IPortfolioRepository<Portfolio> = {
      getPortfolioData: () => {
        throw fallbackError;
      },
    };

    const resilient = new ResilientPortfolioRepository(mockPrimary, mockFallback);
    await assert.rejects(
      async () => {
        await resilient.getPortfolioData();
      },
      (err: unknown) => {
        assert.strictEqual(err, fallbackError, 'Fallback error must propagate unchanged');
        return true;
      },
      'Fallback error must propagate'
    );
    passedTests++;
    console.log('  ✓ 3.5: Fallback repository failures propagate unchanged');
  }

  // 3.6 Original primary error is preserved when re-thrown
  {
    const originalCustomError = {
      name: 'CustomQueryException',
      code: 'P2025',
      customField: 42,
    };

    const mockPrimary: IPortfolioRepository<Promise<Portfolio>> = {
      getPortfolioData: async () => {
        throw originalCustomError;
      },
    };
    const mockFallback: IPortfolioRepository<Portfolio> = {
      getPortfolioData: () => dummyStaticPortfolio,
    };

    const resilient = new ResilientPortfolioRepository(mockPrimary, mockFallback);
    try {
      await resilient.getPortfolioData();
      assert.fail('Expected exception');
    } catch (err) {
      assert.strictEqual(err, originalCustomError, 'Exact object identity must be preserved');
      assert.equal((err as typeof originalCustomError).customField, 42);
    }
    passedTests++;
    console.log('  ✓ 3.6: Original primary error object is preserved verbatim when re-thrown');
  }

  // 3.7 No repository mutation methods introduced
  {
    const proto = ResilientPortfolioRepository.prototype as unknown as Record<string, unknown>;
    const methodNames = Object.getOwnPropertyNames(proto).filter(
      (m) => typeof proto[m] === 'function' && m !== 'constructor'
    );
    assert.deepEqual(methodNames, ['getPortfolioData'], 'Only read method getPortfolioData must exist');
    passedTests++;
    console.log('  ✓ 3.7: ResilientPortfolioRepository is strictly read-only (no mutation methods)');
  }

  console.log(`\n==============================================`);
  console.log(`ALL CLASSIFIER MATRIX TESTS PASSED: ${passedTests} / ${passedTests} verified.`);
  console.log(`==============================================`);
}

runClassifierTests().catch((err) => {
  console.error('\n❌ Classifier test matrix failed:', err);
  process.exit(1);
});
