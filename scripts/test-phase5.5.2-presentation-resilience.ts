// scripts/test-phase5.5.2-presentation-resilience.ts
// Comprehensive Automated Tests for Phase 5.5.2 Presentation & Resilience Hardening
// Tests PortfolioViewMapper safe fallbacks, SkillsSection bounds safety,
// ResilientPortfolioRepository error classification & fallback, CompositionRoot factories.

import * as assert from 'node:assert';
import { PortfolioViewMapper } from '../src/presentation/mappers/portfolio-view-mapper';
import {
  ResilientPortfolioRepository,
  isDatabaseConnectivityError,
} from '../src/infrastructure/repositories/resilient-portfolio.repository';
import { CompositionRoot } from '../src/infrastructure/composition-root';
import { StaticPortfolioRepository } from '../src/infrastructure/repositories/static-portfolio.repository';
import { PrismaPortfolioRepository } from '../src/infrastructure/repositories/prisma-portfolio.repository';
import type { IPortfolioRepository } from '../src/domain/repositories/portfolio.repository';
import type { Portfolio, Project, Experience, ContactProfile } from '../src/domain/entities';

async function runTests() {
  console.log('--- RUNNING PHASE 5.5.2 AUTOMATED TEST SUITE ---');
  let passedTests = 0;

  // ==========================================
  // SUITE 1: PortfolioViewMapper Projects Fallback
  // ==========================================
  console.log('\n[Suite 1] PortfolioViewMapper — Projects Safe Fallbacks');

  // Test 1.1: Known Project ID preserves existing configuration
  {
    const knownProject: Project = {
      id: '01',
      title: 'Water Reminder App',
      category: 'Mobile Application',
      description: 'Flutter-based water hydration tracking application.',
      technologies: ['Flutter', 'Dart', 'Hive'],
      thumbnailUrl: null,
      projectUrl: null,
      githubUrl: null,
      published: true,
      publishedAt: new Date('2024-01-01'),
      order: 1,
    };

    const vm = PortfolioViewMapper.toProjectViewModel(knownProject);
    assert.equal(vm.id, '01');
    assert.equal(vm.desktopTitleSize, 'text-[32px] leading-[39px]');
    assert.equal(vm.mobileTitleSize, 'text-[22px] leading-[27px]');
    assert.equal(vm.tags.length, 3);
    assert.equal(vm.tags[0].label, 'FLUTTER');
    assert.equal(vm.tags[0].widthClass, 'w-[92px]');
    passedTests++;
    console.log('  ✓ 1.1: Known Project ID (01) preserves presentation configuration');
  }

  // Test 1.2: Unknown Project ID does not throw and applies deterministic fallback
  {
  const unknownProject: Project = {
    id: 'clx_project_custom_99',
    title: 'Distributed Event Bus',
    category: 'Cloud Infrastructure',
    description: 'High throughput streaming event bus.',
    technologies: ['Go', 'Kafka', 'gRPC'],
    thumbnailUrl: 'https://example.com/thumb.png',
    projectUrl: 'https://example.com/demo',
    githubUrl: 'https://github.com/example/bus',
    published: true,
    publishedAt: new Date('2026-05-01'),
    order: 99,
  };

  const vm = PortfolioViewMapper.toProjectViewModel(unknownProject);
  assert.equal(vm.id, 'clx_project_custom_99');
  assert.equal(vm.title, 'Distributed Event Bus');
  assert.equal(vm.desktopCategory, '// CLOUD INFRASTRUCTURE');
  assert.equal(vm.desktopTitleSize, 'text-[32px] leading-[39px]');
  assert.equal(vm.mobileTitleSize, 'text-[22px] leading-[27px]');
  assert.equal(vm.tags.length, 3);
  assert.equal(vm.tags[0].label, 'GO');
  assert.equal(vm.tags[0].widthClass, 'w-[100px]');
  assert.equal(vm.tags[0].accent, false);
  assert.ok(vm.previewHeaderLeft.includes('PRJ-clx_project_custom_99'));
  passedTests++;
  console.log('  ✓ 1.2: Unknown Project ID uses safe fallback without throwing');
  }

  // Test 1.3: Project with empty technologies array
  {
    const emptyTechProject: Project = {
      id: 'proj_no_tech',
      title: 'Concept Whitepaper',
      category: 'Research',
      description: 'Architectural specification document.',
      technologies: [],
      thumbnailUrl: null,
      projectUrl: null,
      githubUrl: null,
      published: true,
      publishedAt: null,
      order: 4,
    };

    const vm = PortfolioViewMapper.toProjectViewModel(emptyTechProject);
    assert.equal(vm.tags.length, 0);
    assert.equal(vm.tabletTag, 'proj_no_tech // RESEARCH');
    assert.equal(vm.mobileTag, 'proj_no_tech');
    passedTests++;
    console.log('  ✓ 1.3: Project with empty technologies handles tags gracefully');
  }

  // ==========================================
  // SUITE 2: PortfolioViewMapper Experiences Fallback
  // ==========================================
  console.log('\n[Suite 2] PortfolioViewMapper — Experiences Safe Fallbacks');

  // Test 2.1: Known Experience ID preserves configuration
  {
    const knownExp: Experience = {
      id: '01',
      role: 'Programming Instructor',
      institution: 'SMK Negeri 2 Kota Jambi',
      track: 'Vocational Engineering Education',
      startDate: new Date('2023-01-01'),
      endDate: null,
      order: 1,
    };

    const vm = PortfolioViewMapper.toExperienceViewModel(knownExp);
    assert.equal(vm.id, '01');
    assert.equal(vm.role, 'Programming Instructor');
    assert.equal(vm.institution, 'SMK Negeri 2 Kota Jambi');
    assert.equal(vm.accentRule, true); // ID 01 has accentRule: true
    assert.equal(vm.widthClass, 'w-[195px]');
    assert.equal(vm.ruleWidthClass, 'w-[280px]');
    passedTests++;
    console.log('  ✓ 2.1: Known Experience ID (01) preserves configuration');
  }

  // Test 2.2: Unknown Experience ID uses safe fallback and preserves ongoing state
  {
  const unknownOngoingExp: Experience = {
    id: 'clx_exp_cloud_99',
    role: 'Principal Systems Architect',
    institution: 'Global Tech Institute',
    track: 'Cloud Native & Distributed Systems',
    startDate: new Date('2025-06-01'),
    endDate: null, // Ongoing
    order: 99,
  };

  const vm = PortfolioViewMapper.toExperienceViewModel(unknownOngoingExp);
  assert.equal(vm.id, 'clx_exp_cloud_99');
  assert.equal(vm.role, 'Principal Systems Architect');
  assert.equal(vm.institution, 'Global Tech Institute');
  assert.equal(vm.track, 'Cloud Native & Distributed Systems');
  assert.equal(vm.widthClass, 'w-[220px]');
  assert.equal(vm.ruleWidthClass, 'w-[260px]');
  assert.equal(vm.accentRule, false);
  assert.equal(vm.mobileInstitution, 'Global Tech Institute');
  passedTests++;
  console.log('  ✓ 2.2: Unknown ongoing Experience uses safe deterministic defaults');
  }

  // Test 2.3: Ended Experience retains ended state
  {
    const endedExp: Experience = {
      id: 'exp_ended_prior',
      role: 'Data Entry Specialist',
      institution: 'PT Angkasa Pura 2',
      track: 'Operational Data Systems',
      startDate: new Date('2021-01-01'),
      endDate: new Date('2022-01-01'), // Ended
      order: 10,
    };

    const vm = PortfolioViewMapper.toExperienceViewModel(endedExp);
    assert.equal(vm.id, 'exp_ended_prior');
    assert.equal(vm.institution, 'PT Angkasa Pura 2');
    passedTests++;
    console.log('  ✓ 2.3: Ended Experience retains historical data correctly');
  }

  // ==========================================
  // SUITE 3: PortfolioViewMapper Contact Channels Fallback
  // ==========================================
  console.log('\n[Suite 3] PortfolioViewMapper — Contact Channels Safe Fallbacks');

  // Test 3.1: Known Contact Channel index (0) preserves configuration
  {
    const knownChannel: ContactProfile['channels'][number] = {
      label: 'EMAIL',
      value: 'contact@example.com',
    };

    const vm = PortfolioViewMapper.toContactChannelViewModel(knownChannel, 0);
    assert.equal(vm.label, 'EMAIL');
    assert.equal(vm.value, 'contact@example.com');
    assert.equal(vm.index, '01');
    assert.equal(vm.desktopWidth, 'w-[580px]');
    assert.equal(vm.tabletWidth, 'w-[688px]');
    assert.equal(vm.mobileHeight, 'min-h-[68px]');
    passedTests++;
    console.log('  ✓ 3.1: Known Contact Channel index (0) preserves configuration');
  }

  // Test 3.2: Unknown Contact Channel index (index 5) uses deterministic fallback
  {
    const extraChannel: ContactProfile['channels'][number] = {
      label: 'MATRIX',
      value: '@agun:matrix.org',
    };

    const vm = PortfolioViewMapper.toContactChannelViewModel(extraChannel, 5);
    assert.equal(vm.label, 'MATRIX');
    assert.equal(vm.value, '@agun:matrix.org');
    assert.equal(vm.index, '06');
    assert.equal(vm.desktopWidth, 'w-[580px]');
    assert.equal(vm.tabletWidth, 'w-[688px]');
    assert.equal(vm.mobileHeight, 'min-h-[68px]');
    passedTests++;
    console.log('  ✓ 3.2: Unknown Contact Channel index (5 -> 06) formats deterministically');
  }

  // Test 3.3: Empty Contact Channels collection
  {
    const emptyChannels: ContactProfile['channels'] = [];
    const mapped = emptyChannels.map(PortfolioViewMapper.toContactChannelViewModel);
    assert.equal(mapped.length, 0);
    passedTests++;
    console.log('  ✓ 3.3: Empty Contact Channels collection maps to empty array');
  }

  // ==========================================
  // SUITE 4: Database Connectivity Error Classifier
  // ==========================================
  console.log('\n[Suite 4] isDatabaseConnectivityError Classifier');

  // Test 4.1: Socket / Network codes return true
  {
    assert.equal(isDatabaseConnectivityError({ code: 'ECONNREFUSED' }), true);
    assert.equal(isDatabaseConnectivityError({ code: 'ETIMEDOUT' }), true);
    assert.equal(isDatabaseConnectivityError({ code: 'ENOTFOUND' }), true);
    assert.equal(isDatabaseConnectivityError({ code: 'ECONNRESET' }), true);
    passedTests++;
    console.log('  ✓ 4.1: OS network socket codes classified as connectivity errors');
  }

  // Test 4.2: Prisma connectivity codes return true
  {
    assert.equal(isDatabaseConnectivityError({ code: 'P1001' }), true);
    assert.equal(isDatabaseConnectivityError({ code: 'P1002' }), true);
    assert.equal(isDatabaseConnectivityError({ code: 'P1017' }), true);
    assert.equal(
      isDatabaseConnectivityError({
        name: 'PrismaClientInitializationError',
        errorCode: 'P1001',
      }),
      true
    );
    passedTests++;
    console.log('  ✓ 4.2: Prisma P1001/P1002/P1017 classified as connectivity');
  }

  // Test 4.2b: Configuration errors return false (fail closed)
  {
    assert.equal(isDatabaseConnectivityError({ code: 'P1000' }), false);
    assert.equal(isDatabaseConnectivityError({ code: 'P1003' }), false);
    assert.equal(isDatabaseConnectivityError({ name: 'PrismaClientInitializationError' }), false);
    passedTests++;
    console.log('  ✓ 4.2b: Configuration errors (P1000, P1003) and unclassified init errors return false');
  }

  // Test 4.3: Wrapped cause inspection
  {
    const wrappedError = new Error('Database query failed in PrismaPortfolioRepository: Can\'t reach database server');
    (wrappedError as { cause?: unknown }).cause = { code: 'P1001' };
    assert.equal(isDatabaseConnectivityError(wrappedError), true);
    passedTests++;
    console.log('  ✓ 4.3: Wrapped error with inner connectivity cause correctly detected');
  }

  // Test 4.4: Programming and runtime defects return false
  {
    assert.equal(isDatabaseConnectivityError(new TypeError('Cannot read properties of undefined (reading desktopTitleSize)')), false);
    assert.equal(isDatabaseConnectivityError(new ReferenceError('variable is not defined')), false);
    assert.equal(isDatabaseConnectivityError(new SyntaxError('Unexpected token in JSON')), false);
    assert.equal(isDatabaseConnectivityError(new RangeError('Maximum call stack size exceeded')), false);
    passedTests++;
    console.log('  ✓ 4.4: TypeError, ReferenceError, SyntaxError rejected from fallback');
  }

  // Test 4.5: Non-connectivity Prisma errors return false
  {
    assert.equal(isDatabaseConnectivityError({ code: 'P2002', message: 'Unique constraint failed on the constraint' }), false);
    assert.equal(isDatabaseConnectivityError({ code: 'P2025', message: 'Record not found' }), false);
    assert.equal(isDatabaseConnectivityError(new Error('Invalid project title: cannot be empty')), false);
    passedTests++;
    console.log('  ✓ 4.5: Constraint and validation errors rejected from fallback');
  }

  // ==========================================
  // SUITE 5: ResilientPortfolioRepository
  // ==========================================
  console.log('\n[Suite 5] ResilientPortfolioRepository Decorator');

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

  // Test 5.1: Primary success returns primary data, fallback never touched
  {
    let primaryCalled = false;
    let fallbackCalled = false;

    const mockPrimary: IPortfolioRepository<Promise<Portfolio>> = {
      getPortfolioData: async () => {
        primaryCalled = true;
        return dummyPrismaPortfolio;
      },
    };

    const mockFallback: IPortfolioRepository<Portfolio> = {
      getPortfolioData: () => {
        fallbackCalled = true;
        return dummyStaticPortfolio;
      },
    };

    const resilient = new ResilientPortfolioRepository(mockPrimary, mockFallback);
    const result = await resilient.getPortfolioData();

    assert.equal(primaryCalled, true);
    assert.equal(fallbackCalled, false);
    assert.equal(result.hero.tagline, 'Prisma Live Tagline');
    passedTests++;
    console.log('  ✓ 5.1: Primary repository success returns primary data without invoking fallback');
  }

  // Test 5.2: Primary connectivity error triggers fallback
  {
    let primaryCalled = false;
    let fallbackCalled = false;

    const mockPrimary: IPortfolioRepository<Promise<Portfolio>> = {
      getPortfolioData: async () => {
        primaryCalled = true;
        const err = new Error('Can\'t reach database server at localhost:5432');
        (err as { code?: string }).code = 'P1001';
        throw err;
      },
    };

    const mockFallback: IPortfolioRepository<Portfolio> = {
      getPortfolioData: () => {
        fallbackCalled = true;
        return dummyStaticPortfolio;
      },
    };

    const resilient = new ResilientPortfolioRepository(mockPrimary, mockFallback);
    const result = await resilient.getPortfolioData();

    assert.equal(primaryCalled, true);
    assert.equal(fallbackCalled, true);
    assert.equal(result.hero.tagline, 'Static Tagline');
    passedTests++;
    console.log('  ✓ 5.2: Primary P1001 connectivity failure gracefully triggers static fallback');
  }

  // Test 5.3: Programming error is re-thrown and does NOT trigger fallback
  {
    let primaryCalled = false;
    let fallbackCalled = false;

    const mockPrimary: IPortfolioRepository<Promise<Portfolio>> = {
      getPortfolioData: async () => {
        primaryCalled = true;
        throw new TypeError('Cannot read properties of undefined (reading mapping)');
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
        assert.ok(err instanceof TypeError);
        return true;
      },
      'Programming errors must be re-thrown'
    );

    assert.equal(primaryCalled, true);
    assert.equal(fallbackCalled, false, 'Fallback must NOT be called on programming errors');
    passedTests++;
    console.log('  ✓ 5.3: Programming defect (TypeError) is re-thrown without hiding defect');
  }

  // Test 5.4: Fallback failure is propagated
  {
    const mockPrimary: IPortfolioRepository<Promise<Portfolio>> = {
      getPortfolioData: async () => {
        const err = new Error('Connection refused');
        (err as { code?: string }).code = 'ECONNREFUSED';
        throw err;
      },
    };

    const mockFallback: IPortfolioRepository<Portfolio> = {
      getPortfolioData: () => {
        throw new Error('Static repository file corrupt');
      },
    };

    const resilient = new ResilientPortfolioRepository(mockPrimary, mockFallback);
    await assert.rejects(
      async () => {
        await resilient.getPortfolioData();
      },
      /Static repository file corrupt/,
      'Fallback failure must be propagated'
    );
    passedTests++;
    console.log('  ✓ 5.4: Fallback repository failure is propagated correctly');
  }

  // ==========================================
  // SUITE 6: CompositionRoot Integration
  // ==========================================
  console.log('\n[Suite 6] CompositionRoot Factories');

  // Test 6.1: Resilient repository and use case factories
  {
    const resilientRepo = CompositionRoot.getResilientPortfolioRepository();
    assert.ok(resilientRepo instanceof ResilientPortfolioRepository);

    const resilientUseCase = CompositionRoot.getResilientPortfolioUseCase();
    assert.ok(resilientUseCase);

    const repoFromSource = CompositionRoot.getPortfolioRepository('resilient');
    assert.ok(repoFromSource instanceof ResilientPortfolioRepository);
    assert.strictEqual(resilientRepo, repoFromSource, 'Resilient repository must be a singleton');

    const useCaseFromSource = CompositionRoot.getPortfolioUseCase('resilient');
    assert.ok(useCaseFromSource);
    passedTests++;
    console.log('  ✓ 6.1: Resilient factories instantiate and cache singleton correctly');
  }

  // Test 6.2: Backward compatibility with static and prisma sources
  {
    const staticRepo = CompositionRoot.getPortfolioRepository('static');
    assert.ok(staticRepo instanceof StaticPortfolioRepository);

    const prismaRepo = CompositionRoot.getPortfolioRepository('prisma');
    assert.ok(prismaRepo instanceof PrismaPortfolioRepository);

    const staticUseCase = CompositionRoot.getPortfolioUseCase('static');
    assert.ok(staticUseCase);

    const prismaUseCase = CompositionRoot.getPortfolioUseCase('prisma');
    assert.ok(prismaUseCase);
    passedTests++;
    console.log('  ✓ 6.2: Existing static and prisma factory methods remain 100% compatible');
  }

  console.log(`\n==============================================`);
  console.log(`ALL TESTS PASSED: ${passedTests} / ${passedTests} assertions verified.`);
  console.log(`==============================================`);
}

runTests().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
