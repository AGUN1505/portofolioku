// scripts/test-phase5.2-unit.ts
// Phase 5.2 Unit Test Suite: 5 CMS Modules (Roles, Engineering Nodes, Domains, Pillars, Skills & Categories)
// In-Memory mock tests. Strictly no database connection.

import type { RoleRecord } from '../src/domain/entities/role-record';
import type { EngineeringNodeRecord } from '../src/domain/entities/engineering-node-record';
import type { DomainRecord } from '../src/domain/entities/domain-record';
import type { PillarRecord } from '../src/domain/entities/pillar-record';
import type { SkillCategoryRecord } from '../src/domain/entities/skill-category-record';
import type { SkillRecord } from '../src/domain/entities/skill-record';

import type {
  IRoleRepository,
  CreateRoleData,
  UpdateRoleData,
} from '../src/domain/repositories/role.repository';
import type {
  IEngineeringNodeRepository,
  CreateEngineeringNodeData,
  UpdateEngineeringNodeData,
} from '../src/domain/repositories/engineering-node.repository';
import type {
  IDomainRepository,
  CreateDomainData,
  UpdateDomainData,
} from '../src/domain/repositories/domain.repository';
import type {
  IPillarRepository,
  CreatePillarData,
  UpdatePillarData,
} from '../src/domain/repositories/pillar.repository';
import type {
  ISkillCategoryRepository,
  CreateSkillCategoryData,
  UpdateSkillCategoryData,
} from '../src/domain/repositories/skill-category.repository';
import type {
  ISkillRepository,
  CreateSkillData,
  UpdateSkillData,
} from '../src/domain/repositories/skill.repository';

// DTO imports
import {
  validateCreateRoleInput,
  validateUpdateRoleInput,
} from '../src/application/dtos/role.dto';
import {
  validateCreateEngineeringNodeInput,
  validateUpdateEngineeringNodeInput,
} from '../src/application/dtos/engineering-node.dto';
import {
  validateCreateDomainInput,
  validateUpdateDomainInput,
} from '../src/application/dtos/domain.dto';
import {
  validateCreatePillarInput,
  validateUpdatePillarInput,
} from '../src/application/dtos/pillar.dto';
import {
  validateCreateSkillCategoryInput,
  validateUpdateSkillCategoryInput,
} from '../src/application/dtos/skill-category.dto';
import {
  validateCreateSkillInput,
  validateUpdateSkillInput,
} from '../src/application/dtos/skill.dto';

// Use cases: Roles (6)
import { GetRolesUseCase } from '../src/application/use-cases/roles/get-roles.use-case';
import { GetRoleByIdUseCase } from '../src/application/use-cases/roles/get-role-by-id.use-case';
import { CreateRoleUseCase } from '../src/application/use-cases/roles/create-role.use-case';
import { UpdateRoleUseCase } from '../src/application/use-cases/roles/update-role.use-case';
import { DeleteRoleUseCase } from '../src/application/use-cases/roles/delete-role.use-case';
import { ReorderRolesUseCase } from '../src/application/use-cases/roles/reorder-roles.use-case';

// Use cases: Engineering Nodes (6)
import { GetEngineeringNodesUseCase } from '../src/application/use-cases/engineering-nodes/get-engineering-nodes.use-case';
import { GetEngineeringNodeByIdUseCase } from '../src/application/use-cases/engineering-nodes/get-engineering-node-by-id.use-case';
import { CreateEngineeringNodeUseCase } from '../src/application/use-cases/engineering-nodes/create-engineering-node.use-case';
import { UpdateEngineeringNodeUseCase } from '../src/application/use-cases/engineering-nodes/update-engineering-node.use-case';
import { DeleteEngineeringNodeUseCase } from '../src/application/use-cases/engineering-nodes/delete-engineering-node.use-case';
import { ReorderEngineeringNodesUseCase } from '../src/application/use-cases/engineering-nodes/reorder-engineering-nodes.use-case';

// Use cases: Domains (6)
import { GetDomainsUseCase } from '../src/application/use-cases/domains/get-domains.use-case';
import { GetDomainByIdUseCase } from '../src/application/use-cases/domains/get-domain-by-id.use-case';
import { CreateDomainUseCase } from '../src/application/use-cases/domains/create-domain.use-case';
import { UpdateDomainUseCase } from '../src/application/use-cases/domains/update-domain.use-case';
import { DeleteDomainUseCase } from '../src/application/use-cases/domains/delete-domain.use-case';
import { ReorderDomainsUseCase } from '../src/application/use-cases/domains/reorder-domains.use-case';

// Use cases: Pillars (6)
import { GetPillarsUseCase } from '../src/application/use-cases/pillars/get-pillars.use-case';
import { GetPillarByIdUseCase } from '../src/application/use-cases/pillars/get-pillar-by-id.use-case';
import { CreatePillarUseCase } from '../src/application/use-cases/pillars/create-pillar.use-case';
import { UpdatePillarUseCase } from '../src/application/use-cases/pillars/update-pillar.use-case';
import { DeletePillarUseCase } from '../src/application/use-cases/pillars/delete-pillar.use-case';
import { ReorderPillarsUseCase } from '../src/application/use-cases/pillars/reorder-pillars.use-case';

// Use cases: Skill Categories (5)
import { GetSkillCategoriesUseCase } from '../src/application/use-cases/skills/get-skill-categories.use-case';
import { CreateSkillCategoryUseCase } from '../src/application/use-cases/skills/create-skill-category.use-case';
import { UpdateSkillCategoryUseCase } from '../src/application/use-cases/skills/update-skill-category.use-case';
import { DeleteSkillCategoryUseCase } from '../src/application/use-cases/skills/delete-skill-category.use-case';
import { ReorderSkillCategoriesUseCase } from '../src/application/use-cases/skills/reorder-skill-categories.use-case';

// Use cases: Skills (4)
import { CreateSkillUseCase } from '../src/application/use-cases/skills/create-skill.use-case';
import { UpdateSkillUseCase } from '../src/application/use-cases/skills/update-skill.use-case';
import { DeleteSkillUseCase } from '../src/application/use-cases/skills/delete-skill.use-case';
import { ReorderSkillsUseCase } from '../src/application/use-cases/skills/reorder-skills.use-case';

// -------------------------------------------------------------
// Test Runner Harness
// -------------------------------------------------------------
let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passedCount++;
    console.log(`  ✓ ${testName}`);
  } else {
    failedCount++;
    console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
  }
}

// -------------------------------------------------------------
// In-Memory Mock Repositories
// -------------------------------------------------------------

class MockRoleRepository implements IRoleRepository {
  public records: RoleRecord[] = [];
  private counter = 1;

  async getAll(): Promise<RoleRecord[]> {
    return [...this.records].sort((a, b) => a.order - b.order);
  }

  async getById(id: string): Promise<RoleRecord | null> {
    const r = this.records.find((rec) => rec.id === id);
    return r ? { ...r } : null;
  }

  async create(data: CreateRoleData): Promise<RoleRecord> {
    const id = `role_${String(this.counter++).padStart(2, '0')}`;
    const now = new Date();
    const newRecord: RoleRecord = {
      id,
      title: data.title,
      primary: data.primary ?? false,
      order: data.order ?? (this.records.length > 0 ? Math.max(...this.records.map((r) => r.order)) + 1 : 1),
      createdAt: now,
      updatedAt: now,
    };
    this.records.push(newRecord);
    return { ...newRecord };
  }

  async update(id: string, data: UpdateRoleData): Promise<RoleRecord> {
    const idx = this.records.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error(`Role ${id} not found`);
    const current = this.records[idx];
    const updated: RoleRecord = {
      ...current,
      title: data.title !== undefined ? data.title : current.title,
      primary: data.primary !== undefined ? data.primary : current.primary,
      order: data.order !== undefined ? data.order : current.order,
      updatedAt: new Date(),
    };
    this.records[idx] = updated;
    return { ...updated };
  }

  async delete(id: string): Promise<void> {
    this.records = this.records.filter((r) => r.id !== id);
  }

  async reorder(orderedIds: string[]): Promise<void> {
    orderedIds.forEach((id, index) => {
      const rec = this.records.find((r) => r.id === id);
      if (rec) {
        (rec as { order: number }).order = index + 1;
      }
    });
  }
}

class MockEngineeringNodeRepository implements IEngineeringNodeRepository {
  public records: EngineeringNodeRecord[] = [];
  private counter = 1;

  async getAll(): Promise<EngineeringNodeRecord[]> {
    return [...this.records].sort((a, b) => a.order - b.order);
  }

  async getById(id: string): Promise<EngineeringNodeRecord | null> {
    const n = this.records.find((rec) => rec.id === id);
    return n ? { ...n } : null;
  }

  async create(data: CreateEngineeringNodeData): Promise<EngineeringNodeRecord> {
    const id = `node_${String(this.counter++).padStart(2, '0')}`;
    const now = new Date();
    const newRecord: EngineeringNodeRecord = {
      id,
      tag: data.tag,
      title: data.title,
      description: data.description,
      stack: data.stack ?? null,
      highlighted: data.highlighted ?? false,
      order: data.order ?? (this.records.length > 0 ? Math.max(...this.records.map((r) => r.order)) + 1 : 1),
      createdAt: now,
      updatedAt: now,
    };
    this.records.push(newRecord);
    return { ...newRecord };
  }

  async update(id: string, data: UpdateEngineeringNodeData): Promise<EngineeringNodeRecord> {
    const idx = this.records.findIndex((n) => n.id === id);
    if (idx === -1) throw new Error(`EngineeringNode ${id} not found`);
    const current = this.records[idx];
    const updated: EngineeringNodeRecord = {
      ...current,
      tag: data.tag !== undefined ? data.tag : current.tag,
      title: data.title !== undefined ? data.title : current.title,
      description: data.description !== undefined ? data.description : current.description,
      stack: data.stack !== undefined ? data.stack : current.stack,
      highlighted: data.highlighted !== undefined ? data.highlighted : current.highlighted,
      order: data.order !== undefined ? data.order : current.order,
      updatedAt: new Date(),
    };
    this.records[idx] = updated;
    return { ...updated };
  }

  async delete(id: string): Promise<void> {
    this.records = this.records.filter((n) => n.id !== id);
  }

  async reorder(orderedIds: string[]): Promise<void> {
    orderedIds.forEach((id, index) => {
      const rec = this.records.find((n) => n.id === id);
      if (rec) {
        (rec as { order: number }).order = index + 1;
      }
    });
  }
}

class MockDomainRepository implements IDomainRepository {
  public records: DomainRecord[] = [];
  private counter = 1;

  async getAll(): Promise<DomainRecord[]> {
    return [...this.records].sort((a, b) => a.order - b.order);
  }

  async getById(id: string): Promise<DomainRecord | null> {
    const d = this.records.find((rec) => rec.id === id);
    return d ? { ...d } : null;
  }

  async create(data: CreateDomainData): Promise<DomainRecord> {
    const id = `domain_${String(this.counter++).padStart(2, '0')}`;
    const now = new Date();
    const newRecord: DomainRecord = {
      id,
      index: data.index,
      title: data.title,
      order: data.order ?? (this.records.length > 0 ? Math.max(...this.records.map((r) => r.order)) + 1 : 1),
      createdAt: now,
      updatedAt: now,
    };
    this.records.push(newRecord);
    return { ...newRecord };
  }

  async update(id: string, data: UpdateDomainData): Promise<DomainRecord> {
    const idx = this.records.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error(`Domain ${id} not found`);
    const current = this.records[idx];
    const updated: DomainRecord = {
      ...current,
      index: data.index !== undefined ? data.index : current.index,
      title: data.title !== undefined ? data.title : current.title,
      order: data.order !== undefined ? data.order : current.order,
      updatedAt: new Date(),
    };
    this.records[idx] = updated;
    return { ...updated };
  }

  async delete(id: string): Promise<void> {
    this.records = this.records.filter((d) => d.id !== id);
  }

  async reorder(orderedIds: string[]): Promise<void> {
    orderedIds.forEach((id, index) => {
      const rec = this.records.find((d) => d.id === id);
      if (rec) {
        (rec as { order: number }).order = index + 1;
      }
    });
  }
}

class MockPillarRepository implements IPillarRepository {
  public records: PillarRecord[] = [];
  private counter = 1;

  async getAll(): Promise<PillarRecord[]> {
    return [...this.records].sort((a, b) => a.order - b.order);
  }

  async getById(id: string): Promise<PillarRecord | null> {
    const p = this.records.find((rec) => rec.id === id);
    return p ? { ...p } : null;
  }

  async create(data: CreatePillarData): Promise<PillarRecord> {
    const id = `pillar_${String(this.counter++).padStart(2, '0')}`;
    const now = new Date();
    const newRecord: PillarRecord = {
      id,
      index: data.index,
      title: data.title,
      description: data.description,
      order: data.order ?? (this.records.length > 0 ? Math.max(...this.records.map((r) => r.order)) + 1 : 1),
      createdAt: now,
      updatedAt: now,
    };
    this.records.push(newRecord);
    return { ...newRecord };
  }

  async update(id: string, data: UpdatePillarData): Promise<PillarRecord> {
    const idx = this.records.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error(`Pillar ${id} not found`);
    const current = this.records[idx];
    const updated: PillarRecord = {
      ...current,
      index: data.index !== undefined ? data.index : current.index,
      title: data.title !== undefined ? data.title : current.title,
      description: data.description !== undefined ? data.description : current.description,
      order: data.order !== undefined ? data.order : current.order,
      updatedAt: new Date(),
    };
    this.records[idx] = updated;
    return { ...updated };
  }

  async delete(id: string): Promise<void> {
    this.records = this.records.filter((p) => p.id !== id);
  }

  async reorder(orderedIds: string[]): Promise<void> {
    orderedIds.forEach((id, index) => {
      const rec = this.records.find((p) => p.id === id);
      if (rec) {
        (rec as { order: number }).order = index + 1;
      }
    });
  }
}

class MockSkillCategoryRepository implements ISkillCategoryRepository {
  public records: SkillCategoryRecord[] = [];
  private counter = 1;

  async getAll(): Promise<SkillCategoryRecord[]> {
    return [...this.records].sort((a, b) => a.order - b.order);
  }

  async getById(id: string): Promise<SkillCategoryRecord | null> {
    const c = this.records.find((rec) => rec.id === id);
    return c ? { ...c } : null;
  }

  async create(data: CreateSkillCategoryData): Promise<SkillCategoryRecord> {
    const id = `cat_${String(this.counter++).padStart(2, '0')}`;
    const now = new Date();
    const newRecord: SkillCategoryRecord = {
      id,
      title: data.title,
      order: data.order ?? (this.records.length > 0 ? Math.max(...this.records.map((r) => r.order)) + 1 : 1),
      createdAt: now,
      updatedAt: now,
    };
    this.records.push(newRecord);
    return { ...newRecord };
  }

  async update(id: string, data: UpdateSkillCategoryData): Promise<SkillCategoryRecord> {
    const idx = this.records.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error(`SkillCategory ${id} not found`);
    const current = this.records[idx];
    const updated: SkillCategoryRecord = {
      ...current,
      title: data.title !== undefined ? data.title : current.title,
      order: data.order !== undefined ? data.order : current.order,
      updatedAt: new Date(),
    };
    this.records[idx] = updated;
    return { ...updated };
  }

  async delete(id: string): Promise<void> {
    this.records = this.records.filter((c) => c.id !== id);
  }

  async reorder(orderedIds: string[]): Promise<void> {
    orderedIds.forEach((id, index) => {
      const rec = this.records.find((c) => c.id === id);
      if (rec) {
        (rec as { order: number }).order = index + 1;
      }
    });
  }
}

class MockSkillRepository implements ISkillRepository {
  public records: SkillRecord[] = [];
  public deleteCallsCount = 0;
  private counter = 1;

  async getAll(): Promise<SkillRecord[]> {
    return [...this.records].sort((a, b) => a.order - b.order);
  }

  async getByCategoryId(categoryId: string): Promise<SkillRecord[]> {
    return this.records
      .filter((s) => s.categoryId === categoryId)
      .sort((a, b) => a.order - b.order);
  }

  async countByCategoryId(categoryId: string): Promise<number> {
    return this.records.filter((s) => s.categoryId === categoryId).length;
  }

  async getById(id: string): Promise<SkillRecord | null> {
    const s = this.records.find((rec) => rec.id === id);
    return s ? { ...s } : null;
  }

  async create(data: CreateSkillData): Promise<SkillRecord> {
    const id = `skill_${String(this.counter++).padStart(2, '0')}`;
    const now = new Date();
    const catRecords = this.records.filter((r) => r.categoryId === data.categoryId);
    const order = data.order ?? (catRecords.length > 0 ? Math.max(...catRecords.map((r) => r.order)) + 1 : 1);
    const newRecord: SkillRecord = {
      id,
      name: data.name,
      categoryId: data.categoryId,
      order,
      createdAt: now,
      updatedAt: now,
    };
    this.records.push(newRecord);
    return { ...newRecord };
  }

  async update(id: string, data: UpdateSkillData): Promise<SkillRecord> {
    const idx = this.records.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error(`Skill ${id} not found`);
    const current = this.records[idx];
    const isRelocation = data.categoryId !== undefined && data.categoryId !== current.categoryId;
    let order = data.order !== undefined ? data.order : current.order;
    if (isRelocation && data.order === undefined) {
      const targetSkills = this.records.filter((s) => s.categoryId === data.categoryId);
      order = targetSkills.length > 0 ? Math.max(...targetSkills.map((s) => s.order)) + 1 : 1;
    }
    const updated: SkillRecord = {
      ...current,
      name: data.name !== undefined ? data.name : current.name,
      categoryId: data.categoryId !== undefined ? data.categoryId : current.categoryId,
      order,
      updatedAt: new Date(),
    };
    this.records[idx] = updated;
    return { ...updated };
  }

  async delete(id: string): Promise<void> {
    this.deleteCallsCount++;
    this.records = this.records.filter((s) => s.id !== id);
  }

  async reorder(categoryId: string, orderedIds: string[]): Promise<void> {
    orderedIds.forEach((id, index) => {
      const rec = this.records.find((s) => s.id === id && s.categoryId === categoryId);
      if (rec) {
        (rec as { order: number }).order = index + 1;
      }
    });
  }
}

// -------------------------------------------------------------
// Test Execution
// -------------------------------------------------------------
async function runAllTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING PHASE 5.2 UNIT TESTS (ALL 33 USE CASES)');
  console.log('======================================================\n');

  // =========================================================
  // Section 1: DTO Validation Tests
  // =========================================================
  console.log('--- 1. DTO Validation: Roles ---');
  {
    const v1 = validateCreateRoleInput({ title: 'Full Stack Engineer', primary: true });
    assert(v1.success === true && v1.data.title === 'Full Stack Engineer' && v1.data.primary === true, 'Valid create role payload');

    const v2 = validateCreateRoleInput({ title: '   ', primary: true });
    assert(v2.success === false && 'title' in v2.errors, 'Rejects empty title for role');

    const v3 = validateCreateRoleInput({ title: 'Dev', id: 'fake_id', createdAt: new Date() });
    assert(v3.success === false && 'id' in v3.errors, 'Rejects system-managed keys in create role');

    const v4 = validateCreateRoleInput({ title: 'Dev', unknownField: 123 });
    assert(v4.success === false && 'unknownField' in v4.errors, 'Rejects unknown keys in create role');

    const v5 = validateUpdateRoleInput({});
    assert(v5.success === false && '_general' in v5.errors, 'Rejects empty update role payload');

    const v6 = validateUpdateRoleInput({ primary: false });
    assert(v6.success === true && v6.data.primary === false, 'Accepts partial update with boolean primary');
  }

  console.log('\n--- 2. DTO Validation: Engineering Nodes ---');
  {
    const v1 = validateCreateEngineeringNodeInput({
      tag: 'BACKEND',
      title: 'Distributed Systems',
      description: 'Designing fault-tolerant microservices',
      stack: 'Go, PostgreSQL, Kafka',
      highlighted: true,
    });
    assert(v1.success === true && v1.data.stack === 'Go, PostgreSQL, Kafka', 'Valid create engineering node payload');

    // Nullable stack
    const v2 = validateCreateEngineeringNodeInput({
      tag: 'ARCH',
      title: 'System Design',
      description: 'High level architecture',
      stack: null,
    });
    assert(v2.success === true && v2.data.stack === null, 'Preserves explicit null for stack');

    const v3 = validateCreateEngineeringNodeInput({ tag: '', title: 'Title', description: 'Desc' });
    assert(v3.success === false && 'tag' in v3.errors, 'Rejects empty tag');

    const v4 = validateCreateEngineeringNodeInput({ tag: 'TAG', title: 'T', description: 'D', id: 'sys_id' });
    assert(v4.success === false && 'id' in v4.errors, 'Rejects system keys in engineering node');

    const v5 = validateUpdateEngineeringNodeInput({ stack: null });
    assert(v5.success === true && v5.data.stack === null, 'Accepts explicit null in update engineering node');
  }

  console.log('\n--- 3. DTO Validation: Domains ---');
  {
    const v1 = validateCreateDomainInput({ index: '01', title: 'Fintech Solutions' });
    assert(v1.success === true && v1.data.index === '01', 'Valid create domain payload');

    const v2 = validateCreateDomainInput({ index: '', title: 'Title' });
    assert(v2.success === false && 'index' in v2.errors, 'Rejects empty index in domain');

    const v3 = validateCreateDomainInput({ index: '01', title: 'T', order: -5 });
    assert(v3.success === false && 'order' in v3.errors, 'Rejects negative order in domain');

    const v4 = validateUpdateDomainInput({ title: 'New Domain' });
    assert(v4.success === true && v4.data.title === 'New Domain', 'Accepts valid update domain payload');
  }

  console.log('\n--- 4. DTO Validation: Pillars ---');
  {
    const v1 = validateCreatePillarInput({ index: '01', title: 'Scalability', description: 'Horizontal scale' });
    assert(v1.success === true && v1.data.description === 'Horizontal scale', 'Valid create pillar payload');

    const v2 = validateCreatePillarInput({ index: '01', title: 'Title', description: '' });
    assert(v2.success === false && 'description' in v2.errors, 'Rejects empty description in pillar');

    const v3 = validateUpdatePillarInput({ description: 'New description' });
    assert(v3.success === true && v3.data.description === 'New description', 'Accepts valid update pillar payload');
  }

  console.log('\n--- 5. DTO Validation: Skill Categories ---');
  {
    const v1 = validateCreateSkillCategoryInput({ title: 'Languages' });
    assert(v1.success === true && v1.data.title === 'Languages', 'Valid create skill category payload');

    const v2 = validateCreateSkillCategoryInput({ title: 'Cat', id: 'cat_id' });
    assert(v2.success === false && 'id' in v2.errors, 'Rejects system keys in skill category');

    const v3 = validateUpdateSkillCategoryInput({ title: 'New Cat Title' });
    assert(v3.success === true && v3.data.title === 'New Cat Title', 'Accepts valid update skill category payload');
  }

  console.log('\n--- 6. DTO Validation: Skills ---');
  {
    const v1 = validateCreateSkillInput({ name: 'TypeScript', categoryId: 'cat_01' });
    assert(v1.success === true && v1.data.name === 'TypeScript' && v1.data.categoryId === 'cat_01', 'Valid create skill payload');

    const v2 = validateCreateSkillInput({ name: 'TypeScript', categoryId: '' });
    assert(v2.success === false && 'categoryId' in v2.errors, 'Rejects empty categoryId in skill');

    const v3 = validateCreateSkillInput({ name: '', categoryId: 'cat_01' });
    assert(v3.success === false && 'name' in v3.errors, 'Rejects empty name in skill');

    const v4 = validateUpdateSkillInput({ name: 'New Skill Name' });
    assert(v4.success === true && v4.data.name === 'New Skill Name', 'Accepts valid update skill payload');
  }

  // =========================================================
  // Section 2: Use Cases — Roles (6 use cases)
  // =========================================================
  console.log('\n--- 7. Use Cases: Roles (6 use cases) ---');
  {
    const roleRepo = new MockRoleRepository();
    const getRoles = new GetRolesUseCase(roleRepo);
    const getRoleById = new GetRoleByIdUseCase(roleRepo);
    const createRole = new CreateRoleUseCase(roleRepo);
    const updateRole = new UpdateRoleUseCase(roleRepo);
    const deleteRole = new DeleteRoleUseCase(roleRepo);
    const reorderRoles = new ReorderRolesUseCase(roleRepo);

    // 1. Create with auto order
    const c1 = await createRole.execute({ title: 'Software Engineer', primary: true });
    assert(c1.success === true && c1.data?.order === 1, 'CreateRoleUseCase assigns order = 1 when first');

    const c2 = await createRole.execute({ title: 'Backend Developer', primary: true });
    assert(c2.success === true && c2.data?.order === 2, 'CreateRoleUseCase auto-increments order to 2');

    // Multiple primary roles are permitted
    const all = await getRoles.execute();
    assert(all.length === 2 && all.filter((r) => r.primary).length === 2, 'Allows multiple primary roles without restriction');

    // 2. Get by ID
    const byId = await getRoleById.execute(c1.data!.id);
    assert(byId !== null && byId.title === 'Software Engineer', 'GetRoleByIdUseCase returns correct role');

    // 3. Update
    const u1 = await updateRole.execute(c1.data!.id, { title: 'Senior Software Engineer' });
    assert(u1.success === true && u1.data?.title === 'Senior Software Engineer', 'UpdateRoleUseCase updates title');

    // 4. Update nonexistent
    const uErr = await updateRole.execute('nonexistent', { title: 'Ghost' });
    assert(uErr.success === false && uErr.error === 'Role not found', 'UpdateRoleUseCase returns error for nonexistent ID');

    // 5. Reorder
    const rReorder = await reorderRoles.execute([c2.data!.id, c1.data!.id]);
    assert(rReorder.success === true, 'ReorderRolesUseCase succeeds with complete collection');
    const reorderedList = await getRoles.execute();
    assert(reorderedList[0].id === c2.data!.id && reorderedList[0].order === 1, 'ReorderRolesUseCase updates order sequentially');

    // Reorder rejects duplicate
    const rDup = await reorderRoles.execute([c2.data!.id, c2.data!.id]);
    assert(rDup.success === false, 'ReorderRolesUseCase rejects duplicate IDs');

    // Reorder rejects missing count
    const rMiss = await reorderRoles.execute([c2.data!.id]);
    assert(rMiss.success === false, 'ReorderRolesUseCase rejects incomplete collection');

    // Reorder rejects unknown ID
    const rUnk = await reorderRoles.execute([c2.data!.id, 'unknown_id']);
    assert(rUnk.success === false, 'ReorderRolesUseCase rejects unknown IDs');

    // 6. Delete
    const d1 = await deleteRole.execute(c1.data!.id);
    assert(d1.success === true, 'DeleteRoleUseCase deletes role');
    const remaining = await getRoles.execute();
    assert(remaining.length === 1, 'Role collection count decremented after delete');

    // Delete nonexistent
    const dErr = await deleteRole.execute('nonexistent');
    assert(dErr.success === false && dErr.error === 'Role not found', 'DeleteRoleUseCase returns error on missing role');
  }

  // =========================================================
  // Section 3: Use Cases — Engineering Nodes (6 use cases)
  // =========================================================
  console.log('\n--- 8. Use Cases: Engineering Nodes (6 use cases) ---');
  {
    const nodeRepo = new MockEngineeringNodeRepository();
    const getNodes = new GetEngineeringNodesUseCase(nodeRepo);
    const getNodeById = new GetEngineeringNodeByIdUseCase(nodeRepo);
    const createNode = new CreateEngineeringNodeUseCase(nodeRepo);
    const updateNode = new UpdateEngineeringNodeUseCase(nodeRepo);
    const deleteNode = new DeleteEngineeringNodeUseCase(nodeRepo);
    const reorderNodes = new ReorderEngineeringNodesUseCase(nodeRepo);

    // 1. Create with stack & highlighted
    const c1 = await createNode.execute({
      tag: 'BACKEND',
      title: 'Backend Systems',
      description: 'Distributed services',
      stack: 'Go, PostgreSQL',
      highlighted: true,
    });
    assert(c1.success === true && c1.data?.order === 1 && c1.data?.stack === 'Go, PostgreSQL', 'CreateEngineeringNodeUseCase creates node with stack');

    const c2 = await createNode.execute({
      tag: 'DEVOPS',
      title: 'Cloud Infra',
      description: 'K8s and CI/CD',
      stack: null,
      highlighted: false,
    });
    assert(c2.success === true && c2.data?.order === 2 && c2.data?.stack === null, 'CreateEngineeringNodeUseCase supports null stack');

    // 2. GetById
    const fetched = await getNodeById.execute(c1.data!.id);
    assert(fetched !== null && fetched.tag === 'BACKEND', 'GetEngineeringNodeByIdUseCase retrieves node');

    // 3. Update nullable stack
    const u1 = await updateNode.execute(c1.data!.id, { stack: null });
    assert(u1.success === true && u1.data?.stack === null, 'UpdateEngineeringNodeUseCase allows setting stack to null');

    // 4. Reorder
    const r1 = await reorderNodes.execute([c2.data!.id, c1.data!.id]);
    assert(r1.success === true, 'ReorderEngineeringNodesUseCase succeeds');
    const list = await getNodes.execute();
    assert(list[0].id === c2.data!.id && list[0].order === 1, 'ReorderEngineeringNodesUseCase normalizes order');

    // 5. Delete
    const d1 = await deleteNode.execute(c1.data!.id);
    assert(d1.success === true, 'DeleteEngineeringNodeUseCase deletes node');
    const afterDel = await getNodes.execute();
    assert(afterDel.length === 1, 'Node deleted from repository');
  }

  // =========================================================
  // Section 4: Use Cases — Domains (6 use cases)
  // =========================================================
  console.log('\n--- 9. Use Cases: Domains (6 use cases) ---');
  {
    const domainRepo = new MockDomainRepository();
    const getDomains = new GetDomainsUseCase(domainRepo);
    const getDomainById = new GetDomainByIdUseCase(domainRepo);
    const createDomain = new CreateDomainUseCase(domainRepo);
    const updateDomain = new UpdateDomainUseCase(domainRepo);
    const deleteDomain = new DeleteDomainUseCase(domainRepo);
    const reorderDomains = new ReorderDomainsUseCase(domainRepo);

    // 1. Create with index preservation
    const c1 = await createDomain.execute({ index: '01', title: 'Fintech Systems' });
    const c2 = await createDomain.execute({ index: '02', title: 'EdTech Systems' });
    assert(c1.success === true && c2.success === true, 'CreateDomainUseCase creates domains with custom string index');

    // 2. GetById
    const byId = await getDomainById.execute(c1.data!.id);
    assert(byId?.index === '01' && byId.title === 'Fintech Systems', 'GetDomainByIdUseCase retrieves domain');

    // 3. Update
    const u1 = await updateDomain.execute(c1.data!.id, { title: 'Financial Technology' });
    assert(u1.success === true && u1.data?.title === 'Financial Technology', 'UpdateDomainUseCase updates domain');

    // 4. Reorder preserves string index
    const r1 = await reorderDomains.execute([c2.data!.id, c1.data!.id]);
    assert(r1.success === true, 'ReorderDomainsUseCase reorders successfully');
    const list = await getDomains.execute();
    assert(list[0].id === c2.data!.id && list[0].index === '02', 'ReorderDomainsUseCase strictly preserves index strings');

    // 5. Delete
    const d1 = await deleteDomain.execute(c1.data!.id);
    assert(d1.success === true, 'DeleteDomainUseCase removes domain');
    assert((await getDomains.execute()).length === 1, 'Domain count decremented');
  }

  // =========================================================
  // Section 5: Use Cases — Pillars (6 use cases)
  // =========================================================
  console.log('\n--- 10. Use Cases: Pillars (6 use cases) ---');
  {
    const pillarRepo = new MockPillarRepository();
    const getPillars = new GetPillarsUseCase(pillarRepo);
    const getPillarById = new GetPillarByIdUseCase(pillarRepo);
    const createPillar = new CreatePillarUseCase(pillarRepo);
    const updatePillar = new UpdatePillarUseCase(pillarRepo);
    const deletePillar = new DeletePillarUseCase(pillarRepo);
    const reorderPillars = new ReorderPillarsUseCase(pillarRepo);

    // 1. Create with index & description
    const c1 = await createPillar.execute({ index: '01', title: 'Scalability', description: 'Handles high traffic' });
    const c2 = await createPillar.execute({ index: '02', title: 'Maintainability', description: 'Clean architecture' });
    assert(c1.success === true && c2.success === true, 'CreatePillarUseCase creates pillars');

    // 2. GetById
    const byId = await getPillarById.execute(c1.data!.id);
    assert(byId?.title === 'Scalability', 'GetPillarByIdUseCase returns pillar');

    // 3. Update
    const u1 = await updatePillar.execute(c1.data!.id, { description: 'Handles 100k req/sec' });
    assert(u1.success === true && u1.data?.description === 'Handles 100k req/sec', 'UpdatePillarUseCase updates description');

    // 4. Reorder
    const r1 = await reorderPillars.execute([c2.data!.id, c1.data!.id]);
    assert(r1.success === true, 'ReorderPillarsUseCase reorders successfully');
    const list = await getPillars.execute();
    assert(list[0].id === c2.data!.id && list[0].index === '02', 'ReorderPillarsUseCase strictly preserves index string');

    // 5. Delete
    const d1 = await deletePillar.execute(c1.data!.id);
    assert(d1.success === true, 'DeletePillarUseCase deletes pillar');
    assert((await getPillars.execute()).length === 1, 'Pillar count decremented');
  }

  // =========================================================
  // Section 6: Use Cases — Skill Categories (5 use cases & CASCADE PROTECTION)
  // =========================================================
  console.log('\n--- 11. Use Cases: Skill Categories (5 use cases & Cascade Protection) ---');
  {
    const catRepo = new MockSkillCategoryRepository();
    const skillRepo = new MockSkillRepository();

    const getCategories = new GetSkillCategoriesUseCase(catRepo);
    const createCategory = new CreateSkillCategoryUseCase(catRepo);
    const updateCategory = new UpdateSkillCategoryUseCase(catRepo);
    const deleteCategory = new DeleteSkillCategoryUseCase(catRepo, skillRepo);
    const reorderCategories = new ReorderSkillCategoriesUseCase(catRepo);

    // 1. Create Categories
    const c1 = await createCategory.execute({ title: 'Languages' });
    const c2 = await createCategory.execute({ title: 'Frameworks' });
    assert(c1.success === true && c2.success === true, 'CreateSkillCategoryUseCase creates categories');
    assert(c1.data?.order === 1 && c2.data?.order === 2, 'CreateSkillCategoryUseCase assigns auto order 1 and 2');

    // 2. Update Category
    const u1 = await updateCategory.execute(c1.data!.id, { title: 'Programming Languages' });
    assert(u1.success === true && u1.data?.title === 'Programming Languages', 'UpdateSkillCategoryUseCase updates title');

    // 3. Reorder Categories
    const r1 = await reorderCategories.execute([c2.data!.id, c1.data!.id]);
    assert(r1.success === true, 'ReorderSkillCategoriesUseCase reorders categories');
    const catList = await getCategories.execute();
    assert(catList[0].id === c2.data!.id && catList[0].order === 1, 'ReorderSkillCategoriesUseCase normalizes order');

    // 4. CASCADE PROTECTION TESTS
    // Populate mock child skills
    await skillRepo.create({ name: 'Go', categoryId: c1.data!.id, order: 1 });
    await skillRepo.create({ name: 'TypeScript', categoryId: c1.data!.id, order: 2 });
    await skillRepo.create({ name: 'PHP', categoryId: c1.data!.id, order: 3 });

    // Test A: Delete nonexistent category
    const dNonexistent = await deleteCategory.execute('nonexistent');
    assert(dNonexistent.success === false && dNonexistent.error === 'Skill category not found', 'DeleteSkillCategoryUseCase returns error for nonexistent category');

    // Test B: Delete category without confirmation -> REJECTED & IMPACT RETURNED
    const dUnconfirmed = await deleteCategory.execute(c1.data!.id, false);
    assert(dUnconfirmed.success === false, 'DeleteSkillCategoryUseCase rejects unconfirmed deletion');
    assert(dUnconfirmed.requiresConfirmation === true, 'Requires confirmation flag set to true');
    assert(dUnconfirmed.affectedSkillCount === 3, 'Reports exact count of 3 affected child skills');
    assert(catRepo.records.length === 2, 'Category was NOT deleted from repository without confirmation');
    assert(skillRepo.deleteCallsCount === 0, 'Repository delete was NOT called without confirmation');

    // Test C: Category with 0 child skills without confirmation -> STILL requires confirmation
    const dEmptyUnconfirmed = await deleteCategory.execute(c2.data!.id);
    assert(dEmptyUnconfirmed.success === false && dEmptyUnconfirmed.requiresConfirmation === true && dEmptyUnconfirmed.affectedSkillCount === 0, 'Empty category also reports 0 child skills and requires explicit confirmation');

    // Test D1: Confirmed deletion without expectedChildCount -> FAILS CLOSED
    const dMissingCount = await deleteCategory.execute(c1.data!.id, true);
    assert(dMissingCount.success === false && Boolean(dMissingCount.error?.includes('Expected child skill count')), 'Confirmed deletion without expectedChildCount fails closed');

    // Test D2: Confirmed deletion with expectedChildCount -> DELEGATES TO REPOSITORY
    const dConfirmed = await deleteCategory.execute(c1.data!.id, true, 3);
    assert(dConfirmed.success === true, 'DeleteSkillCategoryUseCase succeeds when confirmed === true and expectedChildCount matches');
    assert(dConfirmed.affectedSkillCount === 3, 'Returns metadata of 3 affected child skills');
    assert(catRepo.records.find((c) => c.id === c1.data!.id) === undefined, 'Category deleted from repository');
  }

  // =========================================================
  // Section 7: Use Cases — Skills (4 use cases)
  // =========================================================
  console.log('\n--- 12. Use Cases: Skills (4 use cases) ---');
  {
    const catRepo = new MockSkillCategoryRepository();
    const skillRepo = new MockSkillRepository();

    const cat1 = await catRepo.create({ title: 'Languages', order: 1 });
    const cat2 = await catRepo.create({ title: 'Databases', order: 2 });

    const createSkill = new CreateSkillUseCase(skillRepo, catRepo);
    const updateSkill = new UpdateSkillUseCase(skillRepo, catRepo);
    const deleteSkill = new DeleteSkillUseCase(skillRepo);
    const reorderSkills = new ReorderSkillsUseCase(skillRepo, catRepo);

    // 1. Create skill with valid category
    const s1 = await createSkill.execute({ name: 'Go', categoryId: cat1.id });
    const s2 = await createSkill.execute({ name: 'TypeScript', categoryId: cat1.id });
    assert(s1.success === true && s1.data?.order === 1, 'CreateSkillUseCase assigns order 1 in category');
    assert(s2.success === true && s2.data?.order === 2, 'CreateSkillUseCase assigns order 2 in category');

    // Create skill in second category -> order starts from 1!
    const s3 = await createSkill.execute({ name: 'PostgreSQL', categoryId: cat2.id });
    assert(s3.success === true && s3.data?.order === 1, 'CreateSkillUseCase scopes auto-order strictly to target category (order = 1)');

    // Create skill with invalid category -> REJECTED
    const sErr = await createSkill.execute({ name: 'Rust', categoryId: 'nonexistent_cat' });
    assert(sErr.success === false && Boolean(sErr.error?.includes('not found')), 'CreateSkillUseCase rejects nonexistent category ID');

    // 2. Update skill without changing category
    const u1 = await updateSkill.execute(s1.data!.id, { name: 'Golang' });
    assert(u1.success === true && u1.data?.name === 'Golang', 'UpdateSkillUseCase updates skill name');

    // Update skill with category change -> moves to cat2 and gets order = 2 in cat2
    const uMove = await updateSkill.execute(s1.data!.id, { categoryId: cat2.id });
    assert(uMove.success === true && uMove.data?.categoryId === cat2.id && uMove.data?.order === 2, 'UpdateSkillUseCase moves skill across categories and calculates next order in target category');

    // Update skill with invalid target category -> REJECTED
    const uMoveErr = await updateSkill.execute(s1.data!.id, { categoryId: 'invalid_cat' });
    assert(uMoveErr.success === false && Boolean(uMoveErr.error?.includes('not found')), 'UpdateSkillUseCase rejects moving skill to nonexistent category');

    // 3. Reorder skills within cat2 (now contains s3: PostgreSQL and s1: Golang)
    const rSuccess = await reorderSkills.execute(cat2.id, [s1.data!.id, s3.data!.id]);
    assert(rSuccess.success === true, 'ReorderSkillsUseCase succeeds for skills within target category');

    const cat2Skills = await skillRepo.getByCategoryId(cat2.id);
    assert(cat2Skills[0].id === s1.data!.id && cat2Skills[0].order === 1, 'ReorderSkillsUseCase applies 1..N order sequence');

    // Reorder skills rejects skill from another category
    const rForeign = await reorderSkills.execute(cat2.id, [s1.data!.id, s2.data!.id]);
    assert(rForeign.success === false && Boolean(rForeign.error?.includes('does not belong')), 'ReorderSkillsUseCase rejects skills belonging to different category');

    // 4. Delete skill (safe deletion, does not delete parent category)
    const dSkill = await deleteSkill.execute(s2.data!.id);
    assert(dSkill.success === true, 'DeleteSkillUseCase deletes skill');
    assert((await skillRepo.getById(s2.data!.id)) === null, 'Skill removed from repository');
    assert((await catRepo.getById(cat1.id)) !== null, 'Parent category remains intact after skill deletion');
  }

  // =========================================================
  // Final Summary
  // =========================================================
  console.log('\n======================================================');
  console.log(`📊 PHASE 5.2 TEST SUMMARY:`);
  console.log(`   Passed: ${passedCount}`);
  console.log(`   Failed: ${failedCount}`);
  console.log(`   Total : ${passedCount + failedCount}`);
  console.log('======================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Unhandled test execution error:', err);
  process.exit(1);
});
