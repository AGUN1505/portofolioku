// scripts/test-phase4.3-infra.ts
// Infrastructure Integration Test Suite for Stage 10.4 Phase 4.3.
// PART 1: Live PostgreSQL Read-Only Integration Tests (zero writes to DB).
// PART 2: Isolated Mock-Based Mutation & Transaction Tests.
// PART 3: Post-run Database Invariant Verification (verifies 40 rows unchanged).

import * as assert from 'assert';
import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaProjectRepository } from '../src/infrastructure/repositories/prisma-project.repository';
import { PrismaExperienceRepository } from '../src/infrastructure/repositories/prisma-experience.repository';
import { CompositionRoot } from '../src/infrastructure/composition-root';
import type { CreateProjectData, UpdateProjectData } from '../src/domain/repositories/project.repository';
import type { CreateExperienceData, UpdateExperienceData } from '../src/domain/repositories/experience.repository';

// Load environment from .env.local
dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('[test-phase4.3-infra] DATABASE_URL not set in environment.');
}

const adapter = new PrismaPg({ connectionString });
const livePrisma = new PrismaClient({ adapter });

let passedTests = 0;
let failedTests = 0;

async function runTest(name: string, fn: () => Promise<void> | void): Promise<void> {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(err);
    failedTests++;
  }
}

async function main() {
  console.log('=== [STAGE 10.4 PHASE 4.3] INFRASTRUCTURE INTEGRATION TESTS ===\n');

  // =========================================================================
  // 1. LIVE POSTGRESQL READ-ONLY INTEGRATION TESTS
  // =========================================================================
  console.log('1. Live PostgreSQL Read-Only Integration Tests:');

  const projectRepo = new PrismaProjectRepository(livePrisma);
  const experienceRepo = new PrismaExperienceRepository(livePrisma);

  await runTest('Projects getAll: returns exactly 3 records sorted by order ASC', async () => {
    const projects = await projectRepo.getAll();
    assert.strictEqual(projects.length, 3);
    assert.strictEqual(projects[0].order, 1);
    assert.strictEqual(projects[1].order, 2);
    assert.strictEqual(projects[2].order, 3);
  });

  await runTest('Projects getAll: preserves exact database primary keys', async () => {
    const projects = await projectRepo.getAll();
    assert.strictEqual(projects[0].id, 'project_01');
    assert.strictEqual(projects[1].id, 'project_02');
    assert.strictEqual(projects[2].id, 'project_03');
  });

  await runTest('Projects getAll: maps technologies as string array and preserves types', async () => {
    const projects = await projectRepo.getAll();
    assert.ok(Array.isArray(projects[0].technologies));
    assert.deepStrictEqual(projects[0].technologies, ['Flutter', 'Laravel', 'REST API']);
    assert.deepStrictEqual(projects[1].technologies, ['Android Application']);
    assert.deepStrictEqual(projects[2].technologies, ['React', 'Express.js', 'PostgreSQL', 'Generative AI']);
  });

  await runTest('Projects getById: returns exact record for existing ID', async () => {
    const p1 = await projectRepo.getById('project_01');
    assert.ok(p1 !== null);
    assert.strictEqual(p1.id, 'project_01');
    assert.strictEqual(p1.title, 'Water Reminder App');
    assert.strictEqual(p1.category, 'Mobile & REST API System');
    assert.strictEqual(p1.order, 1);
  });

  await runTest('Projects getById: returns null for non-existent ID', async () => {
    const pNone = await projectRepo.getById('non_existent_project_id');
    assert.strictEqual(pNone, null);
  });

  await runTest('Experiences getAll: returns exactly 5 records sorted by order ASC', async () => {
    const experiences = await experienceRepo.getAll();
    assert.strictEqual(experiences.length, 5);
    for (let i = 0; i < 5; i++) {
      assert.strictEqual(experiences[i].order, i + 1);
    }
  });

  await runTest('Experiences getAll: preserves exact database primary keys (exp_01 to exp_05)', async () => {
    const experiences = await experienceRepo.getAll();
    assert.strictEqual(experiences[0].id, 'exp_01');
    assert.strictEqual(experiences[1].id, 'exp_02');
    assert.strictEqual(experiences[2].id, 'exp_03');
    assert.strictEqual(experiences[3].id, 'exp_04');
    assert.strictEqual(experiences[4].id, 'exp_05');
  });

  await runTest('Experiences getAll: handles ongoing tenure (endDate === null)', async () => {
    const experiences = await experienceRepo.getAll();
    for (const exp of experiences) {
      assert.strictEqual(exp.endDate, null);
    }
  });

  await runTest('Experiences getById: returns exact record for existing ID', async () => {
    const e1 = await experienceRepo.getById('exp_01');
    assert.ok(e1 !== null);
    assert.strictEqual(e1.id, 'exp_01');
    assert.strictEqual(e1.role, 'Programming Teacher');
    assert.strictEqual(e1.institution, 'Timedoor Academy');
    assert.strictEqual(e1.order, 1);
  });

  await runTest('Experiences getById: returns null for non-existent ID', async () => {
    const eNone = await experienceRepo.getById('non_existent_experience_id');
    assert.strictEqual(eNone, null);
  });

  // =========================================================================
  // 2. COMPOSITION ROOT REGISTRATION & RESOLUTION TESTS
  // =========================================================================
  console.log('\n2. CompositionRoot Registration & Resolution Tests:');

  await runTest('CompositionRoot: getProjectRepository returns singleton instance', () => {
    CompositionRoot.resetForTesting();
    const repo1 = CompositionRoot.getProjectRepository();
    const repo2 = CompositionRoot.getProjectRepository();
    assert.ok(repo1 instanceof PrismaProjectRepository);
    assert.strictEqual(repo1, repo2);
  });

  await runTest('CompositionRoot: getExperienceRepository returns singleton instance', () => {
    const repo1 = CompositionRoot.getExperienceRepository();
    const repo2 = CompositionRoot.getExperienceRepository();
    assert.ok(repo1 instanceof PrismaExperienceRepository);
    assert.strictEqual(repo1, repo2);
  });

  await runTest('CompositionRoot: all 6 Projects use case factories resolve and execute with repository', async () => {
    const getProjectsUc = CompositionRoot.getGetProjectsUseCase();
    const getProjectByIdUc = CompositionRoot.getGetProjectByIdUseCase();
    const createProjectUc = CompositionRoot.getCreateProjectUseCase();
    const updateProjectUc = CompositionRoot.getUpdateProjectUseCase();
    const deleteProjectUc = CompositionRoot.getDeleteProjectUseCase();
    const reorderProjectsUc = CompositionRoot.getReorderProjectsUseCase();

    assert.ok(typeof getProjectsUc.execute === 'function');
    assert.ok(typeof getProjectByIdUc.execute === 'function');
    assert.ok(typeof createProjectUc.execute === 'function');
    assert.ok(typeof updateProjectUc.execute === 'function');
    assert.ok(typeof deleteProjectUc.execute === 'function');
    assert.ok(typeof reorderProjectsUc.execute === 'function');

    // Test live read execution through resolved use cases
    const all = await getProjectsUc.execute();
    assert.strictEqual(all.length, 3);
    const one = await getProjectByIdUc.execute('project_01');
    assert.ok(one !== null);
    assert.strictEqual(one.id, 'project_01');
  });

  await runTest('CompositionRoot: all 6 Experiences use case factories resolve and execute with repository', async () => {
    const getExperiencesUc = CompositionRoot.getGetExperiencesUseCase();
    const getExperienceByIdUc = CompositionRoot.getGetExperienceByIdUseCase();
    const createExperienceUc = CompositionRoot.getCreateExperienceUseCase();
    const updateExperienceUc = CompositionRoot.getUpdateExperienceUseCase();
    const deleteExperienceUc = CompositionRoot.getDeleteExperienceUseCase();
    const reorderExperiencesUc = CompositionRoot.getReorderExperiencesUseCase();

    assert.ok(typeof getExperiencesUc.execute === 'function');
    assert.ok(typeof getExperienceByIdUc.execute === 'function');
    assert.ok(typeof createExperienceUc.execute === 'function');
    assert.ok(typeof updateExperienceUc.execute === 'function');
    assert.ok(typeof deleteExperienceUc.execute === 'function');
    assert.ok(typeof reorderExperiencesUc.execute === 'function');

    // Test live read execution through resolved use cases
    const all = await getExperiencesUc.execute();
    assert.strictEqual(all.length, 5);
    const one = await getExperienceByIdUc.execute('exp_01');
    assert.ok(one !== null);
    assert.strictEqual(one.id, 'exp_01');
  });

  await runTest('CompositionRoot: resetForTesting clears repository instances', () => {
    const repoBefore = CompositionRoot.getProjectRepository();
    CompositionRoot.resetForTesting();
    const repoAfter = CompositionRoot.getProjectRepository();
    assert.notStrictEqual(repoBefore, repoAfter);
  });

  // =========================================================================
  // 3. ISOLATED MOCK-BASED MUTATION & TRANSACTION TESTS (ZERO DB WRITES)
  // =========================================================================
  console.log('\n3. Isolated Mock-Based Mutation & Transaction Tests:');

  await runTest('Mock PrismaProjectRepository.create: maps domain data and excludes system keys', async () => {
    let capturedCreateData: unknown = null;
    const mockPrisma = {
      project: {
        create: async (args: { data: unknown }) => {
          capturedCreateData = args.data;
          return {
            id: 'mock_cuid_123',
            title: 'Mock Title',
            category: 'Engineering',
            description: 'Mock Description',
            technologies: ['TypeScript'],
            thumbnailUrl: null,
            projectUrl: null,
            githubUrl: null,
            published: true,
            publishedAt: new Date('2026-11-08T10:00:00Z'),
            order: 4,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        },
      },
    } as unknown as PrismaClient;

    const repo = new PrismaProjectRepository(mockPrisma);
    const input: CreateProjectData = {
      title: 'Mock Title',
      category: 'Engineering',
      description: 'Mock Description',
      technologies: ['TypeScript'],
      published: true,
      publishedAt: new Date('2026-11-08T10:00:00Z'),
      order: 4,
    };

    const created = await repo.create(input);
    assert.strictEqual(created.id, 'mock_cuid_123');
    assert.strictEqual(created.title, 'Mock Title');
    assert.deepStrictEqual(created.technologies, ['TypeScript']);

    // Check captured create data
    const captured = capturedCreateData as Record<string, unknown>;
    assert.strictEqual(captured.title, 'Mock Title');
    assert.strictEqual(captured.order, 4);
    assert.strictEqual(captured.id, undefined); // system key excluded!
    assert.strictEqual(captured.createdAt, undefined); // system key excluded!
  });

  await runTest('Mock PrismaProjectRepository.update: preserves omitted fields and supports explicit null', async () => {
    let capturedUpdateData: unknown = null;
    const mockPrisma = {
      project: {
        findUnique: async () => ({ id: 'mock_p1' }),
        update: async (args: { where: { id: string }; data: unknown }) => {
          capturedUpdateData = args.data;
          return {
            id: 'mock_p1',
            title: 'Updated Title',
            category: 'Engineering',
            description: 'Original Description',
            technologies: ['Go'],
            thumbnailUrl: null,
            projectUrl: null,
            githubUrl: null,
            published: true,
            publishedAt: null,
            order: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        },
      },
    } as unknown as PrismaClient;

    const repo = new PrismaProjectRepository(mockPrisma);
    const updateInput: UpdateProjectData = {
      title: 'Updated Title',
      thumbnailUrl: null, // explicit null
      // category, description, order omitted!
    };

    await repo.update('mock_p1', updateInput);
    const captured = capturedUpdateData as Record<string, unknown>;
    assert.strictEqual(captured.title, 'Updated Title');
    assert.strictEqual(captured.thumbnailUrl, null);
    assert.strictEqual(captured.category, undefined); // omitted preserved
    assert.strictEqual(captured.description, undefined); // omitted preserved
  });

  await runTest('Mock PrismaProjectRepository.update: throws Error when project not found', async () => {
    const mockPrisma = {
      project: {
        findUnique: async () => null,
      },
    } as unknown as PrismaClient;

    const repo = new PrismaProjectRepository(mockPrisma);
    await assert.rejects(
      async () => {
        await repo.update('missing_id', { title: 'New' });
      },
      /Project with ID "missing_id" not found\./
    );
  });

  await runTest('Mock PrismaProjectRepository.delete: deletes existing and throws when not found', async () => {
    let deletedId = '';
    const mockPrisma = {
      project: {
        findUnique: async ({ where }: { where: { id: string } }) => {
          if (where.id === 'exists') return { id: 'exists' };
          return null;
        },
        delete: async ({ where }: { where: { id: string } }) => {
          deletedId = where.id;
        },
      },
    } as unknown as PrismaClient;

    const repo = new PrismaProjectRepository(mockPrisma);
    await repo.delete('exists');
    assert.strictEqual(deletedId, 'exists');

    await assert.rejects(
      async () => {
        await repo.delete('missing_id');
      },
      /Project with ID "missing_id" not found\./
    );
  });

  await runTest('Mock PrismaProjectRepository.reorder: rejects duplicate IDs before transaction', async () => {
    const mockPrisma = {
      $transaction: async () => {},
    } as unknown as PrismaClient;

    const repo = new PrismaProjectRepository(mockPrisma);
    await assert.rejects(
      async () => {
        await repo.reorder(['p1', 'p1']);
      },
      /Duplicate IDs found in reorder list\./
    );
  });

  await runTest('Mock PrismaProjectRepository.reorder: rejects count mismatch in transaction', async () => {
    const mockPrisma = {
      $transaction: async (cb: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          project: {
            findMany: async () => [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }],
          },
        };
        return cb(tx);
      },
    } as unknown as PrismaClient;

    const repo = new PrismaProjectRepository(mockPrisma);
    await assert.rejects(
      async () => {
        await repo.reorder(['p1', 'p2']);
      },
      /Reorder collection size mismatch/
    );
  });

  await runTest('Mock PrismaProjectRepository.reorder: rejects unknown ID in transaction', async () => {
    const mockPrisma = {
      $transaction: async (cb: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          project: {
            findMany: async () => [{ id: 'p1' }, { id: 'p2' }],
          },
        };
        return cb(tx);
      },
    } as unknown as PrismaClient;

    const repo = new PrismaProjectRepository(mockPrisma);
    await assert.rejects(
      async () => {
        await repo.reorder(['p1', 'foreign_id']);
      },
      /Unknown project ID in reorder list/
    );
  });

  await runTest('Mock PrismaProjectRepository.reorder: sequentially updates orders from 1 atomically', async () => {
    const orderUpdates: { id: string; order: number }[] = [];
    const mockPrisma = {
      $transaction: async (cb: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          project: {
            findMany: async () => [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }],
            update: async (args: { where: { id: string }; data: { order: number } }) => {
              orderUpdates.push({ id: args.where.id, order: args.data.order });
            },
          },
        };
        return cb(tx);
      },
    } as unknown as PrismaClient;

    const repo = new PrismaProjectRepository(mockPrisma);
    await repo.reorder(['p3', 'p1', 'p2']);

    assert.deepStrictEqual(orderUpdates, [
      { id: 'p3', order: 1 },
      { id: 'p1', order: 2 },
      { id: 'p2', order: 3 },
    ]);
  });

  await runTest('Mock PrismaExperienceRepository.create: maps domain data and ongoing tenure', async () => {
    let capturedData: unknown = null;
    const mockPrisma = {
      experience: {
        create: async (args: { data: unknown }) => {
          capturedData = args.data;
          return {
            id: 'exp_mock_1',
            role: 'Senior Engineer',
            institution: 'Startup Inc',
            track: 'Engineering',
            description: null,
            startDate: new Date('2024-01-01'),
            endDate: null,
            order: 6,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        },
      },
    } as unknown as PrismaClient;

    const repo = new PrismaExperienceRepository(mockPrisma);
    const input: CreateExperienceData = {
      role: 'Senior Engineer',
      institution: 'Startup Inc',
      track: 'Engineering',
      startDate: new Date('2024-01-01'),
      endDate: null,
      order: 6,
    };

    const created = await repo.create(input);
    assert.strictEqual(created.id, 'exp_mock_1');
    assert.strictEqual(created.endDate, null); // ongoing preserved!

    const captured = capturedData as Record<string, unknown>;
    assert.strictEqual(captured.role, 'Senior Engineer');
    assert.strictEqual(captured.endDate, null);
    assert.strictEqual(captured.id, undefined); // system key excluded!
  });

  await runTest('Mock PrismaExperienceRepository.update: preserves omitted fields and supports explicit null', async () => {
    let capturedUpdateData: unknown = null;
    const mockPrisma = {
      experience: {
        findUnique: async () => ({ id: 'exp_1' }),
        update: async (args: { where: { id: string }; data: unknown }) => {
          capturedUpdateData = args.data;
          return {
            id: 'exp_1',
            role: 'Lead Developer',
            institution: 'Tech Corp',
            track: 'Leadership',
            description: null,
            startDate: new Date('2022-01-01'),
            endDate: null,
            order: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        },
      },
    } as unknown as PrismaClient;

    const repo = new PrismaExperienceRepository(mockPrisma);
    const updateInput: UpdateExperienceData = {
      role: 'Lead Developer',
      description: null, // explicit null
    };

    await repo.update('exp_1', updateInput);
    const captured = capturedUpdateData as Record<string, unknown>;
    assert.strictEqual(captured.role, 'Lead Developer');
    assert.strictEqual(captured.description, null);
    assert.strictEqual(captured.institution, undefined); // omitted preserved
  });

  await runTest('Mock PrismaExperienceRepository.delete: deletes and handles missing id', async () => {
    let deletedId = '';
    const mockPrisma = {
      experience: {
        findUnique: async ({ where }: { where: { id: string } }) => {
          if (where.id === 'exists') return { id: 'exists' };
          return null;
        },
        delete: async ({ where }: { where: { id: string } }) => {
          deletedId = where.id;
        },
      },
    } as unknown as PrismaClient;

    const repo = new PrismaExperienceRepository(mockPrisma);
    await repo.delete('exists');
    assert.strictEqual(deletedId, 'exists');

    await assert.rejects(
      async () => {
        await repo.delete('missing');
      },
      /Experience with ID "missing" not found\./
    );
  });

  await runTest('Mock PrismaExperienceRepository.reorder: updates sequential order inside transaction', async () => {
    const orderUpdates: { id: string; order: number }[] = [];
    const mockPrisma = {
      $transaction: async (cb: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          experience: {
            findMany: async () => [{ id: 'e1' }, { id: 'e2' }],
            update: async (args: { where: { id: string }; data: { order: number } }) => {
              orderUpdates.push({ id: args.where.id, order: args.data.order });
            },
          },
        };
        return cb(tx);
      },
    } as unknown as PrismaClient;

    const repo = new PrismaExperienceRepository(mockPrisma);
    await repo.reorder(['e2', 'e1']);

    assert.deepStrictEqual(orderUpdates, [
      { id: 'e2', order: 1 },
      { id: 'e1', order: 2 },
    ]);
  });

  // =========================================================================
  // 4. DATABASE INVARIANT CHECK (VERIFIES EXACT 40 ROWS UNCHANGED)
  // =========================================================================
  console.log('\n4. Database Invariant Check:');

  await runTest('Database row count invariant: exactly 40 total records preserved', async () => {
    const [
      hero,
      roles,
      nodes,
      about,
      domains,
      pillars,
      projects,
      experiences,
      categories,
      skills,
      contact,
      channels,
      admins,
    ] = await Promise.all([
      livePrisma.heroProfile.count(),
      livePrisma.role.count(),
      livePrisma.engineeringNode.count(),
      livePrisma.aboutProfile.count(),
      livePrisma.domain.count(),
      livePrisma.pillar.count(),
      livePrisma.project.count(),
      livePrisma.experience.count(),
      livePrisma.skillCategory.count(),
      livePrisma.skill.count(),
      livePrisma.contactProfile.count(),
      livePrisma.contactChannel.count(),
      livePrisma.admin.count(),
    ]);

    const total =
      hero +
      roles +
      nodes +
      about +
      domains +
      pillars +
      projects +
      experiences +
      categories +
      skills +
      contact +
      channels +
      admins;

    assert.strictEqual(projects, 3, 'Projects count must be exactly 3');
    assert.strictEqual(experiences, 5, 'Experiences count must be exactly 5');
    assert.strictEqual(admins, 0, 'Admins count must be exactly 0');
    assert.strictEqual(channels, 0, 'Contact channels count must be exactly 0');
    assert.strictEqual(total, 40, 'Total database records must be exactly 40');
  });

  await livePrisma.$disconnect();

  console.log('\n--- SUMMARY ---');
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);

  if (failedTests > 0) {
    process.exit(1);
  } else {
    console.log('=== ALL PHASE 4.3 INFRASTRUCTURE INTEGRATION TESTS PASSED ===');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
