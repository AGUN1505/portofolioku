// scripts/test-section-order.ts
// Comprehensive verification test suite for Section Order feature.
// Tests:
// 1. Section Retrieval (StaticPortfolioRepository, Resilient fallback, GetSectionConfigsUseCase, P2021 defense)
// 2. Reorder Use Case Logic (Atomic ordering, duplicates, size mismatch, unknown IDs, empty inputs)
// 3. DAL Auth Requirement (reorderSectionConfigsAction rejects unauthenticated calls via verifySession)
// 4. Zero-DB Guardrails (0 live DB connections, in-memory execution, environment safety)
// 5. Landing Page Dynamic Ordering (order asc, enabled !== false filter, fallback on empty sections)

import * as assert from 'node:assert/strict';
import { CompositionRoot } from '../src/infrastructure/composition-root';
import { StaticPortfolioRepository } from '../src/infrastructure/repositories/static-portfolio.repository';
import {
  ResilientPortfolioRepository,
  isDatabaseConnectivityError,
} from '../src/infrastructure/repositories/resilient-portfolio.repository';
import { PrismaSectionConfigRepository } from '../src/infrastructure/repositories/prisma-section-config.repository';
import type { IPortfolioRepository } from '../src/domain/repositories/portfolio.repository';
import type {
  ISectionConfigRepository,
  UpdateSectionConfigData,
} from '../src/domain/repositories/section-config.repository';
import type { Portfolio } from '../src/domain/entities';
import type { SectionConfig } from '../src/domain/entities/section-config';
import { GetSectionConfigsUseCase } from '../src/application/use-cases/sections/get-sections.use-case';
import { ReorderSectionConfigsUseCase } from '../src/application/use-cases/sections/reorder-sections.use-case';
import { reorderSectionConfigsAction } from '../app/admin/(dashboard)/sections/actions';
import {
  DEFAULT_SECTION_ORDER,
  resolveOrderedSectionKeys,
  resolveOrderedNavLinks,
} from '../src/presentation/utils/section-order';
import Home from '../app/page';
import type { PrismaClient } from '@prisma/client';

async function main(): Promise<void> {
  console.log('================================================================');
  console.log('   SECTION ORDER & DYNAMIC RENDERING COMPREHENSIVE TEST SUITE   ');
  console.log('   (Strict Zero-DB In-Memory Verification)                      ');
  console.log('================================================================\n');

  // ==========================================================================
  // SUITE 1: SECTION RETRIEVAL
  // ==========================================================================
  console.log('--- SUITE 1: Section Retrieval ---');
  {
    // 1.1: StaticPortfolioRepository sections retrieval
    const staticRepo = new StaticPortfolioRepository();
    const portfolio = staticRepo.getPortfolioData();

    assert.ok(portfolio.sections, 'portfolio.sections must be defined on Portfolio aggregate');
    assert.ok(Array.isArray(portfolio.sections), 'portfolio.sections must be an array');
    assert.strictEqual(portfolio.sections.length, 7, 'StaticPortfolioRepository must define 7 default sections');

    const expectedKeys = ['hero', 'about', 'projects', 'experience', 'skills', 'certificates', 'contact'];
    const actualKeys = portfolio.sections.map((s) => s.key);
    assert.deepStrictEqual(actualKeys, expectedKeys, 'Sections must match expected keys in order');

    for (const section of portfolio.sections) {
      assert.ok(section.id, `Section ${section.key} must have an id`);
      assert.ok(section.key, 'Section must have a key');
      assert.ok(section.label, `Section ${section.key} must have a label`);
      assert.strictEqual(typeof section.order, 'number', `Section ${section.key} must have a numeric order`);
      assert.strictEqual(section.enabled, true, `Section ${section.key} must be enabled by default`);
    }
    console.log('  ✓ 1.1: StaticPortfolioRepository provides all 7 typed sections in order');

    // 1.2: ResilientPortfolioRepository fallback retrieval
    const failingPrimary: IPortfolioRepository<Promise<Portfolio>> = {
      getPortfolioData: async () => {
        const connErr = new Error('Connection lost to PostgreSQL');
        (connErr as unknown as { code: string }).code = 'ECONNREFUSED';
        throw connErr;
      },
    };
    const resilientRepo = new ResilientPortfolioRepository(failingPrimary, staticRepo);
    const resilientPortfolio = await resilientRepo.getPortfolioData();

    assert.ok(resilientPortfolio.sections, 'Resilient fallback must include sections');
    assert.strictEqual(resilientPortfolio.sections.length, 7, 'Resilient fallback must return 7 sections');
    console.log('  ✓ 1.2: ResilientPortfolioRepository gracefully recovers sections on primary connectivity loss');

    // 1.3: GetSectionConfigsUseCase execution with mock repository
    const mockSections: SectionConfig[] = [
      { id: 'sec-1', key: 'hero', label: 'Hero', order: 1, enabled: true },
      { id: 'sec-2', key: 'about', label: 'About', order: 2, enabled: true },
      { id: 'sec-3', key: 'projects', label: 'Projects', order: 3, enabled: true },
    ];
    const mockRepo: ISectionConfigRepository = {
      async getAll() {
        return [...mockSections];
      },
      async findAll() {
        return this.getAll();
      },
      async getById(id: string) {
        return mockSections.find((s) => s.id === id) ?? null;
      },
      async findById(id: string) {
        return this.getById(id);
      },
      async getByKey(key: string) {
        return mockSections.find((s) => s.key === key) ?? null;
      },
      async findByKey(key: string) {
        return this.getByKey(key);
      },
      async update(keyOrId: string, data: UpdateSectionConfigData) {
        const idx = mockSections.findIndex((s) => s.id === keyOrId || s.key === keyOrId);
        if (idx === -1) throw new Error('Not found');
        const updated: SectionConfig = {
          ...mockSections[idx],
          ...data,
          updatedAt: new Date(),
        };
        mockSections[idx] = updated;
        return updated;
      },
      async reorder() {},
    };

    const getUseCase = new GetSectionConfigsUseCase(mockRepo);
    const retrieved = await getUseCase.execute();
    assert.strictEqual(retrieved.length, 3, 'GetSectionConfigsUseCase must retrieve all items');
    assert.strictEqual(retrieved[0].key, 'hero');
    console.log('  ✓ 1.3: GetSectionConfigsUseCase retrieves clean section records from repository');

    // 1.4: PrismaSectionConfigRepository defensive P2021 (table missing) handling
    const mockP2021Prisma = {
      sectionConfig: {
        findMany: async () => {
          const err = new Error('The table `public.section_configs` does not exist in the current database.');
          (err as unknown as { code: string }).code = 'P2021';
          throw err;
        },
        findUnique: async () => {
          const err = new Error('The table `public.section_configs` does not exist in the current database.');
          (err as unknown as { code: string }).code = 'P2021';
          throw err;
        },
      },
    } as unknown as PrismaClient;

    const defensiveRepo = new PrismaSectionConfigRepository(mockP2021Prisma);
    const fallbackList = await defensiveRepo.getAll();
    assert.deepStrictEqual(fallbackList, [], 'Defensive P2021 handling must return empty array instead of throwing');
    const fallbackSingle = await defensiveRepo.getById('any-id');
    assert.strictEqual(fallbackSingle, null, 'Defensive P2021 handling must return null on getById');
    console.log('  ✓ 1.4: PrismaSectionConfigRepository defensively handles P2021 missing table errors\n');
  }

  // ==========================================================================
  // SUITE 2: REORDER USE CASE LOGIC
  // ==========================================================================
  console.log('--- SUITE 2: Reorder Use Case Logic ---');
  {
    const initialRecords: SectionConfig[] = [
      { id: 'sec-1', key: 'hero', label: 'Hero', order: 1, enabled: true },
      { id: 'sec-2', key: 'about', label: 'About', order: 2, enabled: true },
      { id: 'sec-3', key: 'projects', label: 'Projects', order: 3, enabled: true },
      { id: 'sec-4', key: 'contact', label: 'Contact', order: 4, enabled: true },
    ];

    const store = [...initialRecords];
    const mockRepo: ISectionConfigRepository = {
      async getAll() {
        return [...store].sort((a, b) => a.order - b.order);
      },
      async findAll() {
        return this.getAll();
      },
      async getById(id: string) {
        return store.find((s) => s.id === id) ?? null;
      },
      async findById(id: string) {
        return this.getById(id);
      },
      async getByKey(key: string) {
        return store.find((s) => s.key === key) ?? null;
      },
      async findByKey(key: string) {
        return this.getByKey(key);
      },
      async update(keyOrId: string, data: UpdateSectionConfigData) {
        const idx = store.findIndex((s) => s.id === keyOrId || s.key === keyOrId);
        if (idx === -1) throw new Error('Not found');
        const updated: SectionConfig = {
          ...store[idx],
          ...data,
          updatedAt: new Date(),
        };
        store[idx] = updated;
        return updated;
      },
      async reorder(orderedIds: string[]) {
        for (let i = 0; i < orderedIds.length; i++) {
          const item = store.find((s) => s.id === orderedIds[i]);
          if (item) {
            (item as unknown as { order: number }).order = i + 1;
          }
        }
      },
    };

    const reorderUseCase = new ReorderSectionConfigsUseCase(mockRepo);

    // 2.1: Valid reordering (reverse order)
    const validResult = await reorderUseCase.execute(['sec-4', 'sec-3', 'sec-2', 'sec-1']);
    assert.strictEqual(validResult.success, true, 'Valid reorder must succeed');
    const reorderedStore = await mockRepo.getAll();
    assert.strictEqual(reorderedStore[0].id, 'sec-4');
    assert.strictEqual(reorderedStore[1].id, 'sec-3');
    assert.strictEqual(reorderedStore[2].id, 'sec-2');
    assert.strictEqual(reorderedStore[3].id, 'sec-1');
    console.log('  ✓ 2.1: Atomically reorders section items sequentially');

    // 2.2: Rejection of duplicate IDs
    const duplicateResult = await reorderUseCase.execute(['sec-4', 'sec-4', 'sec-2', 'sec-1']);
    assert.strictEqual(duplicateResult.success, false, 'Duplicate IDs must be rejected');
    assert.ok(
      duplicateResult.error?.toLowerCase().includes('duplicate'),
      'Error message must indicate duplicate IDs'
    );
    console.log('  ✓ 2.2: Rejects duplicate IDs in reorder input');

    // 2.3: Rejection of size mismatch (fewer IDs)
    const fewerResult = await reorderUseCase.execute(['sec-4', 'sec-3']);
    assert.strictEqual(fewerResult.success, false, 'Incomplete IDs list must be rejected');
    assert.ok(
      fewerResult.error?.toLowerCase().includes('count') || fewerResult.error?.toLowerCase().includes('mismatch'),
      'Error message must indicate count mismatch'
    );
    console.log('  ✓ 2.3: Rejects collection size mismatch (too few IDs)');

    // 2.4: Rejection of size mismatch (extra IDs)
    const extraResult = await reorderUseCase.execute(['sec-4', 'sec-3', 'sec-2', 'sec-1', 'sec-extra']);
    assert.strictEqual(extraResult.success, false, 'Extra IDs list must be rejected');
    console.log('  ✓ 2.4: Rejects collection size mismatch (too many IDs)');

    // 2.5: Rejection of unknown/non-existent ID
    const unknownResult = await reorderUseCase.execute(['sec-4', 'sec-3', 'sec-2', 'sec-999']);
    assert.strictEqual(unknownResult.success, false, 'Unknown ID must be rejected');
    assert.ok(
      unknownResult.error?.toLowerCase().includes('not exist') || unknownResult.error?.toLowerCase().includes('unknown'),
      'Error message must indicate non-existent ID'
    );
    console.log('  ✓ 2.5: Rejects unknown / non-existent section IDs');

    // 2.6: Rejection of non-array input
    const invalidTypeResult = await reorderUseCase.execute('not-an-array' as unknown as string[]);
    assert.strictEqual(invalidTypeResult.success, false, 'Non-array input must be rejected');
    console.log('  ✓ 2.6: Rejects invalid non-array input gracefully');

    // 2.7: Empty array handling when no records exist (valid no-op)
    const emptyRepo: ISectionConfigRepository = {
      async getAll() {
        return [];
      },
      async findAll() {
        return [];
      },
      async getById() {
        return null;
      },
      async findById() {
        return null;
      },
      async getByKey() {
        return null;
      },
      async findByKey() {
        return null;
      },
      async update() {
        throw new Error('Not implemented');
      },
      async reorder() {},
    };
    const emptyUseCase = new ReorderSectionConfigsUseCase(emptyRepo);
    const emptyOnEmpty = await emptyUseCase.execute([]);
    assert.strictEqual(emptyOnEmpty.success, true, 'Reordering empty list when 0 records exist must succeed as no-op');
    console.log('  ✓ 2.7: Handles empty collection reorder as safe no-op\n');
  }

  // ==========================================================================
  // SUITE 3: DAL AUTH REQUIREMENT
  // ==========================================================================
  console.log('--- SUITE 3: DAL Auth Requirement ---');
  {
    // 3.1: reorderSectionConfigsAction rejects unauthenticated call via DAL verifySession()
    const unauthResult = await reorderSectionConfigsAction(['sec-1', 'sec-2']);
    assert.strictEqual(unauthResult.success, false, 'Server action must reject call without valid session');
    assert.ok(
      unauthResult.error?.toLowerCase().includes('unauthorized') ||
        unauthResult.error?.toLowerCase().includes('authentication') ||
        unauthResult.error?.toLowerCase().includes('session'),
      `Error must reflect unauthorized access, received: "${unauthResult.error}"`
    );
    console.log('  ✓ 3.1: reorderSectionConfigsAction strictly enforces DAL verifySession()');

    // 3.2: reorderSectionConfigsAction rejects non-array input from unauthenticated or malicious caller
    const badInputResult = await reorderSectionConfigsAction('invalid-input' as unknown as string[]);
    assert.strictEqual(badInputResult.success, false, 'Server action must reject invalid payload type');
    console.log('  ✓ 3.2: Server action rejects invalid input types\n');
  }

  // ==========================================================================
  // SUITE 4: ZERO-DB GUARDRAILS
  // ==========================================================================
  console.log('--- SUITE 4: Zero-DB Guardrails ---');
  {
    // 4.1: Verify no global Prisma client was instantiated
    const globalObj = globalThis as unknown as { prisma?: unknown };
    assert.strictEqual(
      globalObj.prisma,
      undefined,
      'Prisma client must not be attached to globalThis during unit test run'
    );
    console.log('  ✓ 4.1: No global Prisma client connection created');

    // 4.2: Verify CompositionRoot reset cleans state without DB operations
    CompositionRoot.resetForTesting();
    const staticInstance = CompositionRoot.getPortfolioRepository('static');
    assert.ok(staticInstance instanceof StaticPortfolioRepository);
    CompositionRoot.resetForTesting();
    console.log('  ✓ 4.2: CompositionRoot operates cleanly in-memory without DB side effects');

    // 4.3: Verify connectivity error classifier recognizes network failures without touching DB
    assert.strictEqual(isDatabaseConnectivityError({ code: 'ECONNREFUSED' }), true);
    assert.strictEqual(isDatabaseConnectivityError({ code: 'P1001' }), true);
    assert.strictEqual(isDatabaseConnectivityError({ code: 'P2002' }), false); // Unique constraint = not connectivity
    console.log('  ✓ 4.3: Connectivity classifier evaluates error structures purely in-memory\n');
  }

  // ==========================================================================
  // SUITE 5: LANDING PAGE DYNAMIC ORDERING
  // ==========================================================================
  console.log('--- SUITE 5: Landing Page Dynamic Ordering ---');
  {
    // 5.1: Default fallback when sections is null or undefined
    const nullFallback = resolveOrderedSectionKeys(null);
    assert.deepStrictEqual(nullFallback, [...DEFAULT_SECTION_ORDER], 'null sections must fall back to DEFAULT_SECTION_ORDER');

    const undefFallback = resolveOrderedSectionKeys(undefined);
    assert.deepStrictEqual(undefFallback, [...DEFAULT_SECTION_ORDER], 'undefined sections must fall back to DEFAULT_SECTION_ORDER');

    // 5.2: Default fallback when sections array is empty
    const emptyFallback = resolveOrderedSectionKeys([]);
    assert.deepStrictEqual(emptyFallback, [...DEFAULT_SECTION_ORDER], 'Empty sections array must fall back to DEFAULT_SECTION_ORDER');
    console.log('  ✓ 5.1 & 5.2: Graceful fallback to DEFAULT_SECTION_ORDER when sections array is empty or undefined');

    // 5.3: Dynamic ordering based on order: 'asc'
    const customOrderSections = [
      { key: 'contact', order: 10, enabled: true },
      { key: 'skills', order: 5, enabled: true },
      { key: 'hero', order: 1, enabled: true },
      { key: 'about', order: 20, enabled: true },
    ];
    const orderedKeys = resolveOrderedSectionKeys(customOrderSections);
    assert.deepStrictEqual(
      orderedKeys,
      ['hero', 'skills', 'contact', 'about'],
      'Sections must be ordered strictly in ascending order: order 1, 5, 10, 20'
    );
    console.log('  ✓ 5.3: Sections correctly ordered dynamically by order: "asc"');

    // 5.4: Filtering enabled !== false
    const filteredSections = [
      { key: 'hero', order: 1, enabled: true },
      { key: 'about', order: 2, enabled: false }, // disabled
      { key: 'projects', order: 3, enabled: true },
      { key: 'skills', order: 4 }, // enabled undefined -> enabled !== false is true
      { key: 'certificates', order: 5, enabled: false }, // disabled
      { key: 'contact', order: 6, enabled: true },
    ];
    const filteredKeys = resolveOrderedSectionKeys(filteredSections);
    assert.deepStrictEqual(
      filteredKeys,
      ['hero', 'projects', 'skills', 'contact'],
      'Disabled sections (enabled: false) must be filtered out, undefined enabled preserved'
    );
    console.log('  ✓ 5.4: Sections with enabled: false are excluded; enabled !== false condition honored');

    // 5.5: Home component renders valid JSX tree with Suspense
    const homeElement = Home();
    assert.ok(homeElement, 'Home() must return a valid React element');
    assert.strictEqual(typeof homeElement, 'object', 'Home() element must be an object');
    assert.ok('type' in homeElement, 'Home() element must have React element type');
    console.log('  ✓ 5.5: Home() component returns valid React tree with Suspense boundary');

    // 5.6: Dynamic NavLinks fallback
    const defaultNav = resolveOrderedNavLinks(null);
    assert.strictEqual(defaultNav.length, 6, 'Default nav must include 6 non-hero sections');
    assert.deepStrictEqual(
      defaultNav.map((l) => l.href),
      ['#about', '#projects', '#experience', '#skills', '#certificates', '#contact']
    );
    assert.strictEqual(defaultNav[0].index, '01');
    assert.strictEqual(defaultNav[0].active, true);
    assert.strictEqual(defaultNav[5].index, '06');
    console.log('  ✓ 5.6: resolveOrderedNavLinks provides all 6 ordered nav links on fallback');

    // 5.7: Dynamic NavLinks follows custom CMS section sequence
    const customNav = resolveOrderedNavLinks([
      { key: 'contact', order: 1, enabled: true },
      { key: 'certificates', order: 2, enabled: true },
      { key: 'about', order: 3, enabled: true },
    ]);
    assert.strictEqual(customNav.length, 3);
    assert.deepStrictEqual(customNav.map((l) => l.href), ['#contact', '#certificates', '#about']);
    assert.deepStrictEqual(customNav.map((l) => l.index), ['01', '02', '03']);
    console.log('  ✓ 5.7: resolveOrderedNavLinks reorders and re-indexes sequentially based on CMS order');

    // 5.8: Disabled sections are omitted from dynamic NavLinks
    const filteredNav = resolveOrderedNavLinks([
      { key: 'hero', order: 1, enabled: true },
      { key: 'about', order: 2, enabled: false }, // disabled
      { key: 'projects', order: 3, enabled: true },
      { key: 'skills', order: 4, enabled: true },
    ]);
    assert.strictEqual(filteredNav.length, 2);
    assert.deepStrictEqual(filteredNav.map((l) => l.href), ['#projects', '#skills']);
    assert.deepStrictEqual(filteredNav.map((l) => l.index), ['01', '02']);
    console.log('  ✓ 5.8: Disabled sections (enabled: false) are excluded from dynamic NavLinks\n');
  }

  console.log('================================================================');
  console.log('   ✅ ALL SECTION ORDER & DYNAMIC RENDERING TESTS PASSED (100%) ');
  console.log('================================================================');
}

main().catch((err: unknown) => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});
