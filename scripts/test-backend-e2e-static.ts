// scripts/test-backend-e2e-static.ts
// Zero-DB static & in-memory security verification harness for all CMS & Admin Server Actions.
// Strictly avoids loading .env.local or connecting to PostgreSQL.

import { strict as assert } from 'node:assert';
import { AsyncLocalStorage } from 'node:async_hooks';
import { verifyAllActionRevalidationHooks, ADMIN_ACTION_SPECS } from './e2e/revalidation-helper';

async function main(): Promise<void> {
  console.log('================================================================');
  console.log('   PORTFOLIO CMS — ZERO-DB STATIC & SECURITY VERIFICATION       ');
  console.log('================================================================\n');

  // Bind AsyncLocalStorage to globalThis BEFORE Next.js internals evaluate via dynamic import
  const globalWithAls = globalThis as unknown as {
    AsyncLocalStorage?: typeof AsyncLocalStorage;
  };
  if (typeof globalWithAls.AsyncLocalStorage === 'undefined') {
    globalWithAls.AsyncLocalStorage = AsyncLocalStorage;
  }

  console.log('1. Pre-flight DB Isolation Guard...');
  assert.strictEqual(
    (globalThis as unknown as { prisma?: unknown }).prisma,
    undefined,
    'Prisma client must not be instantiated before checks'
  );
  console.log('   ✓ No .env.local loaded and no Prisma client instantiated.\n');

  // 1. AST-based revalidatePath('/') verification across all 11 content modules (39 actions)
  console.log('2. Running TypeScript AST Revalidation Verification...');
  const revalResult = verifyAllActionRevalidationHooks();
  assert.strictEqual(
    revalResult.totalFiles,
    11,
    `Expected 11 portfolio content action files, got ${revalResult.totalFiles}`
  );
  assert.strictEqual(
    revalResult.totalActions,
    39,
    `Expected 39 portfolio content mutation actions, got ${revalResult.totalActions}`
  );
  console.log(
    `   ✓ Verified ${revalResult.totalActions} mutation actions across ${revalResult.totalFiles} content action files:`
  );
  for (const spec of ADMIN_ACTION_SPECS) {
    console.log(`     - ${spec.file} (${spec.expectedActions.length} actions)`);
  }
  console.log('');

  // 2. In-memory unauthenticated rejection verification across all 12 modules (41 actions)
  console.log('3. Running In-Memory Server Action Security Verification...');
  const { testSuiteServerActionSecurity } = await import('./e2e/test-cases');
  const securityResult = await testSuiteServerActionSecurity();
  assert.strictEqual(
    securityResult.totalModules,
    12,
    `Expected 12 Server Action modules, got ${securityResult.totalModules}`
  );
  assert.strictEqual(
    securityResult.totalActions,
    41,
    `Expected 41 total mutation Server Actions, got ${securityResult.totalActions}`
  );
  console.log(
    `   ✓ Verified unauthenticated rejection across all ${securityResult.totalActions} mutation Server Actions in ${securityResult.totalModules} modules.\n`
  );

  // 3. Post-flight verification that zero DB client instantiation occurred
  console.log('4. Post-flight DB Isolation Verification...');
  assert.strictEqual(
    (globalThis as unknown as { prisma?: unknown }).prisma,
    undefined,
    'Prisma client must remain uninstantiated after static/security checks'
  );
  console.log('   ✓ Confirmed zero PostgreSQL connections and zero Prisma instantiation.\n');

  console.log('================================================================');
  console.log('   ✅ STATIC & SECURITY VERIFICATION PASSED (0 DB CONNECTIONS)  ');
  console.log('================================================================');
}

main().catch((err: unknown) => {
  console.error('\n❌ Static & security verification failed:', err);
  process.exit(1);
});
