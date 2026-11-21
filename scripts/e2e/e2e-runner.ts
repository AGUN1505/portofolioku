// scripts/e2e/e2e-runner.ts
// Master orchestrator for E2E authentication, route protection, and Server Action mutations.
// Strictly isolated to porto_cms_e2e on localhost:5432.
// Zero connections, queries, or dependencies on the primary database (porto_cms) or external databases.

import { Client } from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { assertE2EDatabase } from './e2e-guard';
import { setupTestAdmin, cleanupTestAdmin, type TestAdminRecord } from './auth-fixture';
import { createTestSessionToken } from './session-helper';
import { cleanupTestData } from './cleanup-helper';
import {
  testSuiteAuthLifecycle,
  testSuiteRouteProtection,
  testSuiteServerActionSecurity,
  testSuiteHeroMutation,
  testSuiteAboutMutation,
  testSuiteContactMutation,
  testSuiteProjectCrudAndReorder,
  testSuiteExperienceCrudAndReorder,
  testSuiteContactChannelCrudAndReorder,
} from './test-cases';
import { verifyAllActionRevalidationHooks } from './revalidation-helper';

export async function main(): Promise<void> {
  console.log('================================================================');
  console.log('   PORTFOLIO CMS — PHASE 5.5.5 ISOLATED E2E TEST HARNESS       ');
  console.log('================================================================\n');

  // 1. Strict pre-flight target validation (Zero connections before guard passes)
  console.log('1. Validating database target isolation...');
  const targetConfig = assertE2EDatabase();
  console.log(`   ✓ Target validated: ${targetConfig.databaseName} on ${targetConfig.hostname}:${targetConfig.port}`);
  console.log('   ✓ Zero-access guard active: porto_cms and external databases strictly unreferenced.\n');

  // 2. Initialize single controlled E2E database connections
  const targetConnectionString = process.env.DATABASE_URL!;
  const pgClient = new Client({ connectionString: targetConnectionString });
  await pgClient.connect();

  const adapter = new PrismaPg({ connectionString: targetConnectionString });
  const prisma = new PrismaClient({ adapter });

  const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
  globalForPrisma.prisma = prisma;

  let testAdmin: TestAdminRecord | null = null;
  let executionError: Error | null = null;

  try {
    // 3. Provision dedicated test admin with ephemeral credentials
    console.log('2. Provisioning isolated test admin on porto_cms_e2e...');
    testAdmin = await setupTestAdmin(pgClient);
    console.log(`   ✓ Test admin provisioned (id: ${testAdmin.id}, username: ${testAdmin.username})\n`);

    // Create authentic active session token for Server Action mutations
    const authToken = await createTestSessionToken(
      testAdmin.id,
      testAdmin.username,
      testAdmin.sessionVersion
    );

    // 4. Suite 1: Authentication & Session Lifecycle
    console.log('3. Running Suite 1: Authentication & Session Lifecycle...');
    await testSuiteAuthLifecycle(prisma, testAdmin);
    console.log('   ✓ Suite 1 PASS: Login, Iron Session AES-256 seal, DAL verification, expiry & revocation verified.\n');

    // 5. Suite 2: Admin Route Protection (Proxy / Middleware)
    console.log('4. Running Suite 2: Admin Route Protection...');
    await testSuiteRouteProtection(testAdmin);
    console.log('   ✓ Suite 2 PASS: /admin redirect (307), authorized access (200), and public routes verified.\n');

    // 6. Suite 3: Server Action Security (Unauthenticated Rejection)
    console.log('5. Running Suite 3: Server Action Security...');
    const secResult = await testSuiteServerActionSecurity();
    console.log(
      `   ✓ Suite 3 PASS: Unauthenticated calls to all ${secResult.totalActions} Server Actions across ${secResult.totalModules} modules strictly rejected.\n`
    );

    // 7. Suite 4: Hero Profile Mutation via Server Action
    console.log('6. Running Suite 4: Hero Profile Mutation via Server Action...');
    await testSuiteHeroMutation(prisma, authToken);
    console.log('   ✓ Suite 4 PASS: updateHeroProfileAction succeeded, persisted, and baseline restored.\n');

    // 8. Suite 5: About Profile Mutation via Server Action
    console.log('7. Running Suite 5: About Profile Mutation via Server Action...');
    await testSuiteAboutMutation(prisma, authToken);
    console.log('   ✓ Suite 5 PASS: updateAboutProfileAction succeeded, persisted, and baseline restored.\n');

    // 9. Suite 6: Contact Profile Mutation via Server Action
    console.log('8. Running Suite 6: Contact Profile Mutation via Server Action...');
    await testSuiteContactMutation(prisma, authToken);
    console.log('   ✓ Suite 6 PASS: updateContactProfileAction succeeded, persisted, and baseline restored.\n');

    // 10. Suite 7: Project CRUD & Reorder via Server Actions
    console.log('9. Running Suite 7: Project CRUD & Reorder via Server Actions...');
    await testSuiteProjectCrudAndReorder(prisma, authToken);
    console.log('   ✓ Suite 7 PASS: create, update, reorder, deleteProjectAction verified with tracked cleanup.\n');

    // 11. Suite 8: Experience CRUD & Reorder via Server Actions
    console.log('10. Running Suite 8: Experience CRUD & Reorder via Server Actions...');
    await testSuiteExperienceCrudAndReorder(prisma, authToken);
    console.log('   ✓ Suite 8 PASS: create, update, reorder, deleteExperienceAction verified with tracked cleanup.\n');

    // 12. Suite 9: ContactChannel CRUD & Reorder via Server Actions
    console.log('11. Running Suite 9: ContactChannel CRUD & Reorder via Server Actions...');
    await testSuiteContactChannelCrudAndReorder(prisma, authToken);
    console.log('   ✓ Suite 9 PASS: create, update, reorder, deleteContactChannelAction verified with tracked cleanup.\n');

    // 13. Suite 10: TypeScript AST Revalidation Verification
    console.log('12. Running Suite 10: AST-Based revalidatePath(\'/\') Verification...');
    const revalResult = verifyAllActionRevalidationHooks();
    console.log(`   ✓ Suite 10 PASS: Verified ${revalResult.totalActions} actions across ${revalResult.totalFiles} files on success path.\n`);
  } catch (err: unknown) {
    executionError = err instanceof Error ? err : new Error(String(err));
    console.error('\n❌ [E2E-RUNNER-ERROR] Suite execution failed:', executionError.message);
  } finally {
    // 14. Guaranteed Teardown & Resource Cleanup (Runs regardless of test pass or fail)
    console.log('13. Executing guaranteed teardown & cleanup on porto_cms_e2e...');
    try {
      if (testAdmin) {
        await cleanupTestData(prisma, { adminId: testAdmin.id });
        await cleanupTestAdmin(pgClient, testAdmin.id);
        console.log(`   ✓ Cleaned up test admin record: ${testAdmin.id}`);
      }

      const remainingTestAdmins = await prisma.admin.count({
        where: { id: testAdmin ? testAdmin.id : 'e2e_test_admin_singleton' },
      });
      if (remainingTestAdmins !== 0) {
        console.error('   ⚠️ [CLEANUP-WARNING] Residual test admin records found after cleanup!');
      } else {
        console.log('   ✓ Post-flight verification: 0 test admins remaining in porto_cms_e2e.');
      }
    } catch (cleanupErr: unknown) {
      console.error('   ❌ [CLEANUP-ERROR] Failed during cleanup:', cleanupErr);
    } finally {
      // 14. Graceful Socket & Client Disconnection
      await prisma.$disconnect();
      await pgClient.end();
      globalForPrisma.prisma = undefined;
      console.log('   ✓ E2E database connections closed gracefully.\n');
    }
  }

  if (executionError) {
    console.error('================================================================');
    console.error('   ❌ E2E RUN FAILED WITH ERRORS                                ');
    console.error('================================================================');
    throw executionError;
  }

  console.log('================================================================');
  console.log('   ✅ ALL 10 E2E TEST SUITES PASSED SUCCESSFULLY               ');
  console.log('================================================================');
}

// Self-invoking when executed as main module
if (require.main === module) {
  main().catch(() => {
    process.exit(1);
  });
}
