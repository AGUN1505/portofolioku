// scripts/test-phase4.2-unit.ts
// Comprehensive unit test suite for Stage 10.4 Phase 4.2: Domain & Application Layer.
// STRICT: Pure in-memory mock repositories only. ZERO database connection.

import * as assert from 'assert';
import type {
  IProjectRepository,
  CreateProjectData,
  UpdateProjectData,
} from '../src/domain/repositories/project.repository';
import type { ProjectRecord } from '../src/domain/entities/project-record';
import type {
  IExperienceRepository,
  CreateExperienceData,
  UpdateExperienceData,
} from '../src/domain/repositories/experience.repository';
import type { ExperienceRecord } from '../src/domain/entities/experience-record';

import {
  validateCreateProjectInput,
  validateUpdateProjectInput,
} from '../src/application/dtos/project.dto';
import {
  validateCreateExperienceInput,
  validateUpdateExperienceInput,
  parseStrictIsoDate,
} from '../src/application/dtos/experience.dto';

import { GetProjectsUseCase } from '../src/application/use-cases/projects/get-projects.use-case';
import { GetProjectByIdUseCase } from '../src/application/use-cases/projects/get-project-by-id.use-case';
import { CreateProjectUseCase } from '../src/application/use-cases/projects/create-project.use-case';
import { UpdateProjectUseCase } from '../src/application/use-cases/projects/update-project.use-case';
import { DeleteProjectUseCase } from '../src/application/use-cases/projects/delete-project.use-case';
import { ReorderProjectsUseCase } from '../src/application/use-cases/projects/reorder-projects.use-case';

import { GetExperiencesUseCase } from '../src/application/use-cases/experiences/get-experiences.use-case';
import { GetExperienceByIdUseCase } from '../src/application/use-cases/experiences/get-experience-by-id.use-case';
import { CreateExperienceUseCase } from '../src/application/use-cases/experiences/create-experience.use-case';
import { UpdateExperienceUseCase } from '../src/application/use-cases/experiences/update-experience.use-case';
import { DeleteExperienceUseCase } from '../src/application/use-cases/experiences/delete-experience.use-case';
import { ReorderExperiencesUseCase } from '../src/application/use-cases/experiences/reorder-experiences.use-case';

// -------------------------------------------------------------
// In-Memory Mock Repositories
// -------------------------------------------------------------

class MockProjectRepository implements IProjectRepository {
  public records: ProjectRecord[] = [];
  private idCounter = 1;

  async getAll(): Promise<ProjectRecord[]> {
    return [...this.records].sort((a, b) => a.order - b.order);
  }

  async getById(id: string): Promise<ProjectRecord | null> {
    const item = this.records.find((r) => r.id === id);
    return item ? { ...item } : null;
  }

  async create(data: CreateProjectData): Promise<ProjectRecord> {
    const id = `project_${String(this.idCounter++).padStart(2, '0')}`;
    const now = new Date();
    const newRecord: ProjectRecord = {
      id,
      title: data.title,
      category: data.category,
      description: data.description,
      technologies: [...data.technologies],
      thumbnailUrl: data.thumbnailUrl ?? null,
      projectUrl: data.projectUrl ?? null,
      githubUrl: data.githubUrl ?? null,
      published: data.published,
      publishedAt: data.publishedAt ?? null,
      order: data.order ?? (this.records.length > 0 ? Math.max(...this.records.map((r) => r.order)) + 1 : 1),
      createdAt: now,
      updatedAt: now,
    };
    this.records.push(newRecord);
    return { ...newRecord };
  }

  async update(id: string, data: UpdateProjectData): Promise<ProjectRecord> {
    const index = this.records.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error(`Project with ID ${id} not found`);
    }
    const current = this.records[index];
    const updated: ProjectRecord = {
      ...current,
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.technologies !== undefined ? { technologies: [...data.technologies] } : {}),
      ...(data.thumbnailUrl !== undefined ? { thumbnailUrl: data.thumbnailUrl } : {}),
      ...(data.projectUrl !== undefined ? { projectUrl: data.projectUrl } : {}),
      ...(data.githubUrl !== undefined ? { githubUrl: data.githubUrl } : {}),
      ...(data.published !== undefined ? { published: data.published } : {}),
      ...(data.publishedAt !== undefined ? { publishedAt: data.publishedAt } : {}),
      ...(data.order !== undefined ? { order: data.order } : {}),
      updatedAt: new Date(),
    };
    this.records[index] = updated;
    return { ...updated };
  }

  async delete(id: string): Promise<void> {
    const index = this.records.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error(`Project with ID ${id} not found`);
    }
    this.records.splice(index, 1);
  }

  async reorder(orderedIds: string[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i];
      const record = this.records.find((r) => r.id === id);
      if (record) {
        (record as { order: number }).order = i + 1;
      }
    }
  }
}

class MockExperienceRepository implements IExperienceRepository {
  public records: ExperienceRecord[] = [];
  private idCounter = 1;

  async getAll(): Promise<ExperienceRecord[]> {
    return [...this.records].sort((a, b) => a.order - b.order);
  }

  async getById(id: string): Promise<ExperienceRecord | null> {
    const item = this.records.find((r) => r.id === id);
    return item ? { ...item } : null;
  }

  async create(data: CreateExperienceData): Promise<ExperienceRecord> {
    const id = `exp_${String(this.idCounter++).padStart(2, '0')}`;
    const now = new Date();
    const newRecord: ExperienceRecord = {
      id,
      role: data.role,
      institution: data.institution,
      track: data.track,
      description: data.description ?? null,
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
      order: data.order ?? (this.records.length > 0 ? Math.max(...this.records.map((r) => r.order)) + 1 : 1),
      createdAt: now,
      updatedAt: now,
    };
    this.records.push(newRecord);
    return { ...newRecord };
  }

  async update(id: string, data: UpdateExperienceData): Promise<ExperienceRecord> {
    const index = this.records.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error(`Experience with ID ${id} not found`);
    }
    const current = this.records[index];
    const updated: ExperienceRecord = {
      ...current,
      ...(data.role !== undefined ? { role: data.role } : {}),
      ...(data.institution !== undefined ? { institution: data.institution } : {}),
      ...(data.track !== undefined ? { track: data.track } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.startDate !== undefined ? { startDate: data.startDate } : {}),
      ...(data.endDate !== undefined ? { endDate: data.endDate } : {}),
      ...(data.order !== undefined ? { order: data.order } : {}),
      updatedAt: new Date(),
    };
    this.records[index] = updated;
    return { ...updated };
  }

  async delete(id: string): Promise<void> {
    const index = this.records.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error(`Experience with ID ${id} not found`);
    }
    this.records.splice(index, 1);
  }

  async reorder(orderedIds: string[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i];
      const record = this.records.find((r) => r.id === id);
      if (record) {
        (record as { order: number }).order = i + 1;
      }
    }
  }
}

// -------------------------------------------------------------
// Test Runner & Assertion Harness
// -------------------------------------------------------------

let passedTests = 0;
let totalTests = 0;

function runTest(name: string, fn: () => void | Promise<void>) {
  totalTests++;
  try {
    const res = fn();
    if (res instanceof Promise) {
      return res
        .then(() => {
          passedTests++;
          console.log(`   ✓ ${name}`);
        })
        .catch((err) => {
          console.error(`   ✗ ${name}`);
          console.error(`     Assertion Error: ${err.message}`);
          throw err;
        });
    }
    passedTests++;
    console.log(`   ✓ ${name}`);
  } catch (err: unknown) {
    console.error(`   ✗ ${name}`);
    console.error(`     Assertion Error: ${err instanceof Error ? err.message : String(err)}`);
    throw err;
  }
}

async function main() {
  console.log('=== [STAGE 10.4 PHASE 4.2] AUTOMATED UNIT TEST SUITE ===\n');

  // ===========================================================
  // 1. Projects DTO Validation Tests
  // ===========================================================
  console.log('1. Testing Projects DTO Validation...');

  runTest('Create Project: fails when required fields are missing', () => {
    const res = validateCreateProjectInput({});
    assert.strictEqual(res.success, false);
    if (res.success === false) {
      assert.ok(res.errors.title);
      assert.ok(res.errors.category);
      assert.ok(res.errors.description);
      assert.ok(res.errors.technologies);
    }
  });

  runTest('Create Project: fails when fields contain only whitespace', () => {
    const res = validateCreateProjectInput({
      title: '   ',
      category: '  ',
      description: '          ',
      technologies: ['  '],
    });
    assert.strictEqual(res.success, false);
    if (res.success === false) {
      assert.ok(res.errors.title);
      assert.ok(res.errors.category);
      assert.ok(res.errors.description);
      assert.ok(res.errors.technologies);
    }
  });

  runTest('Create Project: boundary checks (title min 2, desc min 10)', () => {
    const res = validateCreateProjectInput({
      title: 'A',
      category: 'B',
      description: 'Too short',
      technologies: ['TypeScript'],
    });
    assert.strictEqual(res.success, false);
    if (res.success === false) {
      assert.ok(res.errors.title);
      assert.ok(res.errors.category);
      assert.ok(res.errors.description);
    }
  });

  runTest('Create Project: technologies limit (> 20 entries) fails', () => {
    const manyTechs = Array.from({ length: 21 }, (_, i) => `Tech${i}`);
    const res = validateCreateProjectInput({
      title: 'Valid Title',
      category: 'Engineering',
      description: 'A sufficiently long description for valid project creation.',
      technologies: manyTechs,
    });
    assert.strictEqual(res.success, false);
    if (res.success === false) {
      assert.strictEqual(res.errors.technologies, 'Cannot exceed 20 technologies');
    }
  });

  runTest('Create Project: empty technology item in array fails', () => {
    const res = validateCreateProjectInput({
      title: 'Valid Title',
      category: 'Engineering',
      description: 'A sufficiently long description for valid project creation.',
      technologies: ['React', ''],
    });
    assert.strictEqual(res.success, false);
    if (res.success === false) {
      assert.strictEqual(res.errors.technologies, 'Each technology must be between 1 and 50 characters');
    }
  });

  runTest('Create Project: URL security (reject javascript: and data:)', () => {
    const res = validateCreateProjectInput({
      title: 'Valid Title',
      category: 'Engineering',
      description: 'A sufficiently long description for valid project creation.',
      technologies: ['Go', 'PostgreSQL'],
      thumbnailUrl: 'javascript:alert(1)',
      projectUrl: 'data:text/html,<script>alert(1)</script>',
      githubUrl: 'ftp://github.com/invalid',
    });
    assert.strictEqual(res.success, false);
    if (res.success === false) {
      assert.strictEqual(res.errors.thumbnailUrl, 'Thumbnail URL uses an unsupported or unsafe protocol');
      assert.ok(res.errors.projectUrl);
      assert.ok(res.errors.githubUrl);
    }
  });

  runTest('Create Project: protocol-relative thumbnail URL (//evil.com) rejected', () => {
    const res = validateCreateProjectInput({
      title: 'Valid Title',
      category: 'Engineering',
      description: 'A sufficiently long description for valid project creation.',
      technologies: ['Go'],
      thumbnailUrl: '//evil.com/image.png',
    });
    assert.strictEqual(res.success, false);
    if (res.success === false) {
      assert.strictEqual(res.errors.thumbnailUrl, 'Protocol-relative URLs starting with "//" are not allowed');
    }
  });

  runTest('Create Project: safe root-relative thumbnail URL (/images/thumb.png) accepted', () => {
    const res = validateCreateProjectInput({
      title: 'Valid Title',
      category: 'Engineering',
      description: 'A sufficiently long description for valid project creation.',
      technologies: ['Go'],
      thumbnailUrl: '/images/thumb.png',
    });
    assert.strictEqual(res.success, true);
    if (res.success === true) {
      assert.strictEqual(res.data.thumbnailUrl, '/images/thumb.png');
    }
  });

  runTest('Create Project: reject unknown fields and system keys', () => {
    const res = validateCreateProjectInput({
      title: 'Valid Title',
      category: 'Engineering',
      description: 'A sufficiently long description for valid project creation.',
      technologies: ['Go'],
      id: 'hacked_id',
      featured: true,
      unknownProp: 123,
    });
    assert.strictEqual(res.success, false);
    if (res.success === false) {
      assert.ok(res.errors.id);
      assert.ok(res.errors.featured);
      assert.ok(res.errors.unknownProp);
    }
  });

  runTest('Create Project: default published to false when omitted', () => {
    const res = validateCreateProjectInput({
      title: 'Valid Title',
      category: 'Engineering',
      description: 'A sufficiently long description for valid project creation.',
      technologies: ['Go', 'Docker'],
    });
    assert.strictEqual(res.success, true);
    if (res.success === true) {
      assert.strictEqual(res.data.published, false);
    }
  });

  runTest('Create Project: reject invalid order numbers (< 1 or > 10000)', () => {
    const res = validateCreateProjectInput({
      title: 'Valid Title',
      category: 'Engineering',
      description: 'A sufficiently long description for valid project creation.',
      technologies: ['Go'],
      order: 0,
    });
    assert.strictEqual(res.success, false);
    if (res.success === false) {
      assert.ok(res.errors.order);
    }
  });

  runTest('Update Project DTO: accepts partial updates and rejects unknown fields', () => {
    const res1 = validateUpdateProjectInput({
      title: 'New Valid Title',
      published: true,
    });
    assert.strictEqual(res1.success, true);
    if (res1.success === true) {
      assert.strictEqual(res1.data.title, 'New Valid Title');
      assert.strictEqual(res1.data.published, true);
    }

    const res2 = validateUpdateProjectInput({
      unknownField: 'bad',
    });
    assert.strictEqual(res2.success, false);
  });

  // ===========================================================
  // 2. Experiences DTO Validation Tests
  // ===========================================================
  console.log('\n2. Testing Experiences DTO Validation...');

  runTest('Create Experience: fails when required fields are missing', () => {
    const res = validateCreateExperienceInput({});
    assert.strictEqual(res.success, false);
    if (res.success === false) {
      assert.ok(res.errors.role);
      assert.ok(res.errors.institution);
      assert.ok(res.errors.track);
    }
  });

  runTest('Create Experience: fails when fields contain whitespace only', () => {
    const res = validateCreateExperienceInput({
      role: '   ',
      institution: '  ',
      track: ' ',
    });
    assert.strictEqual(res.success, false);
    if (res.success === false) {
      assert.ok(res.errors.role);
      assert.ok(res.errors.institution);
      assert.ok(res.errors.track);
    }
  });

  runTest('Strict ISO Date: rejects invalid calendar dates (Feb 31, Apr 31)', () => {
    const res1 = parseStrictIsoDate('2026-02-31', 'Start date');
    assert.ok(res1.error);
    assert.ok(res1.error.includes('invalid day'));

    const res2 = parseStrictIsoDate('2026-04-31', 'Start date');
    assert.ok(res2.error);
    assert.ok(res2.error.includes('invalid day'));

    const res3 = parseStrictIsoDate('2026-02-29', 'Start date'); // 2026 is NOT a leap year
    assert.ok(res3.error);
    assert.ok(res3.error.includes('invalid day'));

    const validLeap = parseStrictIsoDate('2024-02-29', 'Start date'); // 2024 IS a leap year
    assert.strictEqual(validLeap.error, undefined);
    assert.ok(validLeap.date instanceof Date);
  });

  runTest('Create Experience: rejects endDate earlier than startDate', () => {
    const res = validateCreateExperienceInput({
      role: 'Software Engineer',
      institution: 'Tech Corp',
      track: 'ENGINEERING',
      startDate: '2026-05-01',
      endDate: '2026-04-01',
    });
    assert.strictEqual(res.success, false);
    if (res.success === false) {
      assert.strictEqual(res.errors.endDate, 'End date cannot be earlier than start date');
    }
  });

  runTest('Create Experience: null endDate allowed for ongoing tenure', () => {
    const res = validateCreateExperienceInput({
      role: 'Lead Architect',
      institution: 'Tech Corp',
      track: 'ENGINEERING',
      startDate: '2026-01-01',
      endDate: null,
    });
    assert.strictEqual(res.success, true);
    if (res.success === true) {
      assert.strictEqual(res.data.endDate, null);
    }
  });

  runTest('Create Experience: reject unknown fields and system keys', () => {
    const res = validateCreateExperienceInput({
      role: 'Software Engineer',
      institution: 'Tech Corp',
      track: 'ENGINEERING',
      id: 'custom_id',
      isCurrent: true,
      randomKey: 'fail',
    });
    assert.strictEqual(res.success, false);
    if (res.success === false) {
      assert.ok(res.errors.id);
      assert.ok(res.errors.isCurrent);
      assert.ok(res.errors.randomKey);
    }
  });

  runTest('Update Experience DTO: validates partial updates and cross-date checks', () => {
    const res1 = validateUpdateExperienceInput(
      { endDate: '2022-01-01' },
      { startDate: new Date('2023-01-01'), endDate: null }
    );
    assert.strictEqual(res1.success, false);
    if (res1.success === false) {
      assert.strictEqual(res1.errors.endDate, 'End date cannot be earlier than start date');
    }

    const res2 = validateUpdateExperienceInput({
      role: 'Staff Engineer',
    });
    assert.strictEqual(res2.success, true);
    if (res2.success === true) {
      assert.strictEqual(res2.data.role, 'Staff Engineer');
    }
  });

  // ===========================================================
  // 3. Projects Use Cases Tests
  // ===========================================================
  console.log('\n3. Testing Projects Use Cases (6 Operations)...');

  const projectRepo = new MockProjectRepository();
  let fakeTime = new Date('2026-11-08T10:00:00.000Z');
  const nowProvider = () => fakeTime;

  const getProjects = new GetProjectsUseCase(projectRepo);
  const getProjectById = new GetProjectByIdUseCase(projectRepo);
  const createProject = new CreateProjectUseCase(projectRepo, nowProvider);
  const updateProject = new UpdateProjectUseCase(projectRepo, nowProvider);
  const deleteProject = new DeleteProjectUseCase(projectRepo);
  const reorderProjects = new ReorderProjectsUseCase(projectRepo);

  await runTest('Projects: Create with auto-assigned order and published=false', async () => {
    const res = await createProject.execute({
      title: 'Water Reminder App',
      category: 'Mobile Application',
      description: 'Flutter mobile application for hydration tracking with alarms.',
      technologies: ['Flutter', 'Dart', 'Hive'],
      published: false,
    });
    assert.strictEqual(res.success, true);
    assert.ok(res.data);
    assert.strictEqual(res.data.order, 1);
    assert.strictEqual(res.data.published, false);
    assert.strictEqual(res.data.publishedAt, null);
  });

  await runTest('Projects: Create with explicit published=true sets publishedAt immediately', async () => {
    fakeTime = new Date('2026-11-08T12:00:00.000Z');
    const res = await createProject.execute({
      title: 'Urkins Delivery System',
      category: 'Web & API',
      description: 'Backend platform built with Go and PostgreSQL for courier tracking.',
      technologies: ['Go', 'PostgreSQL', 'Docker'],
      published: true,
    });
    assert.strictEqual(res.success, true);
    assert.ok(res.data);
    assert.strictEqual(res.data.order, 2);
    assert.strictEqual(res.data.published, true);
    assert.strictEqual(res.data.publishedAt?.toISOString(), '2026-11-08T12:00:00.000Z');
  });

  await runTest('Projects: Get all and Get by ID', async () => {
    const all = await getProjects.execute();
    assert.strictEqual(all.length, 2);

    const first = await getProjectById.execute(all[0].id);
    assert.ok(first);
    assert.strictEqual(first.title, 'Water Reminder App');

    const missing = await getProjectById.execute('nonexistent_id');
    assert.strictEqual(missing, null);
  });

  await runTest('Projects: Publishing an existing unpublished project sets publishedAt', async () => {
    fakeTime = new Date('2026-11-08T14:30:00.000Z');
    const updateRes = await updateProject.execute('project_01', {
      published: true,
    });
    assert.strictEqual(updateRes.success, true);
    assert.ok(updateRes.data);
    assert.strictEqual(updateRes.data.published, true);
    assert.strictEqual(updateRes.data.publishedAt?.toISOString(), '2026-11-08T14:30:00.000Z');
  });

  await runTest('Projects: Unpublishing an existing project preserves previous publishedAt history', async () => {
    fakeTime = new Date('2026-11-08T16:00:00.000Z');
    const unpublishRes = await updateProject.execute('project_01', {
      published: false,
    });
    assert.strictEqual(unpublishRes.success, true);
    assert.ok(unpublishRes.data);
    assert.strictEqual(unpublishRes.data.published, false);
    assert.strictEqual(unpublishRes.data.publishedAt?.toISOString(), '2026-11-08T14:30:00.000Z');
  });

  await runTest('Projects: Republishing an unpublished project updates publishedAt to new time', async () => {
    fakeTime = new Date('2026-11-08T18:00:00.000Z');
    const republishRes = await updateProject.execute('project_01', {
      published: true,
    });
    assert.strictEqual(republishRes.success, true);
    assert.ok(republishRes.data);
    assert.strictEqual(republishRes.data.published, true);
    assert.strictEqual(republishRes.data.publishedAt?.toISOString(), '2026-11-08T18:00:00.000Z');
  });

  await runTest('Projects: Update nonexistent ID returns structured error', async () => {
    const res = await updateProject.execute('invalid_project_id', {
      title: 'Should Fail',
    });
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.error, 'Project not found');
  });

  await runTest('Projects: Reorder rejects duplicate, missing, and unknown IDs', async () => {
    // Current projects: project_01, project_02
    const dupRes = await reorderProjects.execute(['project_01', 'project_01']);
    assert.strictEqual(dupRes.success, false);
    assert.ok(dupRes.error?.includes('duplicate'));

    const missingRes = await reorderProjects.execute(['project_01']);
    assert.strictEqual(missingRes.success, false);
    assert.ok(missingRes.error?.includes('count'));

    const unknownRes = await reorderProjects.execute(['project_01', 'project_99']);
    assert.strictEqual(unknownRes.success, false);
    assert.ok(unknownRes.error?.includes('does not exist'));
  });

  await runTest('Projects: Reorder successful with valid complete collection', async () => {
    const res = await reorderProjects.execute(['project_02', 'project_01']);
    assert.strictEqual(res.success, true);

    const all = await getProjects.execute();
    assert.strictEqual(all[0].id, 'project_02');
    assert.strictEqual(all[0].order, 1);
    assert.strictEqual(all[1].id, 'project_01');
    assert.strictEqual(all[1].order, 2);
  });

  await runTest('Projects: Delete nonexistent ID fails, deleting existing succeeds', async () => {
    const failRes = await deleteProject.execute('nonexistent');
    assert.strictEqual(failRes.success, false);
    assert.strictEqual(failRes.error, 'Project not found');

    const okRes = await deleteProject.execute('project_01');
    assert.strictEqual(okRes.success, true);

    const remaining = await getProjects.execute();
    assert.strictEqual(remaining.length, 1);
    assert.strictEqual(remaining[0].id, 'project_02');
  });

  // ===========================================================
  // 4. Experiences Use Cases Tests
  // ===========================================================
  console.log('\n4. Testing Experiences Use Cases (6 Operations)...');

  const expRepo = new MockExperienceRepository();
  const getExperiences = new GetExperiencesUseCase(expRepo);
  const getExperienceById = new GetExperienceByIdUseCase(expRepo);
  const createExperience = new CreateExperienceUseCase(expRepo);
  const updateExperience = new UpdateExperienceUseCase(expRepo);
  const deleteExperience = new DeleteExperienceUseCase(expRepo);
  const reorderExperiences = new ReorderExperiencesUseCase(expRepo);

  await runTest('Experiences: Create with auto-assigned order and ongoing endDate=null', async () => {
    const res = await createExperience.execute({
      role: 'Programming Instructor',
      institution: 'Timedoor Academy',
      track: 'EDUCATION',
      description: 'Teaching algorithms and web development to high school students.',
      startDate: '2023-01-01',
      endDate: null,
    });
    assert.strictEqual(res.success, true);
    assert.ok(res.data);
    assert.strictEqual(res.data.order, 1);
    assert.strictEqual(res.data.endDate, null);
  });

  await runTest('Experiences: Create second experience with bounded dates', async () => {
    const res = await createExperience.execute({
      role: 'Data Entry Specialist',
      institution: 'PT Angkasa Pura 2',
      track: 'DATA & OPS',
      description: 'Flight data verification and operations entry.',
      startDate: '2021-06-01',
      endDate: '2022-12-31',
    });
    assert.strictEqual(res.success, true);
    assert.ok(res.data);
    assert.strictEqual(res.data.order, 2);
  });

  await runTest('Experiences: Get all and Get by ID', async () => {
    const all = await getExperiences.execute();
    assert.strictEqual(all.length, 2);

    const exp1 = await getExperienceById.execute(all[0].id);
    assert.ok(exp1);
    assert.strictEqual(exp1.role, 'Programming Instructor');

    const missing = await getExperienceById.execute('nonexistent_exp');
    assert.strictEqual(missing, null);
  });

  await runTest('Experiences: Update validates chronological dates against existing record', async () => {
    // Current exp_01: startDate: 2023-01-01. Trying to set endDate to 2022-01-01 should fail!
    const failRes = await updateExperience.execute('exp_01', {
      endDate: '2022-01-01',
    });
    assert.strictEqual(failRes.success, false);
    if (failRes.success === false && failRes.errors) {
      assert.strictEqual(failRes.errors.endDate, 'End date cannot be earlier than start date');
    }

    const okRes = await updateExperience.execute('exp_01', {
      role: 'Senior Programming Instructor',
    });
    assert.strictEqual(okRes.success, true);
    assert.ok(okRes.data);
    assert.strictEqual(okRes.data.role, 'Senior Programming Instructor');
  });

  await runTest('Experiences: Update nonexistent ID returns error', async () => {
    const res = await updateExperience.execute('invalid_exp_id', {
      role: 'Ghost Role',
    });
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.error, 'Experience not found');
  });

  await runTest('Experiences: Reorder rejects duplicate, missing, and unknown IDs', async () => {
    const dupRes = await reorderExperiences.execute(['exp_01', 'exp_01']);
    assert.strictEqual(dupRes.success, false);
    assert.ok(dupRes.error?.includes('duplicate'));

    const missingRes = await reorderExperiences.execute(['exp_01']);
    assert.strictEqual(missingRes.success, false);
    assert.ok(missingRes.error?.includes('count'));

    const unknownRes = await reorderExperiences.execute(['exp_01', 'exp_99']);
    assert.strictEqual(unknownRes.success, false);
    assert.ok(unknownRes.error?.includes('does not exist'));
  });

  await runTest('Experiences: Reorder successful with valid complete collection', async () => {
    const res = await reorderExperiences.execute(['exp_02', 'exp_01']);
    assert.strictEqual(res.success, true);

    const all = await getExperiences.execute();
    assert.strictEqual(all[0].id, 'exp_02');
    assert.strictEqual(all[0].order, 1);
    assert.strictEqual(all[1].id, 'exp_01');
    assert.strictEqual(all[1].order, 2);
  });

  await runTest('Experiences: Delete nonexistent ID fails, deleting existing succeeds', async () => {
    const failRes = await deleteExperience.execute('nonexistent');
    assert.strictEqual(failRes.success, false);
    assert.strictEqual(failRes.error, 'Experience not found');

    const okRes = await deleteExperience.execute('exp_01');
    assert.strictEqual(okRes.success, true);

    const remaining = await getExperiences.execute();
    assert.strictEqual(remaining.length, 1);
    assert.strictEqual(remaining[0].id, 'exp_02');
  });

  console.log(`\n=== UNIT TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED (100%) ===\n`);
}

main().catch((err) => {
  console.error('\nFATAL ERROR IN TEST SUITE:', err);
  process.exit(1);
});
