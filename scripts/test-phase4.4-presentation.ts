// scripts/test-phase4.4-presentation.ts
// Comprehensive Automated Tests for Stage 10.4 Phase 4.4 Presentation Layer
// Tests Server Actions security authorization, DTO field whitelisting,
// reorder validation, read-only presentation integration, and DB baseline safety.

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { prisma } from '../src/infrastructure/prisma/client';
import { CompositionRoot } from '../src/infrastructure/composition-root';
import {
  createProjectAction,
  updateProjectAction,
  deleteProjectAction,
  reorderProjectsAction,
} from '../app/admin/(dashboard)/projects/actions';
import {
  createExperienceAction,
  updateExperienceAction,
  deleteExperienceAction,
  reorderExperiencesAction,
} from '../app/admin/(dashboard)/experiences/actions';
import {
  validateCreateProjectInput,
  validateUpdateProjectInput,
} from '../src/application/dtos/project.dto';
import {
  validateCreateExperienceInput,
  validateUpdateExperienceInput,
} from '../src/application/dtos/experience.dto';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log('=== [STAGE 10.4 PHASE 4.4] PRESENTATION LAYER AUTOMATED TEST SUITE ===\n');

  // -----------------------------------------------------------------
  // 1. Server Action Security (Unauthenticated Rejection via DAL verifySession)
  // -----------------------------------------------------------------
  console.log('1. Testing Server Action Security & DAL Session Verification (8 Actions)...');

  // 1.1 createProjectAction
  const dummyProjectForm = new FormData();
  dummyProjectForm.append('title', 'Hacker Project');
  dummyProjectForm.append('category', 'Exploit');
  dummyProjectForm.append('description', 'Should be blocked by verifySession() guard');
  dummyProjectForm.append('technologies', 'Hacking, Malware');
  const resProjCreate = await createProjectAction({ success: false }, dummyProjectForm);
  assert(resProjCreate.success === false, 'createProjectAction must reject unauthenticated call');
  assert(
    Boolean(resProjCreate.error?.includes('Unauthorized') || resProjCreate.error?.includes('Authentication failed')),
    'createProjectAction must return security error message'
  );

  // 1.2 updateProjectAction
  const resProjUpdate = await updateProjectAction('project_01', { success: false }, dummyProjectForm);
  assert(resProjUpdate.success === false, 'updateProjectAction must reject unauthenticated call');
  assert(
    Boolean(resProjUpdate.error?.includes('Unauthorized') || resProjUpdate.error?.includes('Authentication failed')),
    'updateProjectAction must return security error message'
  );

  // 1.3 deleteProjectAction
  const resProjDelete = await deleteProjectAction('project_01');
  assert(resProjDelete.success === false, 'deleteProjectAction must reject unauthenticated call');
  assert(
    Boolean(resProjDelete.error?.includes('Unauthorized') || resProjDelete.error?.includes('Authentication failed')),
    'deleteProjectAction must return security error message'
  );

  // 1.4 reorderProjectsAction
  const resProjReorder = await reorderProjectsAction(['project_01', 'project_02', 'project_03']);
  assert(resProjReorder.success === false, 'reorderProjectsAction must reject unauthenticated call');
  assert(
    Boolean(resProjReorder.error?.includes('Unauthorized') || resProjReorder.error?.includes('Authentication failed')),
    'reorderProjectsAction must return security error message'
  );

  // 1.5 createExperienceAction
  const dummyExpForm = new FormData();
  dummyExpForm.append('role', 'Hacker Lead');
  dummyExpForm.append('institution', 'Malware Corp');
  dummyExpForm.append('track', 'Cyber Exploit');
  dummyExpForm.append('startDate', '2025-01-01');
  dummyExpForm.append('isOngoing', 'true');
  const resExpCreate = await createExperienceAction({ success: false }, dummyExpForm);
  assert(resExpCreate.success === false, 'createExperienceAction must reject unauthenticated call');
  assert(
    Boolean(resExpCreate.error?.includes('Unauthorized') || resExpCreate.error?.includes('Authentication failed')),
    'createExperienceAction must return security error message'
  );

  // 1.6 updateExperienceAction
  const resExpUpdate = await updateExperienceAction('exp_01', { success: false }, dummyExpForm);
  assert(resExpUpdate.success === false, 'updateExperienceAction must reject unauthenticated call');
  assert(
    Boolean(resExpUpdate.error?.includes('Unauthorized') || resExpUpdate.error?.includes('Authentication failed')),
    'updateExperienceAction must return security error message'
  );

  // 1.7 deleteExperienceAction
  const resExpDelete = await deleteExperienceAction('exp_01');
  assert(resExpDelete.success === false, 'deleteExperienceAction must reject unauthenticated call');
  assert(
    Boolean(resExpDelete.error?.includes('Unauthorized') || resExpDelete.error?.includes('Authentication failed')),
    'deleteExperienceAction must return security error message'
  );

  // 1.8 reorderExperiencesAction
  const resExpReorder = await reorderExperiencesAction(['exp_01', 'exp_02']);
  assert(resExpReorder.success === false, 'reorderExperiencesAction must reject unauthenticated call');
  assert(
    Boolean(resExpReorder.error?.includes('Unauthorized') || resExpReorder.error?.includes('Authentication failed')),
    'reorderExperiencesAction must return security error message'
  );

  console.log('   ✓ All 8 Server Actions strictly enforce verifySession() and reject unauthenticated requests.\n');

  // -----------------------------------------------------------------
  // 2. DTO Whitelist & Security Validation
  // -----------------------------------------------------------------
  console.log('2. Testing DTO Whitelisting & Input Validation...');

  // 2.1 Project DTO System field injection rejection
  const injectedProject = validateCreateProjectInput({
    title: 'Valid Title',
    category: 'Valid Category',
    description: 'Valid description that has enough characters for validation.',
    technologies: ['TypeScript'],
    id: 'hacker_injected_id',
    createdAt: new Date(),
    publishedAt: new Date(),
  });
  assert(injectedProject.success === false, 'Project DTO must reject system fields (id, createdAt, publishedAt)');
  if (injectedProject.success === false) {
    assert(Boolean(injectedProject.errors.id), 'Errors must flag id as system-controlled');
    assert(Boolean(injectedProject.errors.createdAt), 'Errors must flag createdAt as system-controlled');
    assert(Boolean(injectedProject.errors.publishedAt), 'Errors must flag publishedAt as system-controlled');
  }

  // 2.2 Experience DTO System field injection rejection
  const injectedExp = validateCreateExperienceInput({
    role: 'Valid Role',
    institution: 'Valid Institution',
    track: 'Valid Track',
    startDate: '2024-01-01',
    id: 'exp_injected',
    updatedAt: new Date(),
    arbitraryField: 'malicious',
  });
  assert(injectedExp.success === false, 'Experience DTO must reject system and arbitrary fields');
  if (injectedExp.success === false) {
    assert(Boolean(injectedExp.errors.id), 'Errors must flag id as system-controlled');
    assert(Boolean(injectedExp.errors.updatedAt), 'Errors must flag updatedAt as system-controlled');
    assert(Boolean(injectedExp.errors.arbitraryField), 'Errors must flag arbitrary field as not allowed');
  }

  // 2.3 Ongoing experience endDate validation
  const ongoingValid = validateCreateExperienceInput({
    role: 'Software Developer',
    institution: 'Tech Corp',
    track: 'Work',
    startDate: '2024-01-01',
    endDate: null,
  });
  assert(ongoingValid.success === true, 'Ongoing experience with endDate=null must be valid');
  if (ongoingValid.success) {
    assert(ongoingValid.data.endDate === null, 'Validated DTO must retain endDate=null for ongoing');
  }

  // 2.4 Invalid date order in Experience
  const invertedDates = validateCreateExperienceInput({
    role: 'Software Developer',
    institution: 'Tech Corp',
    track: 'Work',
    startDate: '2024-06-01',
    endDate: '2023-01-01',
  });
  assert(invertedDates.success === false, 'Experience with endDate < startDate must fail validation');

  // 2.5 Update DTO validation tests
  const validUpdateProject = validateUpdateProjectInput({ title: 'Updated Project Name' });
  assert(validUpdateProject.success === true, 'Update project DTO must succeed for valid title');
  const validUpdateExperience = validateUpdateExperienceInput({ role: 'Lead Architect' });
  assert(validUpdateExperience.success === true, 'Update experience DTO must succeed for valid role');

  console.log('   ✓ DTO whitelisting and system field injection guards verified.\n');

  // -----------------------------------------------------------------
  // 3. Live Read-Only Integration via CompositionRoot Use Cases
  // -----------------------------------------------------------------
  console.log('3. Testing Presentation Layer Live Read-Only Integration...');

  const getProjectsUseCase = CompositionRoot.getGetProjectsUseCase();
  const liveProjects = await getProjectsUseCase.execute();
  assert(Array.isArray(liveProjects), 'liveProjects must be an array');
  assert(liveProjects.length === 3, `Expected 3 live projects, got ${liveProjects.length}`);

  // Invariant: exact IDs preserved (no stripped '01')
  const projectIds = liveProjects.map((p) => p.id);
  assert(projectIds.includes('project_01'), 'Must preserve exact ID project_01');
  assert(projectIds.includes('project_02'), 'Must preserve exact ID project_02');
  assert(projectIds.includes('project_03'), 'Must preserve exact ID project_03');

  // Invariant: sequential ordering 1, 2, 3
  const projectOrders = liveProjects.map((p) => p.order);
  assert(projectOrders[0] === 1 && projectOrders[1] === 2 && projectOrders[2] === 3, 'Projects must be ordered 1, 2, 3');

  // Invariant: technologies parsed
  for (const p of liveProjects) {
    assert(Array.isArray(p.technologies), `Project ${p.id} technologies must be an array`);
    assert(p.technologies.length > 0, `Project ${p.id} must have at least one technology`);
  }

  const getExperiencesUseCase = CompositionRoot.getGetExperiencesUseCase();
  const liveExperiences = await getExperiencesUseCase.execute();
  assert(Array.isArray(liveExperiences), 'liveExperiences must be an array');
  assert(liveExperiences.length === 5, `Expected 5 live experiences, got ${liveExperiences.length}`);

  // Invariant: exact IDs preserved (exp_01 to exp_05)
  const expIds = liveExperiences.map((e) => e.id);
  for (let i = 1; i <= 5; i++) {
    const expectedId = `exp_0${i}`;
    assert(expIds.includes(expectedId), `Must preserve exact ID ${expectedId}`);
  }

  // Invariant: ongoing experience has endDate === null
  const ongoingExps = liveExperiences.filter((e) => e.endDate === null);
  assert(ongoingExps.length > 0, 'At least one live experience must be ongoing (endDate === null)');
  console.log(`   Found ${ongoingExps.length} ongoing experience(s) with endDate === null.`);

  console.log('   ✓ Live presentation read-only verification passed with exact IDs.\n');

  // -----------------------------------------------------------------
  // 4. Database Safety and Baseline Integrity Audit
  // -----------------------------------------------------------------
  console.log('4. Auditing Database Baseline Row Counts (Target: exactly 40 records)...');

  const counts = {
    hero_profiles: await prisma.heroProfile.count(),
    roles: await prisma.role.count(),
    engineering_nodes: await prisma.engineeringNode.count(),
    about_profiles: await prisma.aboutProfile.count(),
    domains: await prisma.domain.count(),
    pillars: await prisma.pillar.count(),
    projects: await prisma.project.count(),
    experiences: await prisma.experience.count(),
    skill_categories: await prisma.skillCategory.count(),
    skills: await prisma.skill.count(),
    contact_profiles: await prisma.contactProfile.count(),
    contact_channels: await prisma.contactChannel.count(),
    admins: await prisma.admin.count(),
  };

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  console.table(counts);
  console.log(`TOTAL RECORDS: ${total} (Expected: 40)`);

  assert(counts.hero_profiles === 1, 'hero_profiles must be 1');
  assert(counts.projects === 3, 'projects must be 3');
  assert(counts.experiences === 5, 'experiences must be 5');
  assert(counts.admins === 0, 'admins must be 0 (no test admin created)');
  assert(counts.contact_channels === 0, 'contact_channels must be 0');
  assert(total === 40, 'Database total records must remain exactly 40');

  console.log('\n=== ALL PHASE 4.4 PRESENTATION AUTOMATED TESTS PASSED SUCCESSFULLY ===');
}

runTests()
  .catch((err) => {
    console.error('Test Suite Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
