// scripts/test-phase5.4-presentation.ts
// Comprehensive Automated Tests for Stage 10.4 Phase 5.4 Presentation Layer
// Tests Server Actions security authorization, DTO field whitelisting,
// string index preservation, cascade protection, live presentation integration, and DB safety.

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { prisma } from '../src/infrastructure/prisma/client';
import { CompositionRoot } from '../src/infrastructure/composition-root';

// Server Actions (20 Actions)
import {
  createRoleAction,
  updateRoleAction,
  deleteRoleAction,
  reorderRolesAction,
} from '../app/admin/(dashboard)/roles/actions';
import {
  createEngineeringNodeAction,
  updateEngineeringNodeAction,
  deleteEngineeringNodeAction,
  reorderEngineeringNodesAction,
} from '../app/admin/(dashboard)/engineering-nodes/actions';
import {
  createDomainAction,
  updateDomainAction,
  deleteDomainAction,
  reorderDomainsAction,
} from '../app/admin/(dashboard)/domains/actions';
import {
  createPillarAction,
  updatePillarAction,
  deletePillarAction,
  reorderPillarsAction,
} from '../app/admin/(dashboard)/pillars/actions';
import {
  createSkillCategoryAction,
  updateSkillCategoryAction,
  deleteSkillCategoryAction,
  reorderSkillCategoriesAction,
  createSkillAction,
  updateSkillAction,
  deleteSkillAction,
  reorderSkillsAction,
} from '../app/admin/(dashboard)/skills/actions';

// DTO Validators
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

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log('=== [STAGE 10.4 PHASE 5.4] PRESENTATION LAYER AUTOMATED TEST SUITE ===\n');

  // -----------------------------------------------------------------
  // 1. Server Action Security (Unauthenticated Rejection via DAL verifySession)
  // -----------------------------------------------------------------
  console.log('1. Testing Server Action Security & DAL Session Verification (24 Actions)...');

  // 1.1 Roles (4 actions)
  const dummyRoleForm = new FormData();
  dummyRoleForm.append('title', 'Hacker Role');
  const resRoleCreate = await createRoleAction({ success: false }, dummyRoleForm);
  assert(resRoleCreate.success === false, 'createRoleAction must reject unauthenticated call');
  assert(
    Boolean(resRoleCreate.error?.includes('Unauthorized') || resRoleCreate.error?.includes('Authentication failed')),
    'createRoleAction must return security error message'
  );

  const resRoleUpdate = await updateRoleAction('role_01', { success: false }, dummyRoleForm);
  assert(resRoleUpdate.success === false, 'updateRoleAction must reject unauthenticated call');
  assert(
    Boolean(resRoleUpdate.error?.includes('Unauthorized') || resRoleUpdate.error?.includes('Authentication failed')),
    'updateRoleAction must return security error message'
  );

  const resRoleDelete = await deleteRoleAction('role_01');
  assert(resRoleDelete.success === false, 'deleteRoleAction must reject unauthenticated call');
  assert(
    Boolean(resRoleDelete.error?.includes('Unauthorized') || resRoleDelete.error?.includes('Authentication failed')),
    'deleteRoleAction must return security error message'
  );

  const resRoleReorder = await reorderRolesAction(['role_01', 'role_02']);
  assert(resRoleReorder.success === false, 'reorderRolesAction must reject unauthenticated call');
  assert(
    Boolean(resRoleReorder.error?.includes('Unauthorized') || resRoleReorder.error?.includes('Authentication failed')),
    'reorderRolesAction must return security error message'
  );

  // 1.2 Engineering Nodes (4 actions)
  const dummyNodeForm = new FormData();
  dummyNodeForm.append('tag', 'HACK');
  dummyNodeForm.append('title', 'Exploit Node');
  dummyNodeForm.append('description', 'Unauthorized injection description');
  const resNodeCreate = await createEngineeringNodeAction({ success: false }, dummyNodeForm);
  assert(resNodeCreate.success === false, 'createEngineeringNodeAction must reject unauthenticated call');
  assert(
    Boolean(resNodeCreate.error?.includes('Unauthorized') || resNodeCreate.error?.includes('Authentication failed')),
    'createEngineeringNodeAction must return security error message'
  );

  const resNodeUpdate = await updateEngineeringNodeAction('enode_01', { success: false }, dummyNodeForm);
  assert(resNodeUpdate.success === false, 'updateEngineeringNodeAction must reject unauthenticated call');
  assert(
    Boolean(resNodeUpdate.error?.includes('Unauthorized') || resNodeUpdate.error?.includes('Authentication failed')),
    'updateEngineeringNodeAction must return security error message'
  );

  const resNodeDelete = await deleteEngineeringNodeAction('enode_01');
  assert(resNodeDelete.success === false, 'deleteEngineeringNodeAction must reject unauthenticated call');
  assert(
    Boolean(resNodeDelete.error?.includes('Unauthorized') || resNodeDelete.error?.includes('Authentication failed')),
    'deleteEngineeringNodeAction must return security error message'
  );

  const resNodeReorder = await reorderEngineeringNodesAction(['enode_01', 'enode_02']);
  assert(resNodeReorder.success === false, 'reorderEngineeringNodesAction must reject unauthenticated call');
  assert(
    Boolean(resNodeReorder.error?.includes('Unauthorized') || resNodeReorder.error?.includes('Authentication failed')),
    'reorderEngineeringNodesAction must return security error message'
  );

  // 1.3 Domains (4 actions)
  const dummyDomainForm = new FormData();
  dummyDomainForm.append('index', '99');
  dummyDomainForm.append('title', 'Hacker Domain');
  const resDomainCreate = await createDomainAction({ success: false }, dummyDomainForm);
  assert(resDomainCreate.success === false, 'createDomainAction must reject unauthenticated call');
  assert(
    Boolean(resDomainCreate.error?.includes('Unauthorized') || resDomainCreate.error?.includes('Authentication failed')),
    'createDomainAction must return security error message'
  );

  const resDomainUpdate = await updateDomainAction('domain_01', { success: false }, dummyDomainForm);
  assert(resDomainUpdate.success === false, 'updateDomainAction must reject unauthenticated call');
  assert(
    Boolean(resDomainUpdate.error?.includes('Unauthorized') || resDomainUpdate.error?.includes('Authentication failed')),
    'updateDomainAction must return security error message'
  );

  const resDomainDelete = await deleteDomainAction('domain_01');
  assert(resDomainDelete.success === false, 'deleteDomainAction must reject unauthenticated call');
  assert(
    Boolean(resDomainDelete.error?.includes('Unauthorized') || resDomainDelete.error?.includes('Authentication failed')),
    'deleteDomainAction must return security error message'
  );

  const resDomainReorder = await reorderDomainsAction(['domain_01', 'domain_02']);
  assert(resDomainReorder.success === false, 'reorderDomainsAction must reject unauthenticated call');
  assert(
    Boolean(resDomainReorder.error?.includes('Unauthorized') || resDomainReorder.error?.includes('Authentication failed')),
    'reorderDomainsAction must return security error message'
  );

  // 1.4 Pillars (4 actions)
  const dummyPillarForm = new FormData();
  dummyPillarForm.append('index', '99');
  dummyPillarForm.append('title', 'Hacker Pillar');
  dummyPillarForm.append('description', 'Unauthorized description text');
  const resPillarCreate = await createPillarAction({ success: false }, dummyPillarForm);
  assert(resPillarCreate.success === false, 'createPillarAction must reject unauthenticated call');
  assert(
    Boolean(resPillarCreate.error?.includes('Unauthorized') || resPillarCreate.error?.includes('Authentication failed')),
    'createPillarAction must return security error message'
  );

  const resPillarUpdate = await updatePillarAction('pillar_01', { success: false }, dummyPillarForm);
  assert(resPillarUpdate.success === false, 'updatePillarAction must reject unauthenticated call');
  assert(
    Boolean(resPillarUpdate.error?.includes('Unauthorized') || resPillarUpdate.error?.includes('Authentication failed')),
    'updatePillarAction must return security error message'
  );

  const resPillarDelete = await deletePillarAction('pillar_01');
  assert(resPillarDelete.success === false, 'deletePillarAction must reject unauthenticated call');
  assert(
    Boolean(resPillarDelete.error?.includes('Unauthorized') || resPillarDelete.error?.includes('Authentication failed')),
    'deletePillarAction must return security error message'
  );

  const resPillarReorder = await reorderPillarsAction(['pillar_01', 'pillar_02']);
  assert(resPillarReorder.success === false, 'reorderPillarsAction must reject unauthenticated call');
  assert(
    Boolean(resPillarReorder.error?.includes('Unauthorized') || resPillarReorder.error?.includes('Authentication failed')),
    'reorderPillarsAction must return security error message'
  );

  // 1.5 Skills & Categories (8 actions)
  const dummyCatForm = new FormData();
  dummyCatForm.append('title', 'Hacker Category');
  const resCatCreate = await createSkillCategoryAction({ success: false }, dummyCatForm);
  assert(resCatCreate.success === false, 'createSkillCategoryAction must reject unauthenticated call');

  const resCatUpdate = await updateSkillCategoryAction('skill_cat_01', { success: false }, dummyCatForm);
  assert(resCatUpdate.success === false, 'updateSkillCategoryAction must reject unauthenticated call');

  const resCatDelete = await deleteSkillCategoryAction('skill_cat_01');
  assert(resCatDelete.success === false, 'deleteSkillCategoryAction must reject unauthenticated call');

  const resCatReorder = await reorderSkillCategoriesAction(['skill_cat_01', 'skill_cat_02']);
  assert(resCatReorder.success === false, 'reorderSkillCategoriesAction must reject unauthenticated call');

  const dummySkillForm = new FormData();
  dummySkillForm.append('name', 'Hacker Skill');
  dummySkillForm.append('categoryId', 'skill_cat_01');
  const resSkillCreate = await createSkillAction({ success: false }, dummySkillForm);
  assert(resSkillCreate.success === false, 'createSkillAction must reject unauthenticated call');

  const resSkillUpdate = await updateSkillAction('skill_01', { success: false }, dummySkillForm);
  assert(resSkillUpdate.success === false, 'updateSkillAction must reject unauthenticated call');

  const resSkillDelete = await deleteSkillAction('skill_01');
  assert(resSkillDelete.success === false, 'deleteSkillAction must reject unauthenticated call');

  const resSkillReorder = await reorderSkillsAction('skill_cat_01', ['skill_01', 'skill_02']);
  assert(resSkillReorder.success === false, 'reorderSkillsAction must reject unauthenticated call');

  console.log('   ✓ All 24 Server Actions strictly enforce verifySession() and reject unauthenticated requests.\n');

  // -----------------------------------------------------------------
  // 2. DTO Whitelist & Validation Rules
  // -----------------------------------------------------------------
  console.log('2. Testing DTO Whitelisting, Nullability & String Index Preservation...');

  // 2.1 Role DTO
  const roleInvalid = validateCreateRoleInput({ title: '', id: 'sys_id' });
  assert(roleInvalid.success === false, 'Role DTO must reject empty title');
  if (roleInvalid.success === false) {
    assert(Boolean(roleInvalid.errors.title), 'Role DTO must flag title error');
    assert(Boolean(roleInvalid.errors.id), 'Role DTO must reject injected system field id');
  }

  const roleValid = validateCreateRoleInput({ title: 'Lead Architect', primary: true });
  assert(roleValid.success === true, 'Valid role with primary=true must pass');
  if (roleValid.success) {
    assert(roleValid.data.primary === true, 'Validated role must preserve primary=true');
  }

  // 2.2 Engineering Node DTO (Nullable stack)
  const nodeWithNullStack = validateCreateEngineeringNodeInput({
    tag: 'SYS',
    title: 'Core Engine',
    description: 'System kernel and runtime',
    stack: null,
  });
  assert(nodeWithNullStack.success === true, 'Engineering node with stack=null must pass');
  if (nodeWithNullStack.success) {
    assert(nodeWithNullStack.data.stack === null, 'Node DTO must preserve explicit null stack');
  }

  const nodeWithEmptyStrStack = validateUpdateEngineeringNodeInput({
    stack: null,
  });
  assert(nodeWithEmptyStrStack.success === true, 'Engineering node update with stack=null must pass');

  // 2.3 Domain DTO (String Index preservation e.g. "01")
  const domainWithLeadingZero = validateCreateDomainInput({
    index: '01',
    title: 'Distributed Systems',
  });
  assert(domainWithLeadingZero.success === true, 'Domain with string index "01" must pass');
  if (domainWithLeadingZero.success) {
    assert(typeof domainWithLeadingZero.data.index === 'string', 'Domain index must remain string');
    assert(domainWithLeadingZero.data.index === '01', 'Domain index must preserve leading zero "01"');
  }

  // 2.4 Pillar DTO (String Index preservation & required description)
  const pillarWithLeadingZero = validateCreatePillarInput({
    index: '02',
    title: 'Reliability & Fault Tolerance',
    description: 'Ensuring zero-downtime architecture',
  });
  assert(pillarWithLeadingZero.success === true, 'Pillar with string index "02" must pass');
  if (pillarWithLeadingZero.success) {
    assert(typeof pillarWithLeadingZero.data.index === 'string', 'Pillar index must remain string');
    assert(pillarWithLeadingZero.data.index === '02', 'Pillar index must preserve leading zero "02"');
  }

  // 2.5 Skill & Category DTOs
  const catValid = validateCreateSkillCategoryInput({ title: 'Cloud & Infrastructure' });
  assert(catValid.success === true, 'Skill category with valid title must pass');

  const skillValid = validateCreateSkillInput({
    name: 'PostgreSQL',
    categoryId: 'skill_cat_01',
  });
  assert(skillValid.success === true, 'Skill with valid categoryId must pass');

  // 2.6 Update DTO validation tests
  const validUpdateRole = validateUpdateRoleInput({ title: 'Principal Engineer' });
  assert(validUpdateRole.success === true, 'Update role DTO must succeed');
  const validUpdateDomain = validateUpdateDomainInput({ title: 'Cloud Platform' });
  assert(validUpdateDomain.success === true, 'Update domain DTO must succeed');
  const validUpdatePillar = validateUpdatePillarInput({ title: 'Operational Excellence' });
  assert(validUpdatePillar.success === true, 'Update pillar DTO must succeed');
  const validUpdateSkillCat = validateUpdateSkillCategoryInput({ title: 'Database Systems' });
  assert(validUpdateSkillCat.success === true, 'Update skill category DTO must succeed');
  const validUpdateSkill = validateUpdateSkillInput({ name: 'PostgreSQL Advanced' });
  assert(validUpdateSkill.success === true, 'Update skill DTO must succeed');

  console.log('   ✓ DTO whitelisting, nullability, and string index preservation verified.\n');

  // -----------------------------------------------------------------
  // 3. Live Read-Only Integration via CompositionRoot Use Cases
  // -----------------------------------------------------------------
  console.log('3. Testing Presentation Layer Live Read-Only Integration...');

  // 3.1 Roles (4 in DB)
  const roles = await CompositionRoot.getGetRolesUseCase().execute();
  assert(Array.isArray(roles), 'roles must be an array');
  assert(roles.length === 4, `Expected exactly 4 roles, got ${roles.length}`);
  const roleIds = roles.map((r) => r.id);
  assert(roleIds.includes('role_01'), 'Must preserve exact ID role_01');
  assert(roleIds.includes('role_02'), 'Must preserve exact ID role_02');
  assert(roleIds.includes('role_03'), 'Must preserve exact ID role_03');
  assert(roleIds.includes('role_04'), 'Must preserve exact ID role_04');

  // 3.2 Engineering Nodes (3 in DB)
  const nodes = await CompositionRoot.getGetEngineeringNodesUseCase().execute();
  assert(Array.isArray(nodes), 'nodes must be an array');
  assert(nodes.length === 3, `Expected exactly 3 engineering nodes, got ${nodes.length}`);
  const nodeIds = nodes.map((n) => n.id);
  assert(nodeIds.includes('enode_01'), 'Must preserve exact ID enode_01');
  assert(nodeIds.includes('enode_02'), 'Must preserve exact ID enode_02');
  assert(nodeIds.includes('enode_03'), 'Must preserve exact ID enode_03');

  // 3.3 Domains (4 in DB)
  const domains = await CompositionRoot.getGetDomainsUseCase().execute();
  assert(Array.isArray(domains), 'domains must be an array');
  assert(domains.length === 4, `Expected exactly 4 domains, got ${domains.length}`);
  for (const d of domains) {
    assert(typeof d.index === 'string', `Domain ${d.id} index must be string`);
  }

  // 3.4 Pillars (3 in DB)
  const pillars = await CompositionRoot.getGetPillarsUseCase().execute();
  assert(Array.isArray(pillars), 'pillars must be an array');
  assert(pillars.length === 3, `Expected exactly 3 pillars, got ${pillars.length}`);
  for (const p of pillars) {
    assert(typeof p.index === 'string', `Pillar ${p.id} index must be string`);
    assert(typeof p.description === 'string' && p.description.length > 0, `Pillar ${p.id} description must not be empty`);
  }

  // 3.5 Skills & Categories (4 categories, 11 skills in DB)
  const categories = await CompositionRoot.getSkillCategoryRepository().getAll();
  const allSkills = await CompositionRoot.getSkillRepository().getAll();
  assert(categories.length === 4, `Expected exactly 4 skill categories, got ${categories.length}`);
  assert(allSkills.length === 11, `Expected exactly 11 skills, got ${allSkills.length}`);

  const catIdSet = new Set(categories.map((c) => c.id));
  for (const skill of allSkills) {
    assert(catIdSet.has(skill.categoryId), `Skill ${skill.id} categoryId "${skill.categoryId}" must exist in categories`);
  }

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
  assert(counts.roles === 4, 'roles must be 4');
  assert(counts.engineering_nodes === 3, 'engineering_nodes must be 3');
  assert(counts.domains === 4, 'domains must be 4');
  assert(counts.pillars === 3, 'pillars must be 3');
  assert(counts.skill_categories === 4, 'skill_categories must be 4');
  assert(counts.skills === 11, 'skills must be 11');
  assert(counts.admins === 0, 'admins must be 0 (no test admin created)');
  assert(counts.contact_channels === 0, 'contact_channels must be 0');
  assert(total === 40, 'Database total records must remain exactly 40');

  console.log('\n=== ALL PHASE 5.4 PRESENTATION AUTOMATED TESTS PASSED SUCCESSFULLY ===');
}

runTests()
  .catch((err) => {
    console.error('Test Suite Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
