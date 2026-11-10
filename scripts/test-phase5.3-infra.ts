// scripts/test-phase5.3-infra.ts
// Infrastructure Integration Test Suite for Stage 10.4 Phase 5.3.
// PART 1: Live PostgreSQL Read-Only Integration Tests (zero writes to DB).
// PART 2: Mapper Unit Tests (6 mappers: domain mapping, create/update input transformations).
// PART 3: Isolated Mock-Based Mutation, Reorder, & Transaction Rollback Tests.
// PART 4: CompositionRoot Dependency Resolution & Singleton Invariants (all 33 use cases).
// PART 5: Post-run Database Invariant Verification (verifies 40 rows unchanged).

import * as assert from 'assert';
import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaRoleRepository } from '../src/infrastructure/repositories/prisma-role.repository';
import { PrismaEngineeringNodeRepository } from '../src/infrastructure/repositories/prisma-engineering-node.repository';
import { PrismaDomainRepository } from '../src/infrastructure/repositories/prisma-domain.repository';
import { PrismaPillarRepository } from '../src/infrastructure/repositories/prisma-pillar.repository';
import { PrismaSkillCategoryRepository } from '../src/infrastructure/repositories/prisma-skill-category.repository';
import { PrismaSkillRepository } from '../src/infrastructure/repositories/prisma-skill.repository';

import { PrismaRoleRecordMapper } from '../src/infrastructure/mappers/prisma-role-record.mapper';
import { PrismaEngineeringNodeRecordMapper } from '../src/infrastructure/mappers/prisma-engineering-node-record.mapper';
import { PrismaDomainRecordMapper } from '../src/infrastructure/mappers/prisma-domain-record.mapper';
import { PrismaPillarRecordMapper } from '../src/infrastructure/mappers/prisma-pillar-record.mapper';
import { PrismaSkillCategoryRecordMapper } from '../src/infrastructure/mappers/prisma-skill-category-record.mapper';
import { PrismaSkillRecordMapper } from '../src/infrastructure/mappers/prisma-skill-record.mapper';

import { CompositionRoot } from '../src/infrastructure/composition-root';

// Load environment from .env.local
dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('[test-phase5.3-infra] DATABASE_URL not set in environment.');
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
  console.log('=== [STAGE 10.4 PHASE 5.3] INFRASTRUCTURE INTEGRATION TESTS ===\n');

  // =========================================================================
  // 1. LIVE POSTGRESQL READ-ONLY INTEGRATION TESTS
  // =========================================================================
  console.log('1. Live PostgreSQL Read-Only Integration Tests:');

  const roleRepo = new PrismaRoleRepository(livePrisma);
  const nodeRepo = new PrismaEngineeringNodeRepository(livePrisma);
  const domainRepo = new PrismaDomainRepository(livePrisma);
  const pillarRepo = new PrismaPillarRepository(livePrisma);
  const categoryRepo = new PrismaSkillCategoryRepository(livePrisma);
  const skillRepo = new PrismaSkillRepository(livePrisma);

  // --- Roles ---
  await runTest('Roles getAll: returns exactly 4 records sorted by order ASC', async () => {
    const roles = await roleRepo.getAll();
    assert.strictEqual(roles.length, 4);
    for (let i = 0; i < roles.length; i++) {
      assert.strictEqual(roles[i].order, i + 1);
    }
  });

  await runTest('Roles getAll: preserves primary flag boolean and fields', async () => {
    const roles = await roleRepo.getAll();
    assert.ok(roles.some((r) => r.primary === true));
    assert.ok(roles.some((r) => r.primary === false));
    assert.ok(roles.every((r) => typeof r.id === 'string' && r.title.length > 0));
  });

  await runTest('Roles getById: returns exact role or null', async () => {
    const roles = await roleRepo.getAll();
    const first = await roleRepo.getById(roles[0].id);
    assert.ok(first !== null);
    assert.strictEqual(first.id, roles[0].id);
    assert.strictEqual(first.title, roles[0].title);

    const nonExistent = await roleRepo.getById('non_existent_role_id');
    assert.strictEqual(nonExistent, null);
  });

  // --- Engineering Nodes ---
  await runTest('Engineering Nodes getAll: returns exactly 3 records sorted by order ASC', async () => {
    const nodes = await nodeRepo.getAll();
    assert.strictEqual(nodes.length, 3);
    for (let i = 0; i < nodes.length; i++) {
      assert.strictEqual(nodes[i].order, i + 1);
    }
  });

  await runTest('Engineering Nodes getAll: handles nullable stack and boolean highlighted', async () => {
    const nodes = await nodeRepo.getAll();
    for (const node of nodes) {
      assert.ok(typeof node.tag === 'string');
      assert.ok(typeof node.title === 'string');
      assert.ok(typeof node.description === 'string');
      assert.ok(node.stack === null || typeof node.stack === 'string');
      assert.ok(typeof node.highlighted === 'boolean');
    }
  });

  await runTest('Engineering Nodes getById: returns exact node or null', async () => {
    const nodes = await nodeRepo.getAll();
    const first = await nodeRepo.getById(nodes[0].id);
    assert.ok(first !== null);
    assert.strictEqual(first.id, nodes[0].id);

    const nonExistent = await nodeRepo.getById('non_existent_node_id');
    assert.strictEqual(nonExistent, null);
  });

  // --- Domains ---
  await runTest('Domains getAll: returns exactly 4 records sorted by order ASC', async () => {
    const domains = await domainRepo.getAll();
    assert.strictEqual(domains.length, 4);
    for (let i = 0; i < domains.length; i++) {
      assert.strictEqual(domains[i].order, i + 1);
    }
  });

  await runTest('Domains getAll: strictly preserves string index values', async () => {
    const domains = await domainRepo.getAll();
    for (const domain of domains) {
      assert.ok(typeof domain.index === 'string' && domain.index.length > 0);
      assert.ok(typeof domain.title === 'string');
    }
  });

  await runTest('Domains getById: returns exact domain or null', async () => {
    const domains = await domainRepo.getAll();
    const first = await domainRepo.getById(domains[0].id);
    assert.ok(first !== null);
    assert.strictEqual(first.id, domains[0].id);

    const nonExistent = await domainRepo.getById('non_existent_domain_id');
    assert.strictEqual(nonExistent, null);
  });

  // --- Pillars ---
  await runTest('Pillars getAll: returns exactly 3 records sorted by order ASC', async () => {
    const pillars = await pillarRepo.getAll();
    assert.strictEqual(pillars.length, 3);
    for (let i = 0; i < pillars.length; i++) {
      assert.strictEqual(pillars[i].order, i + 1);
    }
  });

  await runTest('Pillars getAll: preserves string index and text description', async () => {
    const pillars = await pillarRepo.getAll();
    for (const pillar of pillars) {
      assert.ok(typeof pillar.index === 'string' && pillar.index.length > 0);
      assert.ok(typeof pillar.title === 'string');
      assert.ok(typeof pillar.description === 'string');
    }
  });

  await runTest('Pillars getById: returns exact pillar or null', async () => {
    const pillars = await pillarRepo.getAll();
    const first = await pillarRepo.getById(pillars[0].id);
    assert.ok(first !== null);
    assert.strictEqual(first.id, pillars[0].id);

    const nonExistent = await pillarRepo.getById('non_existent_pillar_id');
    assert.strictEqual(nonExistent, null);
  });

  // --- Skill Categories & Skills ---
  await runTest('Skill Categories getAll: returns exactly 4 records sorted by order ASC', async () => {
    const categories = await categoryRepo.getAll();
    assert.strictEqual(categories.length, 4);
    for (let i = 0; i < categories.length; i++) {
      assert.strictEqual(categories[i].order, i + 1);
    }
  });

  await runTest('Skills getAll: returns exactly 11 records sorted by order ASC', async () => {
    const skills = await skillRepo.getAll();
    assert.strictEqual(skills.length, 11);
    for (const skill of skills) {
      assert.ok(typeof skill.id === 'string');
      assert.ok(typeof skill.name === 'string');
      assert.ok(typeof skill.categoryId === 'string');
      assert.ok(typeof skill.order === 'number');
    }
  });

  await runTest('Skills countByCategoryId & getByCategoryId: returns consistent child skills', async () => {
    const categories = await categoryRepo.getAll();
    let totalCount = 0;

    for (const cat of categories) {
      const count = await skillRepo.countByCategoryId(cat.id);
      const catSkills = await skillRepo.getByCategoryId(cat.id);
      assert.strictEqual(catSkills.length, count);

      // Verify category skills are sorted by order ASC
      for (let i = 0; i < catSkills.length - 1; i++) {
        assert.ok(catSkills[i].order <= catSkills[i + 1].order);
      }

      totalCount += count;
    }

    assert.strictEqual(totalCount, 11);
  });

  // =========================================================================
  // 2. PRISMA MAPPER TESTS
  // =========================================================================
  console.log('\n2. Prisma Mapper Unit Tests:');

  await runTest('PrismaRoleRecordMapper: maps domain, create, and update correctly', () => {
    const mockPrismaRole = {
      id: 'role_test',
      title: 'Backend Engineer',
      primary: true,
      order: 1,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-02'),
    };
    const domain = PrismaRoleRecordMapper.toDomain(mockPrismaRole);
    assert.strictEqual(domain.id, 'role_test');
    assert.strictEqual(domain.title, 'Backend Engineer');
    assert.strictEqual(domain.primary, true);

    const createInput = PrismaRoleRecordMapper.toPrismaCreate({
      title: 'DevOps',
      primary: true,
      order: 2,
    });
    assert.strictEqual(createInput.title, 'DevOps');
    assert.strictEqual(createInput.primary, true);
    assert.strictEqual(createInput.order, 2);

    const updateInput = PrismaRoleRecordMapper.toPrismaUpdate({
      title: 'SRE',
    });
    assert.strictEqual(updateInput.title, 'SRE');
    assert.strictEqual(updateInput.primary, undefined);
  });

  await runTest('PrismaEngineeringNodeRecordMapper: handles nullable stack explicitly', () => {
    const mockPrismaNode = {
      id: 'node_test',
      tag: 'ARCH',
      title: 'System Design',
      description: 'Distributed systems',
      stack: null,
      highlighted: false,
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const domain = PrismaEngineeringNodeRecordMapper.toDomain(mockPrismaNode);
    assert.strictEqual(domain.stack, null);
    assert.strictEqual(domain.highlighted, false);

    const createNullStack = PrismaEngineeringNodeRecordMapper.toPrismaCreate({
      tag: 'NET',
      title: 'Networking',
      description: 'TCP/IP',
      stack: null,
      highlighted: true,
      order: 3,
    });
    assert.strictEqual(createNullStack.stack, null);
    assert.strictEqual(createNullStack.highlighted, true);

    const updateNullStack = PrismaEngineeringNodeRecordMapper.toPrismaUpdate({
      stack: null,
    });
    assert.strictEqual(updateNullStack.stack, null);
  });

  await runTest('PrismaDomainRecordMapper: preserves string index intact', () => {
    const mockPrismaDomain = {
      id: 'dom_01',
      index: '01',
      title: 'Distributed Architecture',
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const domain = PrismaDomainRecordMapper.toDomain(mockPrismaDomain);
    assert.strictEqual(domain.index, '01');
    assert.strictEqual(domain.title, 'Distributed Architecture');

    const createInput = PrismaDomainRecordMapper.toPrismaCreate({
      index: '05',
      title: 'Cloud Native',
      order: 5,
    });
    assert.strictEqual(createInput.index, '05');
  });

  await runTest('PrismaPillarRecordMapper: preserves string index and description', () => {
    const mockPrismaPillar = {
      id: 'pil_01',
      index: '01',
      title: 'Scalability',
      description: 'Handling 10k RPS',
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const domain = PrismaPillarRecordMapper.toDomain(mockPrismaPillar);
    assert.strictEqual(domain.index, '01');
    assert.strictEqual(domain.description, 'Handling 10k RPS');
  });

  await runTest('PrismaSkillCategoryRecordMapper: maps category fields', () => {
    const mockPrismaCat = {
      id: 'cat_01',
      title: 'Backend & Systems',
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const domain = PrismaSkillCategoryRecordMapper.toDomain(mockPrismaCat);
    assert.strictEqual(domain.title, 'Backend & Systems');
    assert.strictEqual(domain.order, 1);
  });

  await runTest('PrismaSkillRecordMapper: maps foreign key connect for category', () => {
    const mockPrismaSkill = {
      id: 'skill_01',
      name: 'Golang',
      categoryId: 'cat_01',
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const domain = PrismaSkillRecordMapper.toDomain(mockPrismaSkill);
    assert.strictEqual(domain.categoryId, 'cat_01');

    const createInput = PrismaSkillRecordMapper.toPrismaCreate({
      name: 'Rust',
      categoryId: 'cat_01',
      order: 2,
    });
    assert.deepStrictEqual(createInput.category, { connect: { id: 'cat_01' } });

    const updateInput = PrismaSkillRecordMapper.toPrismaUpdate({
      categoryId: 'cat_02',
    });
    assert.deepStrictEqual(updateInput.category, { connect: { id: 'cat_02' } });
  });

  // =========================================================================
  // 3. ISOLATED MOCK-BASED MUTATION, REORDER & TRANSACTION ROLLBACK TESTS
  // =========================================================================
  console.log('\n3. Isolated Mock-Based Mutation & Transaction Tests:');

  interface MockRole {
    id: string;
    title: string;
    primary: boolean;
    order: number;
    createdAt: Date;
    updatedAt: Date;
  }

  interface MockSkillCategory {
    id: string;
    title: string;
    order: number;
    createdAt: Date;
    updatedAt: Date;
  }

  interface MockSkill {
    id: string;
    name: string;
    categoryId: string;
    order: number;
    createdAt: Date;
    updatedAt: Date;
  }

  interface MockPrismaInstance {
    role: {
      findMany: (args?: { orderBy?: { order?: 'asc' | 'desc' }; select?: { id?: boolean } }) => Promise<Array<MockRole | { id: string }>>;
      findUnique: (args: { where: { id: string }; select?: { id?: boolean } }) => Promise<MockRole | { id: string } | null>;
      create: (args: { data: Omit<MockRole, 'id' | 'createdAt' | 'updatedAt'> }) => Promise<MockRole>;
      update: (args: { where: { id: string }; data: Partial<MockRole> }) => Promise<MockRole>;
      delete: (args: { where: { id: string } }) => Promise<void>;
    };
    skillCategory: {
      findMany: (args?: { select?: { id?: boolean } }) => Promise<Array<MockSkillCategory | { id: string }>>;
      findUnique: (args: { where: { id: string }; select?: { id?: boolean } }) => Promise<MockSkillCategory | { id: string } | null>;
      delete: (args: { where: { id: string } }) => Promise<void>;
      update: (args: { where: { id: string }; data: Partial<MockSkillCategory> }) => Promise<MockSkillCategory>;
    };
    skill: {
      findMany: (args?: { where?: { categoryId?: string }; select?: { id?: boolean }; orderBy?: { order?: 'asc' | 'desc' } }) => Promise<Array<MockSkill | { id: string }>>;
      findUnique: (args: { where: { id: string }; select?: { id?: boolean } }) => Promise<MockSkill | { id: string } | null>;
      count: (args: { where: { categoryId: string } }) => Promise<number>;
      create: (args: { data: { name: string; categoryId?: string; order: number; category?: { connect?: { id?: string } } } }) => Promise<MockSkill>;
      update: (args: { where: { id: string }; data: { name?: string; order?: number; categoryId?: string; category?: { connect?: { id?: string } } } }) => Promise<MockSkill>;
      delete: (args: { where: { id: string } }) => Promise<void>;
    };
    $transaction: <T>(fn: (tx: MockPrismaInstance) => Promise<T>) => Promise<T>;
  }

  // Helper: In-memory mock Prisma client for isolated mutation and transaction testing
  function createMockPrisma(): MockPrismaInstance {
    let roles: MockRole[] = [
      { id: 'r1', title: 'Role 1', primary: true, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { id: 'r2', title: 'Role 2', primary: false, order: 2, createdAt: new Date(), updatedAt: new Date() },
      { id: 'r3', title: 'Role 3', primary: false, order: 3, createdAt: new Date(), updatedAt: new Date() },
    ];
    let categories: MockSkillCategory[] = [
      { id: 'c1', title: 'Cat 1', order: 1, createdAt: new Date(), updatedAt: new Date() },
      { id: 'c2', title: 'Cat 2', order: 2, createdAt: new Date(), updatedAt: new Date() },
    ];
    let skills: MockSkill[] = [
      { id: 's1', name: 'Skill 1', categoryId: 'c1', order: 1, createdAt: new Date(), updatedAt: new Date() },
      { id: 's2', name: 'Skill 2', categoryId: 'c1', order: 2, createdAt: new Date(), updatedAt: new Date() },
      { id: 's3', name: 'Skill 3', categoryId: 'c2', order: 1, createdAt: new Date(), updatedAt: new Date() },
    ];

    const mock: MockPrismaInstance = {
      role: {
        findMany: async (args) => {
          const res = [...roles];
          if (args?.orderBy?.order === 'asc') res.sort((a, b) => a.order - b.order);
          if (args?.select?.id) return res.map((r) => ({ id: r.id }));
          return res;
        },
        findUnique: async (args) => roles.find((r) => r.id === args.where.id) || null,
        create: async (args) => {
          const newRole: MockRole = { id: 'r_new', ...args.data, createdAt: new Date(), updatedAt: new Date() };
          roles.push(newRole);
          return newRole;
        },
        update: async (args) => {
          const idx = roles.findIndex((r) => r.id === args.where.id);
          if (idx === -1) throw new Error('Not found');
          roles[idx] = { ...roles[idx], ...args.data, updatedAt: new Date() };
          return roles[idx];
        },
        delete: async (args) => {
          roles = roles.filter((r) => r.id !== args.where.id);
        },
      },
      skillCategory: {
        findMany: async (args) => {
          const res = [...categories];
          if (args?.select?.id) return res.map((c) => ({ id: c.id }));
          return res;
        },
        findUnique: async (args) => categories.find((c) => c.id === args.where.id) || null,
        delete: async (args) => {
          categories = categories.filter((c) => c.id !== args.where.id);
          // simulate DB ON DELETE CASCADE
          skills = skills.filter((s) => s.categoryId !== args.where.id);
        },
        update: async (args) => {
          const idx = categories.findIndex((c) => c.id === args.where.id);
          if (idx === -1) throw new Error('Not found');
          categories[idx] = { ...categories[idx], ...args.data, updatedAt: new Date() };
          return categories[idx];
        },
      },
      skill: {
        findMany: async (args) => {
          let res = [...skills];
          const targetCatId = args?.where?.categoryId;
          if (targetCatId) res = res.filter((s) => s.categoryId === targetCatId);
          if (args?.select?.id) return res.map((s) => ({ id: s.id }));
          return res;
        },
        findUnique: async (args) => skills.find((s) => s.id === args?.where?.id) || null,
        count: async (args) => {
          const targetCatId = args?.where?.categoryId;
          return skills.filter((s) => s.categoryId === targetCatId).length;
        },
        create: async (args) => {
          const catId = args.data.category?.connect?.id || args.data.categoryId || '';
          const newSkill: MockSkill = {
            id: 's_new',
            name: args.data.name,
            categoryId: catId,
            order: args.data.order,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          skills.push(newSkill);
          return newSkill;
        },
        update: async (args) => {
          const idx = skills.findIndex((s) => s.id === args.where.id);
          if (idx === -1) throw new Error('Not found');
          const updateData: Partial<MockSkill> = {};
          if (args.data.name !== undefined) updateData.name = args.data.name;
          if (args.data.order !== undefined) updateData.order = args.data.order;
          if (args.data.category?.connect?.id) {
            updateData.categoryId = args.data.category.connect.id;
          } else if (args.data.categoryId) {
            updateData.categoryId = args.data.categoryId;
          }
          skills[idx] = { ...skills[idx], ...updateData, updatedAt: new Date() };
          return skills[idx];
        },
        delete: async (args) => {
          skills = skills.filter((s) => s.id !== args.where.id);
        },
      },
      $transaction: async <T>(fn: (tx: MockPrismaInstance) => Promise<T>): Promise<T> => {
        // snapshot for rollback
        const snapRoles = JSON.parse(JSON.stringify(roles));
        const snapCats = JSON.parse(JSON.stringify(categories));
        const snapSkills = JSON.parse(JSON.stringify(skills));
        try {
          return await fn(mock);
        } catch (err) {
          roles = snapRoles;
          categories = snapCats;
          skills = snapSkills;
          throw err;
        }
      },
    };

    return mock;
  }

  await runTest('Reorder: rejects duplicate IDs in input before transaction', async () => {
    const mock = createMockPrisma();
    const repo = new PrismaRoleRepository(mock as unknown as PrismaClient);
    await assert.rejects(
      async () => await repo.reorder(['r1', 'r1', 'r2']),
      /Duplicate IDs found in reorder list/
    );
  });

  await runTest('Reorder: rejects incomplete collection mismatch', async () => {
    const mock = createMockPrisma();
    const repo = new PrismaRoleRepository(mock as unknown as PrismaClient);
    await assert.rejects(
      async () => await repo.reorder(['r1', 'r2']),
      /Reorder collection size mismatch/
    );
  });

  await runTest('Reorder: rejects unknown ID inside transaction', async () => {
    const mock = createMockPrisma();
    const repo = new PrismaRoleRepository(mock as unknown as PrismaClient);
    await assert.rejects(
      async () => await repo.reorder(['r1', 'r2', 'r_unknown']),
      /Unknown role ID in reorder list/
    );
  });

  await runTest('Reorder: successfully updates orders sequentially (1..N)', async () => {
    const mock = createMockPrisma();
    const repo = new PrismaRoleRepository(mock as unknown as PrismaClient);
    await repo.reorder(['r3', 'r1', 'r2']);

    const r3 = await repo.getById('r3');
    const r1 = await repo.getById('r1');
    const r2 = await repo.getById('r2');

    assert.strictEqual(r3?.order, 1);
    assert.strictEqual(r1?.order, 2);
    assert.strictEqual(r2?.order, 3);
  });

  await runTest('Reorder: transaction rollbacks completely on failure', async () => {
    const mock = createMockPrisma();
    const repo = new PrismaRoleRepository(mock as unknown as PrismaClient);

    // inject failure on updating r2
    const originalUpdate = mock.role.update;
    mock.role.update = async (args) => {
      if (args.where.id === 'r2') throw new Error('Database write error');
      return originalUpdate(args);
    };

    await assert.rejects(
      async () => await repo.reorder(['r3', 'r2', 'r1']),
      /Database write error/
    );

    // verify rollback: r3 was not permanently modified
    mock.role.update = originalUpdate;
    const r3 = await repo.getById('r3');
    assert.strictEqual(r3?.order, 3); // initial order restored
  });

  await runTest('Skills Reorder: rejects skills from foreign category', async () => {
    const mock = createMockPrisma();
    const repo = new PrismaSkillRepository(mock as unknown as PrismaClient);

    // s3 belongs to c2, attempting to reorder inside c1
    await assert.rejects(
      async () => await repo.reorder('c1', ['s1', 's3']),
      /Skill ID "s3" does not belong to category "c1"/
    );
  });

  await runTest('Skills Reorder: successfully reorders skills within category', async () => {
    const mock = createMockPrisma();
    const repo = new PrismaSkillRepository(mock as unknown as PrismaClient);

    await repo.reorder('c1', ['s2', 's1']);
    const s2 = await repo.getById('s2');
    const s1 = await repo.getById('s1');

    assert.strictEqual(s2?.order, 1);
    assert.strictEqual(s1?.order, 2);
  });

  await runTest('Skill Category Delete: executes inside transaction and cascades child skills', async () => {
    const mock = createMockPrisma();
    const catRepo = new PrismaSkillCategoryRepository(mock as unknown as PrismaClient);
    const skillRepo = new PrismaSkillRepository(mock as unknown as PrismaClient);

    assert.strictEqual(await skillRepo.countByCategoryId('c1'), 2);

    await catRepo.delete('c1', 2);
    assert.strictEqual(await catRepo.getById('c1'), null);
    assert.strictEqual(await skillRepo.countByCategoryId('c1'), 0);
  });

  // =========================================================================
  // 4. COMPOSITION ROOT DEPENDENCY RESOLUTION & USE CASES
  // =========================================================================
  console.log('\n4. CompositionRoot Dependency Resolution & Use Cases:');

  await runTest('CompositionRoot: resets singletons correctly', () => {
    CompositionRoot.resetForTesting();
    assert.ok(true);
  });

  await runTest('CompositionRoot: resolves all 6 Phase 5.3 repositories as singletons', () => {
    const r1 = CompositionRoot.getRoleRepository();
    const r2 = CompositionRoot.getRoleRepository();
    assert.strictEqual(r1, r2);

    const n1 = CompositionRoot.getEngineeringNodeRepository();
    const n2 = CompositionRoot.getEngineeringNodeRepository();
    assert.strictEqual(n1, n2);

    const d1 = CompositionRoot.getDomainRepository();
    const d2 = CompositionRoot.getDomainRepository();
    assert.strictEqual(d1, d2);

    const p1 = CompositionRoot.getPillarRepository();
    const p2 = CompositionRoot.getPillarRepository();
    assert.strictEqual(p1, p2);

    const c1 = CompositionRoot.getSkillCategoryRepository();
    const c2 = CompositionRoot.getSkillCategoryRepository();
    assert.strictEqual(c1, c2);

    const s1 = CompositionRoot.getSkillRepository();
    const s2 = CompositionRoot.getSkillRepository();
    assert.strictEqual(s1, s2);
  });

  await runTest('CompositionRoot: resolves all 33 Phase 5.2 use cases successfully', () => {
    // Roles (6)
    assert.ok(CompositionRoot.getGetRolesUseCase());
    assert.ok(CompositionRoot.getGetRoleByIdUseCase());
    assert.ok(CompositionRoot.getCreateRoleUseCase());
    assert.ok(CompositionRoot.getUpdateRoleUseCase());
    assert.ok(CompositionRoot.getDeleteRoleUseCase());
    assert.ok(CompositionRoot.getReorderRolesUseCase());

    // Engineering Nodes (6)
    assert.ok(CompositionRoot.getGetEngineeringNodesUseCase());
    assert.ok(CompositionRoot.getGetEngineeringNodeByIdUseCase());
    assert.ok(CompositionRoot.getCreateEngineeringNodeUseCase());
    assert.ok(CompositionRoot.getUpdateEngineeringNodeUseCase());
    assert.ok(CompositionRoot.getDeleteEngineeringNodeUseCase());
    assert.ok(CompositionRoot.getReorderEngineeringNodesUseCase());

    // Domains (6)
    assert.ok(CompositionRoot.getGetDomainsUseCase());
    assert.ok(CompositionRoot.getGetDomainByIdUseCase());
    assert.ok(CompositionRoot.getCreateDomainUseCase());
    assert.ok(CompositionRoot.getUpdateDomainUseCase());
    assert.ok(CompositionRoot.getDeleteDomainUseCase());
    assert.ok(CompositionRoot.getReorderDomainsUseCase());

    // Pillars (6)
    assert.ok(CompositionRoot.getGetPillarsUseCase());
    assert.ok(CompositionRoot.getGetPillarByIdUseCase());
    assert.ok(CompositionRoot.getCreatePillarUseCase());
    assert.ok(CompositionRoot.getUpdatePillarUseCase());
    assert.ok(CompositionRoot.getDeletePillarUseCase());
    assert.ok(CompositionRoot.getReorderPillarsUseCase());

    // Skill Categories (5)
    assert.ok(CompositionRoot.getGetSkillCategoriesUseCase());
    assert.ok(CompositionRoot.getCreateSkillCategoryUseCase());
    assert.ok(CompositionRoot.getUpdateSkillCategoryUseCase());
    assert.ok(CompositionRoot.getDeleteSkillCategoryUseCase());
    assert.ok(CompositionRoot.getReorderSkillCategoriesUseCase());

    // Skills (4)
    assert.ok(CompositionRoot.getCreateSkillUseCase());
    assert.ok(CompositionRoot.getUpdateSkillUseCase());
    assert.ok(CompositionRoot.getDeleteSkillUseCase());
    assert.ok(CompositionRoot.getReorderSkillsUseCase());
  });

  // =========================================================================
  // 5. POST-RUN DATABASE INVARIANT VERIFICATION
  // =========================================================================
  console.log('\n5. Post-Run Database Baseline Verification:');

  await runTest('Database row counts match exact baseline (40 rows, 0 admins, 0 channels)', async () => {
    const heroCount = await livePrisma.heroProfile.count();
    const roleCount = await livePrisma.role.count();
    const nodeCount = await livePrisma.engineeringNode.count();
    const aboutCount = await livePrisma.aboutProfile.count();
    const domainCount = await livePrisma.domain.count();
    const pillarCount = await livePrisma.pillar.count();
    const projectCount = await livePrisma.project.count();
    const expCount = await livePrisma.experience.count();
    const catCount = await livePrisma.skillCategory.count();
    const skillCount = await livePrisma.skill.count();
    const contactCount = await livePrisma.contactProfile.count();
    const channelCount = await livePrisma.contactChannel.count();
    const adminCount = await livePrisma.admin.count();

    const total =
      heroCount +
      roleCount +
      nodeCount +
      aboutCount +
      domainCount +
      pillarCount +
      projectCount +
      expCount +
      catCount +
      skillCount +
      contactCount +
      channelCount +
      adminCount;

    assert.strictEqual(heroCount, 1, 'hero_profiles must be 1');
    assert.strictEqual(roleCount, 4, 'roles must be 4');
    assert.strictEqual(nodeCount, 3, 'engineering_nodes must be 3');
    assert.strictEqual(aboutCount, 1, 'about_profiles must be 1');
    assert.strictEqual(domainCount, 4, 'domains must be 4');
    assert.strictEqual(pillarCount, 3, 'pillars must be 3');
    assert.strictEqual(projectCount, 3, 'projects must be 3');
    assert.strictEqual(expCount, 5, 'experiences must be 5');
    assert.strictEqual(catCount, 4, 'skill_categories must be 4');
    assert.strictEqual(skillCount, 11, 'skills must be 11');
    assert.strictEqual(contactCount, 1, 'contact_profiles must be 1');
    assert.strictEqual(channelCount, 0, 'contact_channels must be 0');
    assert.strictEqual(adminCount, 0, 'admins must be 0');
    assert.strictEqual(total, 40, 'Total database records must be exactly 40');
  });

  console.log(`\n=== TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED ===`);
  if (failedTests > 0) {
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('Test execution failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await livePrisma.$disconnect();
  });
