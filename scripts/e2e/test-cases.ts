// scripts/e2e/test-cases.ts
// Test cases for authentication, route protection, and isolated E2E mutations via Server Actions.
// Fully exercises Next.js Server Actions with real DAL session verification and baseline preservation.

import { strict as assert } from 'node:assert';
import { NextRequest } from 'next/server';
import type { PrismaClient } from '@prisma/client';
// NEXT.JS INTERNAL API USAGE (MAINTENANCE NOTE):
// The imports below (workAsyncStorage, workUnitAsyncStorage) are internal, private Next.js APIs.
// They are NOT public or stable contracts.
// This harness was developed and verified specifically for Next.js 16 (currently installed in package.json).
// ANY Next.js upgrade (minor or major) MUST trigger a manual re-audit of:
// 1. The export paths ('next/dist/server/app-render/work-async-storage.external', etc.)
// 2. The internal storage structure (workStore.route, workStore.incrementalCache, workUnitStore.phase, workUnitStore.cookies)
// 3. Compatibility with server utilities: cookies(), headers(), and revalidatePath().
// Never claim or treat these APIs as stable or public.
import { workAsyncStorage } from 'next/dist/server/app-render/work-async-storage.external';
import { workUnitAsyncStorage } from 'next/dist/server/app-render/work-unit-async-storage.external';
import { proxy } from '../../proxy';
import {
  SESSION_COOKIE_NAME,
  unsealSession,
} from '../../src/infrastructure/auth/session';
import {
  createTestSessionToken,
  createExpiredSessionToken,
  createTamperedSessionToken,
} from './session-helper';
import { validateSessionAuthoritatively } from './validation-helper';
import {
  takeBaselineSingletonsSnapshot,
  restoreBaselineSingletons,
  takeBaselineOrderSnapshot,
  restoreBaselineOrder,
  cleanupTestData,
} from './cleanup-helper';
import { CompositionRoot } from '../../src/infrastructure/composition-root';
import { type TestAdminRecord } from './auth-fixture';

// Server Actions
import { updateHeroProfileAction } from '../../app/admin/(dashboard)/hero/actions';
import { updateAboutProfileAction } from '../../app/admin/(dashboard)/about/actions';
import { updateContactProfileAction } from '../../app/admin/(dashboard)/contact/actions';
import {
  createProjectAction,
  updateProjectAction,
  deleteProjectAction,
  reorderProjectsAction,
} from '../../app/admin/(dashboard)/projects/actions';
import {
  createExperienceAction,
  updateExperienceAction,
  deleteExperienceAction,
  reorderExperiencesAction,
} from '../../app/admin/(dashboard)/experiences/actions';
import {
  createRoleAction,
  updateRoleAction,
  deleteRoleAction,
  reorderRolesAction,
} from '../../app/admin/(dashboard)/roles/actions';
import {
  createEngineeringNodeAction,
  updateEngineeringNodeAction,
  deleteEngineeringNodeAction,
  reorderEngineeringNodesAction,
} from '../../app/admin/(dashboard)/engineering-nodes/actions';
import {
  createDomainAction,
  updateDomainAction,
  deleteDomainAction,
  reorderDomainsAction,
} from '../../app/admin/(dashboard)/domains/actions';
import {
  createPillarAction,
  updatePillarAction,
  deletePillarAction,
  reorderPillarsAction,
} from '../../app/admin/(dashboard)/pillars/actions';
import {
  createSkillCategoryAction,
  updateSkillCategoryAction,
  deleteSkillCategoryAction,
  reorderSkillCategoriesAction,
  createSkillAction,
  updateSkillAction,
  deleteSkillAction,
  reorderSkillsAction,
} from '../../app/admin/(dashboard)/skills/actions';
import {
  createContactChannelAction,
  updateContactChannelAction,
  deleteContactChannelAction,
  reorderContactChannelsAction,
} from '../../app/admin/(dashboard)/contact-channels/actions';
import {
  updateAdminProfileAction,
  changeAdminPasswordAction,
} from '../../app/admin/(dashboard)/account/actions';

/**
 * Context runner that simulates the Next.js Server Action request scope.
 *
 * MAINTENANCE & STABILITY WARNING:
 * Relies on Next.js 16 private internal AsyncLocalStorage contracts (workAsyncStorage, workUnitAsyncStorage).
 * These APIs are internal and subject to change across Next.js versions.
 * Any framework upgrade must re-verify that headers, cookies, and revalidation hooks remain functional.
 * This harness is strictly an in-process integration test, not a browser-level E2E runner.
 *
 * Binds the authentic Iron Session cookie and mock headers so cookies() and headers()
 * inside DAL verifySession() execute without error and without mocking.
 */
export async function runInActionContext<T>(
  token: string | null,
  fn: () => Promise<T>
): Promise<T> {
  const cookieMap = new Map<string, { name: string; value: string }>();
  if (token) {
    cookieMap.set(SESSION_COOKIE_NAME, { name: SESSION_COOKIE_NAME, value: token });
  }

  const mockCookieStore = {
    get(name: string) {
      return cookieMap.get(name);
    },
    getAll() {
      return Array.from(cookieMap.values());
    },
    has(name: string) {
      return cookieMap.has(name);
    },
    set(name: string, value: string) {
      cookieMap.set(name, { name, value });
    },
    delete(name: string) {
      cookieMap.delete(name);
    },
  };

  const headerList = new Headers({
    'x-forwarded-for': '127.0.0.1',
    host: 'localhost:3000',
  });

  type AsyncRunner = {
    run: <R>(store: unknown, callback: () => Promise<R>) => Promise<R>;
  };

  const workStore: Record<string, unknown> = {
    route: '/admin',
    incrementalCache: {
      revalidateTag: async () => {},
    },
  };

  const workUnitStore: Record<string, unknown> = {
    type: 'request',
    phase: 'action',
    cookies: mockCookieStore,
    userspaceMutableCookies: mockCookieStore,
    headers: headerList,
  };

  const workRunner = workAsyncStorage as unknown as AsyncRunner;
  const workUnitRunner = workUnitAsyncStorage as unknown as AsyncRunner;

  return workRunner.run(workStore, () =>
    workUnitRunner.run(workUnitStore, fn)
  );
}

/**
 * AggregateError interface and constructor resolution for ES2017 target environments.
 * Ensures native globalThis.AggregateError is used when available, with a fully compatible fallback.
 */
interface IAggregateError extends Error {
  errors: Error[];
}

const SafeAggregateError: {
  new (errors: Error[], message?: string): IAggregateError;
} =
  (globalThis as unknown as { AggregateError?: { new (errors: Error[], message?: string): IAggregateError } })
    .AggregateError ??
  class CustomAggregateError extends Error implements IAggregateError {
    errors: Error[];
    constructor(errors: Error[], message?: string) {
      super(message);
      this.name = 'AggregateError';
      this.errors = errors;
    }
  };

/**
 * Helper to propagate collected suite, cleanup, and restoration errors without masking.
 * Preserves original Error objects, stack traces, and creates an AggregateError when multiple errors occur.
 */
function handleCollectedErrors(errors: (Error | null)[], suiteName: string): void {
  const activeErrors = errors.filter((e): e is Error => e !== null);
  if (activeErrors.length === 0) {
    return;
  }
  if (activeErrors.length === 1) {
    throw activeErrors[0];
  }

  const prefix = activeErrors.length === 2 ? '[E2E-DUAL-FAILURE]' : '[E2E-MULTIPLE-FAILURES]';
  const detailLines = activeErrors
    .map((e, idx) => `  ${idx + 1}. [${e.name}] ${e.message}`)
    .join('\n');

  throw new SafeAggregateError(
    activeErrors,
    `${prefix} ${suiteName} encountered ${activeErrors.length} failures:\n${detailLines}`
  );
}

/**
 * Suite 1: Authentication & Session Lifecycle
 */
export async function testSuiteAuthLifecycle(
  prisma: PrismaClient,
  admin: TestAdminRecord
): Promise<void> {
  CompositionRoot.resetForTesting();
  const loginUseCase = CompositionRoot.getLoginAdminUseCase();

  const adminEmail = (admin as unknown as { email?: string }).email ?? `${admin.username}@example.com`;

  // 1. Invalid password rejection
  const invalidRes = await loginUseCase.execute({
    email: adminEmail,
    password: 'WrongPassword!123',
    clientIP: '127.0.0.1',
  });
  assert.strictEqual(invalidRes.success, false, 'Invalid credentials must be rejected');

  // 2. Successful login with ephemeral test password
  const loginRes = await loginUseCase.execute({
    email: adminEmail,
    password: admin.plainPassword,
    clientIP: '127.0.0.1',
  });
  assert.strictEqual(loginRes.success, true, 'Login with correct test credentials must succeed');
  assert(loginRes.admin !== undefined, 'Admin record must be returned');
  assert.strictEqual(loginRes.admin?.id, admin.id, 'Admin ID must match fixture');

  // 3. Cookie sealing & unsealing (Iron Session AES-256)
  const token = await createTestSessionToken(admin.id, admin.username, admin.sessionVersion);
  assert(token.length > 30, 'Sealed token must be encrypted ciphertext');

  const payload = await unsealSession(token);
  assert(payload !== null, 'Valid token must be successfully unsealed');
  assert.strictEqual(payload?.userId, admin.id, 'Unsealed user ID must match');

  // 4. Authoritative DAL verification
  const verified = await validateSessionAuthoritatively(token, prisma);
  assert.strictEqual(verified.userId, admin.id, 'DAL verification must succeed');
  assert.strictEqual(verified.sessionVersion, admin.sessionVersion, 'Session version must match');

  // 5. Expired token rejection
  const expiredToken = await createExpiredSessionToken(admin.id, admin.username, admin.sessionVersion);
  const expiredPayload = await unsealSession(expiredToken);
  assert.strictEqual(expiredPayload, null, 'Expired session must fail unseal check');

  // 6. Tampered token rejection
  const tamperedToken = createTamperedSessionToken();
  const tamperedPayload = await unsealSession(tamperedToken);
  assert.strictEqual(tamperedPayload, null, 'Tampered token must fail unseal check');

  // 7. Session revocation via sessionVersion bump
  await prisma.admin.update({
    where: { id: admin.id },
    data: { sessionVersion: admin.sessionVersion + 1 },
  });

  let revocationTestError: Error | null = null;
  let restoreVersionError: Error | null = null;

  try {
    let revocationRejected = false;
    try {
      await validateSessionAuthoritatively(token, prisma);
    } catch (err: unknown) {
      revocationRejected = true;
      const msg = err instanceof Error ? err.message : String(err);
      assert(msg.includes('Session version mismatch'), 'Rejection must be due to version mismatch');
    }
    assert.strictEqual(revocationRejected, true, 'Revoked session must be rejected by DAL');
  } catch (err: unknown) {
    revocationTestError = err instanceof Error ? err : new Error(String(err));
  } finally {
    try {
      // Restore sessionVersion
      await prisma.admin.update({
        where: { id: admin.id },
        data: { sessionVersion: admin.sessionVersion },
      });
    } catch (err: unknown) {
      restoreVersionError = err instanceof Error ? err : new Error(String(err));
    }

    handleCollectedErrors(
      [revocationTestError, restoreVersionError],
      'Auth lifecycle session revocation test'
    );
  }
}

/**
 * Suite 2: Admin Route Protection (Proxy / Middleware)
 */
export async function testSuiteRouteProtection(admin: TestAdminRecord): Promise<void> {
  // 1. Unauthenticated request to /admin -> Redirect to /admin/login
  const unauthReq = new NextRequest('http://localhost:3000/admin');
  const unauthRes = await proxy(unauthReq);
  assert.strictEqual(unauthRes.status, 307, 'Unauthenticated /admin must redirect with 307');
  assert(unauthRes.headers.get('location')?.includes('/admin/login'), 'Redirect target must be /admin/login');

  // 2. Authenticated request with valid session token -> Forwarded (200)
  const token = await createTestSessionToken(admin.id, admin.username, admin.sessionVersion);
  const authReq = new NextRequest('http://localhost:3000/admin', {
    headers: {
      cookie: `${SESSION_COOKIE_NAME}=${token}`,
    },
  });
  const authRes = await proxy(authReq);
  assert.strictEqual(authRes.status, 200, 'Authenticated request to /admin must be forwarded');

  // 3. Expired token request -> Redirect to /admin/login
  const expiredToken = await createExpiredSessionToken(admin.id, admin.username, admin.sessionVersion);
  const expReq = new NextRequest('http://localhost:3000/admin', {
    headers: {
      cookie: `${SESSION_COOKIE_NAME}=${expiredToken}`,
    },
  });
  const expRes = await proxy(expReq);
  assert.strictEqual(expRes.status, 307, 'Expired token to /admin must redirect');

  // 4. Public routes are uninhibited
  const publicReq = new NextRequest('http://localhost:3000/');
  const publicRes = await proxy(publicReq);
  assert.strictEqual(publicRes.status, 200, 'Public root route must not be blocked');
}

/**
 * Suite 3: Server Action Security (Unauthenticated Rejection)
 * Verifies all 41 mutation Server Actions across 12 CMS/Admin modules reject
 * unauthenticated calls in-process without requiring a database connection or .env.local.
 */
export async function testSuiteServerActionSecurity(): Promise<{
  totalModules: number;
  totalActions: number;
}> {
  const dummyForm = new FormData();
  dummyForm.append('name', 'Hacker Attempt');
  dummyForm.append('title', 'Hacker Title');
  dummyForm.append('heading', 'Hacker Heading');
  dummyForm.append('tagline', 'Hacked');
  dummyForm.append('role', 'Hacker Role');
  dummyForm.append('tag', 'HACK');
  dummyForm.append('index', '00');
  dummyForm.append('label', 'Hacker Channel');
  dummyForm.append('value', 'https://example.com');
  dummyForm.append('username', 'hacker');
  dummyForm.append('currentPassword', 'Wrong123!');

  const dummyId = 'e2e-unauth-id';
  const dummyIds = ['e2e-unauth-id-1', 'e2e-unauth-id-2'];

  const actionChecks: Array<{
    module: string;
    name: string;
    invoke: () => Promise<{ success: boolean; error?: string }>;
  }> = [
    // 1. Hero (1)
    {
      module: 'hero',
      name: 'updateHeroProfileAction',
      invoke: () => updateHeroProfileAction({ success: false }, dummyForm),
    },
    // 2. About (1)
    {
      module: 'about',
      name: 'updateAboutProfileAction',
      invoke: () => updateAboutProfileAction({ success: false }, dummyForm),
    },
    // 3. Contact (1)
    {
      module: 'contact',
      name: 'updateContactProfileAction',
      invoke: () => updateContactProfileAction({ success: false }, dummyForm),
    },
    // 4. Projects (4)
    {
      module: 'projects',
      name: 'createProjectAction',
      invoke: () => createProjectAction({ success: false }, dummyForm),
    },
    {
      module: 'projects',
      name: 'updateProjectAction',
      invoke: () => updateProjectAction(dummyId, { success: false }, dummyForm),
    },
    {
      module: 'projects',
      name: 'deleteProjectAction',
      invoke: () => deleteProjectAction(dummyId),
    },
    {
      module: 'projects',
      name: 'reorderProjectsAction',
      invoke: () => reorderProjectsAction(dummyIds),
    },
    // 5. Experiences (4)
    {
      module: 'experiences',
      name: 'createExperienceAction',
      invoke: () => createExperienceAction({ success: false }, dummyForm),
    },
    {
      module: 'experiences',
      name: 'updateExperienceAction',
      invoke: () => updateExperienceAction(dummyId, { success: false }, dummyForm),
    },
    {
      module: 'experiences',
      name: 'deleteExperienceAction',
      invoke: () => deleteExperienceAction(dummyId),
    },
    {
      module: 'experiences',
      name: 'reorderExperiencesAction',
      invoke: () => reorderExperiencesAction(dummyIds),
    },
    // 6. Roles (4)
    {
      module: 'roles',
      name: 'createRoleAction',
      invoke: () => createRoleAction({ success: false }, dummyForm),
    },
    {
      module: 'roles',
      name: 'updateRoleAction',
      invoke: () => updateRoleAction(dummyId, { success: false }, dummyForm),
    },
    {
      module: 'roles',
      name: 'deleteRoleAction',
      invoke: () => deleteRoleAction(dummyId),
    },
    {
      module: 'roles',
      name: 'reorderRolesAction',
      invoke: () => reorderRolesAction(dummyIds),
    },
    // 7. Engineering Nodes (4)
    {
      module: 'engineering-nodes',
      name: 'createEngineeringNodeAction',
      invoke: () => createEngineeringNodeAction({ success: false }, dummyForm),
    },
    {
      module: 'engineering-nodes',
      name: 'updateEngineeringNodeAction',
      invoke: () => updateEngineeringNodeAction(dummyId, { success: false }, dummyForm),
    },
    {
      module: 'engineering-nodes',
      name: 'deleteEngineeringNodeAction',
      invoke: () => deleteEngineeringNodeAction(dummyId),
    },
    {
      module: 'engineering-nodes',
      name: 'reorderEngineeringNodesAction',
      invoke: () => reorderEngineeringNodesAction(dummyIds),
    },
    // 8. Domains (4)
    {
      module: 'domains',
      name: 'createDomainAction',
      invoke: () => createDomainAction({ success: false }, dummyForm),
    },
    {
      module: 'domains',
      name: 'updateDomainAction',
      invoke: () => updateDomainAction(dummyId, { success: false }, dummyForm),
    },
    {
      module: 'domains',
      name: 'deleteDomainAction',
      invoke: () => deleteDomainAction(dummyId),
    },
    {
      module: 'domains',
      name: 'reorderDomainsAction',
      invoke: () => reorderDomainsAction(dummyIds),
    },
    // 9. Pillars (4)
    {
      module: 'pillars',
      name: 'createPillarAction',
      invoke: () => createPillarAction({ success: false }, dummyForm),
    },
    {
      module: 'pillars',
      name: 'updatePillarAction',
      invoke: () => updatePillarAction(dummyId, { success: false }, dummyForm),
    },
    {
      module: 'pillars',
      name: 'deletePillarAction',
      invoke: () => deletePillarAction(dummyId),
    },
    {
      module: 'pillars',
      name: 'reorderPillarsAction',
      invoke: () => reorderPillarsAction(dummyIds),
    },
    // 10. Skills & Skill Categories (8)
    {
      module: 'skills',
      name: 'createSkillCategoryAction',
      invoke: () => createSkillCategoryAction({ success: false }, dummyForm),
    },
    {
      module: 'skills',
      name: 'updateSkillCategoryAction',
      invoke: () => updateSkillCategoryAction(dummyId, { success: false }, dummyForm),
    },
    {
      module: 'skills',
      name: 'deleteSkillCategoryAction',
      invoke: () => deleteSkillCategoryAction(dummyId),
    },
    {
      module: 'skills',
      name: 'reorderSkillCategoriesAction',
      invoke: () => reorderSkillCategoriesAction(dummyIds),
    },
    {
      module: 'skills',
      name: 'createSkillAction',
      invoke: () => createSkillAction({ success: false }, dummyForm),
    },
    {
      module: 'skills',
      name: 'updateSkillAction',
      invoke: () => updateSkillAction(dummyId, { success: false }, dummyForm),
    },
    {
      module: 'skills',
      name: 'deleteSkillAction',
      invoke: () => deleteSkillAction(dummyId),
    },
    {
      module: 'skills',
      name: 'reorderSkillsAction',
      invoke: () => reorderSkillsAction(dummyId, dummyIds),
    },
    // 11. Contact Channels (4)
    {
      module: 'contact-channels',
      name: 'createContactChannelAction',
      invoke: () => createContactChannelAction({ success: false }, dummyForm),
    },
    {
      module: 'contact-channels',
      name: 'updateContactChannelAction',
      invoke: () => updateContactChannelAction(dummyId, { success: false }, dummyForm),
    },
    {
      module: 'contact-channels',
      name: 'deleteContactChannelAction',
      invoke: () => deleteContactChannelAction(dummyId),
    },
    {
      module: 'contact-channels',
      name: 'reorderContactChannelsAction',
      invoke: () => reorderContactChannelsAction(dummyIds),
    },
    // 12. Account Settings (2)
    {
      module: 'account',
      name: 'updateAdminProfileAction',
      invoke: () => updateAdminProfileAction({ success: false }, dummyForm),
    },
    {
      module: 'account',
      name: 'changeAdminPasswordAction',
      invoke: () => changeAdminPasswordAction({ success: false }, dummyForm),
    },
  ];

  const modules = new Set<string>();
  for (const check of actionChecks) {
    modules.add(check.module);
    const res = await runInActionContext(null, check.invoke);
    assert.strictEqual(
      res.success,
      false,
      `${check.module}/${check.name} must reject unauthenticated call`
    );
    assert.strictEqual(
      res.error,
      'Unauthorized. Session is invalid or expired.',
      `${check.module}/${check.name} must fail with UnauthorizedException message`
    );
  }

  return {
    totalModules: modules.size,
    totalActions: actionChecks.length,
  };
}

/**
 * Suite 4: Hero Profile Mutation via Server Action (Guaranteed Baseline Restoration)
 */
export async function testSuiteHeroMutation(
  prisma: PrismaClient,
  token: string
): Promise<void> {
  const snapshot = await takeBaselineSingletonsSnapshot(prisma);

  let suiteError: Error | null = null;
  let restorationError: Error | null = null;

  try {
    const testName = 'Agun Firmansyah (E2E Test Verified)';
    const formData = new FormData();
    formData.append('name', testName);
    formData.append('tagline', snapshot.hero.tagline);
    formData.append('bio', snapshot.hero.bio);
    formData.append('country', snapshot.hero.country);
    formData.append('code', snapshot.hero.code);
    formData.append('timezone', snapshot.hero.timezone);
    formData.append('discipline', snapshot.hero.discipline);

    const actionRes = await runInActionContext(token, async () => {
      return updateHeroProfileAction({ success: false }, formData);
    });

    assert.strictEqual(actionRes.success, true, 'Authenticated updateHeroProfileAction must succeed');

    const persisted = await prisma.heroProfile.findUnique({ where: { id: 'singleton' } });
    assert.strictEqual(persisted?.name, testName, 'HeroProfile mutation must be persisted in database');
  } catch (err: unknown) {
    suiteError = err instanceof Error ? err : new Error(String(err));
  } finally {
    try {
      // Guaranteed baseline restoration
      await restoreBaselineSingletons(prisma, snapshot);
    } catch (err: unknown) {
      restorationError = err instanceof Error ? err : new Error(String(err));
    }

    handleCollectedErrors([suiteError, restorationError], 'Hero mutation suite');
  }
}

/**
 * Suite 5: About Profile Mutation via Server Action (Guaranteed Baseline Restoration)
 */
export async function testSuiteAboutMutation(
  prisma: PrismaClient,
  token: string
): Promise<void> {
  const snapshot = await takeBaselineSingletonsSnapshot(prisma);

  let suiteError: Error | null = null;
  let restorationError: Error | null = null;

  try {
    const testHeading = 'Engineering Excellence (E2E Test Verified)';
    const formData = new FormData();
    formData.append('heading', testHeading);
    formData.append('quote', snapshot.about.quote);
    formData.append('primaryNarrative', snapshot.about.primaryNarrative);
    formData.append('secondaryNarrative', snapshot.about.secondaryNarrative);

    const actionRes = await runInActionContext(token, async () => {
      return updateAboutProfileAction({ success: false }, formData);
    });

    assert.strictEqual(actionRes.success, true, 'Authenticated updateAboutProfileAction must succeed');

    const persisted = await prisma.aboutProfile.findUnique({ where: { id: 'singleton' } });
    assert.strictEqual(persisted?.heading, testHeading, 'AboutProfile mutation must be persisted in database');
  } catch (err: unknown) {
    suiteError = err instanceof Error ? err : new Error(String(err));
  } finally {
    try {
      // Guaranteed baseline restoration
      await restoreBaselineSingletons(prisma, snapshot);
    } catch (err: unknown) {
      restorationError = err instanceof Error ? err : new Error(String(err));
    }

    handleCollectedErrors([suiteError, restorationError], 'About mutation suite');
  }
}

/**
 * Suite 6: Contact Profile Mutation via Server Action (Guaranteed Baseline Restoration)
 */
export async function testSuiteContactMutation(
  prisma: PrismaClient,
  token: string
): Promise<void> {
  const snapshot = await takeBaselineSingletonsSnapshot(prisma);

  let suiteError: Error | null = null;
  let restorationError: Error | null = null;

  try {
    const testHeading = 'Connect & Collaborate (E2E Test Verified)';
    const formData = new FormData();
    formData.append('heading', testHeading);
    formData.append('ctaLabel', snapshot.contact.ctaLabel);
    formData.append('description', snapshot.contact.description);

    const actionRes = await runInActionContext(token, async () => {
      return updateContactProfileAction({ success: false }, formData);
    });

    assert.strictEqual(actionRes.success, true, 'Authenticated updateContactProfileAction must succeed');

    const persisted = await prisma.contactProfile.findUnique({ where: { id: 'singleton' } });
    assert.strictEqual(persisted?.heading, testHeading, 'ContactProfile mutation must be persisted in database');
  } catch (err: unknown) {
    suiteError = err instanceof Error ? err : new Error(String(err));
  } finally {
    try {
      // Guaranteed baseline restoration
      await restoreBaselineSingletons(prisma, snapshot);
    } catch (err: unknown) {
      restorationError = err instanceof Error ? err : new Error(String(err));
    }

    handleCollectedErrors([suiteError, restorationError], 'Contact mutation suite');
  }
}

/**
 * Suite 7: Project CRUD & Reorder via Server Actions (Tracked IDs & Ordering Restoration)
 */
export async function testSuiteProjectCrudAndReorder(
  prisma: PrismaClient,
  token: string
): Promise<void> {
  const orderSnapshot = await takeBaselineOrderSnapshot(prisma);
  const trackedProjectIds: string[] = [];

  let suiteError: Error | null = null;
  let cleanupError: Error | null = null;
  let restorationError: Error | null = null;

  try {
    // 1. Create Project via Server Action
    const createForm = new FormData();
    createForm.append('title', 'E2E_TEST_Project_Alpha');
    createForm.append('category', 'Backend');
    createForm.append('description', 'High performance backend service for E2E verification.');
    createForm.append('technologies', 'TypeScript, Node.js, PostgreSQL');
    createForm.append('published', 'true');

    const createRes = await runInActionContext(token, async () => {
      return createProjectAction({ success: false }, createForm);
    });

    assert.strictEqual(createRes.success, true, 'createProjectAction must succeed');
    assert(createRes.id !== undefined, 'Created project ID must be returned');
    const createdId = createRes.id as string;
    trackedProjectIds.push(createdId);

    // Verify in database
    const createdProject = await prisma.project.findUnique({ where: { id: createdId } });
    assert.strictEqual(createdProject?.title, 'E2E_TEST_Project_Alpha');

    // 2. Update Project via Server Action
    const updateForm = new FormData();
    updateForm.append('title', 'E2E_TEST_Project_Alpha_Updated');
    updateForm.append('category', 'Cloud Architecture');
    updateForm.append('description', 'Updated backend service for E2E verification.');
    updateForm.append('technologies', 'TypeScript, Go, Docker');
    updateForm.append('published', 'true');

    const updateRes = await runInActionContext(token, async () => {
      return updateProjectAction(createdId, { success: false }, updateForm);
    });
    assert.strictEqual(updateRes.success, true, 'updateProjectAction must succeed');

    const updatedProject = await prisma.project.findUnique({ where: { id: createdId } });
    assert.strictEqual(updatedProject?.title, 'E2E_TEST_Project_Alpha_Updated');

    // 3. Reorder Projects via Server Action
    const allProjects = await prisma.project.findMany({ orderBy: { order: 'asc' } });
    const reversedIds = allProjects.map((p) => p.id).reverse();

    const reorderRes = await runInActionContext(token, async () => {
      return reorderProjectsAction(reversedIds);
    });
    assert.strictEqual(reorderRes.success, true, 'reorderProjectsAction must succeed');

    // 4. Delete Project via Server Action
    const deleteRes = await runInActionContext(token, async () => {
      return deleteProjectAction(createdId);
    });
    assert.strictEqual(deleteRes.success, true, 'deleteProjectAction must succeed');

    const deletedCheck = await prisma.project.findUnique({ where: { id: createdId } });
    assert.strictEqual(deletedCheck, null, 'Deleted project must not exist in database');

    // Remove from tracking as it was successfully deleted
    const idx = trackedProjectIds.indexOf(createdId);
    if (idx > -1) trackedProjectIds.splice(idx, 1);
  } catch (err: unknown) {
    suiteError = err instanceof Error ? err : new Error(String(err));
  } finally {
    // 1. Guaranteed cleanup of any residual tracked IDs (independent try/catch)
    try {
      await cleanupTestData(prisma, { projectIds: trackedProjectIds });
    } catch (err: unknown) {
      cleanupError = err instanceof Error ? err : new Error(String(err));
    }

    // 2. Guaranteed restoration of baseline order (independent try/catch)
    try {
      await restoreBaselineOrder(prisma, orderSnapshot);
    } catch (err: unknown) {
      restorationError = err instanceof Error ? err : new Error(String(err));
    }

    // 3. Propagate without masking
    handleCollectedErrors(
      [suiteError, cleanupError, restorationError],
      'Project CRUD & reorder suite'
    );
  }
}

/**
 * Suite 8: Experience CRUD & Reorder via Server Actions (Tracked IDs & Ordering Restoration)
 */
export async function testSuiteExperienceCrudAndReorder(
  prisma: PrismaClient,
  token: string
): Promise<void> {
  const orderSnapshot = await takeBaselineOrderSnapshot(prisma);
  const trackedExperienceIds: string[] = [];

  let suiteError: Error | null = null;
  let cleanupError: Error | null = null;
  let restorationError: Error | null = null;

  try {
    // 1. Create Experience via Server Action
    const createForm = new FormData();
    createForm.append('role', 'E2E_TEST_Senior_Architect');
    createForm.append('institution', 'Tech Institute E2E');
    createForm.append('track', 'Software Engineering');
    createForm.append('description', 'Leading distributed systems architecture.');
    createForm.append('startDate', '2024-01-01');
    createForm.append('isOngoing', 'true');

    const createRes = await runInActionContext(token, async () => {
      return createExperienceAction({ success: false }, createForm);
    });

    assert.strictEqual(createRes.success, true, 'createExperienceAction must succeed');
    assert(createRes.id !== undefined, 'Created experience ID must be returned');
    const createdId = createRes.id as string;
    trackedExperienceIds.push(createdId);

    // Verify in database
    const createdExp = await prisma.experience.findUnique({ where: { id: createdId } });
    assert.strictEqual(createdExp?.role, 'E2E_TEST_Senior_Architect');

    // 2. Update Experience via Server Action
    const updateForm = new FormData();
    updateForm.append('role', 'E2E_TEST_Principal_Architect');
    updateForm.append('institution', 'Tech Institute E2E Global');
    updateForm.append('track', 'Cloud Systems');
    updateForm.append('description', 'Updated leading distributed systems architecture.');
    updateForm.append('startDate', '2024-01-01');
    updateForm.append('isOngoing', 'true');

    const updateRes = await runInActionContext(token, async () => {
      return updateExperienceAction(createdId, { success: false }, updateForm);
    });
    assert.strictEqual(updateRes.success, true, 'updateExperienceAction must succeed');

    const updatedExp = await prisma.experience.findUnique({ where: { id: createdId } });
    assert.strictEqual(updatedExp?.role, 'E2E_TEST_Principal_Architect');

    // 3. Reorder Experiences via Server Action
    const allExperiences = await prisma.experience.findMany({ orderBy: { order: 'asc' } });
    const reversedIds = allExperiences.map((e) => e.id).reverse();

    const reorderRes = await runInActionContext(token, async () => {
      return reorderExperiencesAction(reversedIds);
    });
    assert.strictEqual(reorderRes.success, true, 'reorderExperiencesAction must succeed');

    // 4. Delete Experience via Server Action
    const deleteRes = await runInActionContext(token, async () => {
      return deleteExperienceAction(createdId);
    });
    assert.strictEqual(deleteRes.success, true, 'deleteExperienceAction must succeed');

    const deletedCheck = await prisma.experience.findUnique({ where: { id: createdId } });
    assert.strictEqual(deletedCheck, null, 'Deleted experience must not exist in database');

    const idx = trackedExperienceIds.indexOf(createdId);
    if (idx > -1) trackedExperienceIds.splice(idx, 1);
  } catch (err: unknown) {
    suiteError = err instanceof Error ? err : new Error(String(err));
  } finally {
    // 1. Guaranteed cleanup of any residual tracked IDs (independent try/catch)
    try {
      await cleanupTestData(prisma, { experienceIds: trackedExperienceIds });
    } catch (err: unknown) {
      cleanupError = err instanceof Error ? err : new Error(String(err));
    }

    // 2. Guaranteed restoration of baseline order (independent try/catch)
    try {
      await restoreBaselineOrder(prisma, orderSnapshot);
    } catch (err: unknown) {
      restorationError = err instanceof Error ? err : new Error(String(err));
    }

    // 3. Propagate without masking
    handleCollectedErrors(
      [suiteError, cleanupError, restorationError],
      'Experience CRUD & reorder suite'
    );
  }
}

/**
 * Suite 9: ContactChannel CRUD & Reorder via Server Actions (Tracked IDs & Ordering Restoration)
 */
export async function testSuiteContactChannelCrudAndReorder(
  prisma: PrismaClient,
  token: string
): Promise<void> {
  const orderSnapshot = await takeBaselineOrderSnapshot(prisma);
  const trackedContactChannelIds: string[] = [];

  let suiteError: Error | null = null;
  let cleanupError: Error | null = null;
  let restorationError: Error | null = null;

  try {
    // 1. Create ContactChannel via Server Action
    const createForm = new FormData();
    createForm.append('label', 'E2E_TEST_Discord');
    createForm.append('value', 'https://discord.gg/e2e-test');

    const createRes = await runInActionContext(token, async () => {
      return createContactChannelAction({ success: false }, createForm);
    });

    assert.strictEqual(createRes.success, true, 'createContactChannelAction must succeed');
    assert(createRes.id !== undefined, 'Created contact channel ID must be returned');
    const createdId = createRes.id as string;
    trackedContactChannelIds.push(createdId);

    // Verify in database
    const createdChannel = await prisma.contactChannel.findUnique({ where: { id: createdId } });
    assert.strictEqual(createdChannel?.label, 'E2E_TEST_Discord');
    assert.strictEqual(createdChannel?.value, 'https://discord.gg/e2e-test');

    // 2. Update ContactChannel via Server Action
    const updateForm = new FormData();
    updateForm.append('label', 'E2E_TEST_Discord_Updated');
    updateForm.append('value', 'https://discord.gg/e2e-test-updated');

    const updateRes = await runInActionContext(token, async () => {
      return updateContactChannelAction(createdId, { success: false }, updateForm);
    });
    assert.strictEqual(updateRes.success, true, 'updateContactChannelAction must succeed');

    const updatedChannel = await prisma.contactChannel.findUnique({ where: { id: createdId } });
    assert.strictEqual(updatedChannel?.label, 'E2E_TEST_Discord_Updated');
    assert.strictEqual(updatedChannel?.value, 'https://discord.gg/e2e-test-updated');

    // 3. Reorder ContactChannels via Server Action
    const allChannels = await prisma.contactChannel.findMany({ orderBy: { order: 'asc' } });
    const reversedIds = allChannels.map((c) => c.id).reverse();

    const reorderRes = await runInActionContext(token, async () => {
      return reorderContactChannelsAction(reversedIds);
    });
    assert.strictEqual(reorderRes.success, true, 'reorderContactChannelsAction must succeed');

    // 4. Delete ContactChannel via Server Action
    const deleteRes = await runInActionContext(token, async () => {
      return deleteContactChannelAction(createdId);
    });
    assert.strictEqual(deleteRes.success, true, 'deleteContactChannelAction must succeed');

    const deletedCheck = await prisma.contactChannel.findUnique({ where: { id: createdId } });
    assert.strictEqual(deletedCheck, null, 'Deleted contact channel must not exist in database');

    const idx = trackedContactChannelIds.indexOf(createdId);
    if (idx > -1) trackedContactChannelIds.splice(idx, 1);
  } catch (err: unknown) {
    suiteError = err instanceof Error ? err : new Error(String(err));
  } finally {
    // 1. Guaranteed cleanup of any residual tracked IDs (independent try/catch)
    try {
      await cleanupTestData(prisma, { contactChannelIds: trackedContactChannelIds });
    } catch (err: unknown) {
      cleanupError = err instanceof Error ? err : new Error(String(err));
    }

    // 2. Guaranteed restoration of baseline order (independent try/catch)
    try {
      await restoreBaselineOrder(prisma, orderSnapshot);
    } catch (err: unknown) {
      restorationError = err instanceof Error ? err : new Error(String(err));
    }

    // 3. Propagate without masking
    handleCollectedErrors(
      [suiteError, cleanupError, restorationError],
      'ContactChannel CRUD & reorder suite'
    );
  }
}
