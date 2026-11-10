// scripts/test-phase3-singleton.ts
// Comprehensive Automated Tests for Stage 10.4 Phase 3 Core Singleton Modules

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { validateHeroProfileInput } from '../src/application/dtos/hero-profile.dto';
import { validateAboutProfileInput } from '../src/application/dtos/about-profile.dto';
import { validateContactProfileInput } from '../src/application/dtos/contact-profile.dto';
import { GetHeroProfileUseCase } from '../src/application/use-cases/hero/get-hero-profile.use-case';
import { UpdateHeroProfileUseCase } from '../src/application/use-cases/hero/update-hero-profile.use-case';
import type { IHeroProfileRepository } from '../src/domain/repositories/hero-profile.repository';
import type { HeroProfileRecord } from '../src/domain/entities/hero-profile-record';
import { prisma } from '../src/infrastructure/prisma/client';
import { CompositionRoot } from '../src/infrastructure/composition-root';
import { updateHeroProfileAction } from '../app/admin/(dashboard)/hero/actions';
import { updateAboutProfileAction } from '../app/admin/(dashboard)/about/actions';
import { updateContactProfileAction } from '../app/admin/(dashboard)/contact/actions';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log('=== [STAGE 10.4 PHASE 3] AUTOMATED TEST SUITE ===\n');

  // -----------------------------------------------------------------
  // 1. DTO & Validation Tests
  // -----------------------------------------------------------------
  console.log('1. Testing DTO Whitelist & Validation...');

  // Hero validation
  const validHero = validateHeroProfileInput({
    name: 'Agun Firmansyah',
    tagline: 'Software Developer',
    bio: 'Backend & Systems Engineer',
    country: 'Indonesia',
    code: 'ID',
    timezone: 'Asia/Jakarta',
    discipline: 'Backend Engineering',
  });
  assert(validHero.success === true, 'Valid hero input should succeed');

  const invalidHeroMissing = validateHeroProfileInput({
    name: '',
    tagline: 'Software Developer',
  });
  assert(invalidHeroMissing.success === false, 'Hero with empty name should fail');

  const invalidHeroUnknown = validateHeroProfileInput({
    name: 'Agun Firmansyah',
    tagline: 'Software Developer',
    bio: 'Backend & Systems Engineer',
    country: 'Indonesia',
    code: 'ID',
    timezone: 'Asia/Jakarta',
    discipline: 'Backend Engineering',
    hackerField: 'drop table',
  });
  assert(invalidHeroUnknown.success === false, 'Hero with unknown fields must fail whitelist');

  // About validation
  const validAbout = validateAboutProfileInput({
    heading: 'Architectural Philosophy',
    quote: 'Simplicity is prerequisite for reliability.',
    primaryNarrative: 'Primary bio narrative.',
    secondaryNarrative: 'Secondary bio narrative.',
  });
  assert(validAbout.success === true, 'Valid about input should succeed');

  const invalidAboutUnknown = validateAboutProfileInput({
    heading: 'Heading',
    quote: 'Quote',
    primaryNarrative: 'Primary',
    secondaryNarrative: 'Secondary',
    adminPrivilege: true,
  });
  assert(invalidAboutUnknown.success === false, 'About with unknown fields must fail whitelist');

  // Contact validation
  const validContact = validateContactProfileInput({
    heading: 'Get in Touch',
    ctaLabel: 'Initiate Contact',
    description: 'Available for high-scale backend engineering.',
  });
  assert(validContact.success === true, 'Valid contact input should succeed');

  const invalidContactEmpty = validateContactProfileInput({
    heading: 'Get in Touch',
    ctaLabel: '',
    description: 'Description',
  });
  assert(invalidContactEmpty.success === false, 'Contact with empty ctaLabel must fail');

  console.log('   ✓ DTO validation & whitelist security passed.\n');

  // -----------------------------------------------------------------
  // 2. Mock Use Case Tests
  // -----------------------------------------------------------------
  console.log('2. Testing Application Use Cases with Mock Repositories...');

  let mockHeroData: HeroProfileRecord = {
    id: 'singleton',
    name: 'Old Name',
    tagline: 'Old Tagline',
    bio: 'Old Bio',
    country: 'Indonesia',
    code: 'ID',
    timezone: 'Asia/Jakarta',
    discipline: 'Backend',
  };

  const mockHeroRepo: IHeroProfileRepository = {
    async getProfile() {
      return mockHeroData;
    },
    async updateProfile(data) {
      mockHeroData = { ...mockHeroData, ...data };
      return mockHeroData;
    },
  };

  const getHeroUseCase = new GetHeroProfileUseCase(mockHeroRepo);
  const fetchedHero = await getHeroUseCase.execute();
  assert(fetchedHero?.name === 'Old Name', 'GetHeroProfileUseCase returns profile');

  const updateHeroUseCase = new UpdateHeroProfileUseCase(mockHeroRepo);
  const updateResult = await updateHeroUseCase.execute({
    name: 'New Name',
    tagline: 'New Tagline',
    bio: 'New Bio narrative with at least 10 characters',
    country: 'Indonesia',
    code: 'ID',
    timezone: 'Asia/Jakarta',
    discipline: 'Systems',
  });
  assert(updateResult.success === true, 'UpdateHeroProfileUseCase succeeds with valid data');
  assert(mockHeroData.name === 'New Name', 'Mock repo updated with new name');

  console.log('   ✓ Mock use case operations passed.\n');

  // -----------------------------------------------------------------
  // 3. Database Singleton Retrieval & Read Integrity
  // -----------------------------------------------------------------
  console.log('3. Testing Prisma Repositories & Singleton IDs...');

  const liveHero = await CompositionRoot.getGetHeroProfileUseCase().execute();
  assert(liveHero !== null, 'Live hero profile must exist');
  assert(liveHero?.id === 'singleton', 'Live hero profile must have id=singleton');

  const liveAbout = await CompositionRoot.getGetAboutProfileUseCase().execute();
  assert(liveAbout !== null, 'Live about profile must exist');
  assert(liveAbout?.id === 'singleton', 'Live about profile must have id=singleton');

  const liveContact = await CompositionRoot.getGetContactProfileUseCase().execute();
  assert(liveContact !== null, 'Live contact profile must exist');
  assert(liveContact?.id === 'singleton', 'Live contact profile must have id=singleton');

  console.log('   ✓ Live singleton reading & id=singleton invariants verified.\n');

  // -----------------------------------------------------------------
  // 4. Server Action Security (Unauthenticated Rejection)
  // -----------------------------------------------------------------
  console.log('4. Testing Server Action Security & DAL Session Verification...');

  const dummyHeroFormData = new FormData();
  dummyHeroFormData.append('name', 'Hacker Attempt');
  dummyHeroFormData.append('tagline', 'Hacker Tagline');
  dummyHeroFormData.append('bio', 'Hacker Bio');
  dummyHeroFormData.append('country', 'Indonesia');
  dummyHeroFormData.append('code', 'ID');
  dummyHeroFormData.append('timezone', 'Asia/Jakarta');
  dummyHeroFormData.append('discipline', 'Hacking');

  const heroActionRes = await updateHeroProfileAction({ success: false }, dummyHeroFormData);
  assert(heroActionRes.success === false, 'Hero action must reject unauthenticated call');
  assert(
    Boolean(heroActionRes.error?.includes('Unauthorized') || heroActionRes.error?.includes('Authentication failed')),
    'Hero action returns security error'
  );

  const dummyAboutFormData = new FormData();
  dummyAboutFormData.append('heading', 'Hacker About');
  const aboutActionRes = await updateAboutProfileAction({ success: false }, dummyAboutFormData);
  assert(aboutActionRes.success === false, 'About action must reject unauthenticated call');

  const dummyContactFormData = new FormData();
  dummyContactFormData.append('heading', 'Hacker Contact');
  const contactActionRes = await updateContactProfileAction({ success: false }, dummyContactFormData);
  assert(contactActionRes.success === false, 'Contact action must reject unauthenticated call');

  console.log('   ✓ Unauthenticated requests rejected by verifySession() guard.\n');

  // -----------------------------------------------------------------
  // 5. Database Row Count Baseline Integrity Audit
  // -----------------------------------------------------------------
  console.log('5. Auditing Database Record Counts (Target = 40)...');

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
  assert(counts.about_profiles === 1, 'about_profiles must be 1');
  assert(counts.contact_profiles === 1, 'contact_profiles must be 1');
  assert(counts.contact_channels === 0, 'contact_channels must be 0');
  assert(counts.admins === 0, 'admins must be 0');
  assert(total === 40, 'Total records must remain 40');

  console.log('\n=== ALL PHASE 3 AUTOMATED TESTS PASSED SUCCESSFULLY ===');
}

runTests()
  .catch((err) => {
    console.error('Test Suite Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
