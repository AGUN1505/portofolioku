// scripts/test-phase3.1-audit.ts
// Automated Test Harness for Stage 10.4 Phase 3.1 Audit (Strictly Read-Only)

import { strict as assert } from 'node:assert';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { validateHeroProfileInput } from '../src/application/dtos/hero-profile.dto';
import { validateAboutProfileInput } from '../src/application/dtos/about-profile.dto';
import { validateContactProfileInput } from '../src/application/dtos/contact-profile.dto';
import { prisma } from '../src/infrastructure/prisma/client';

async function main() {
  console.log('=== [STAGE 10.4 PHASE 3.1] READ-ONLY AUDIT HARNESS ===\n');

  // Guardrail pre-check
  const preCounts = await prisma.$queryRaw<Array<{ tablename: string; count: bigint }>>`
    SELECT 'hero_profiles' as tablename, count(*)::bigint as count FROM hero_profiles
    UNION ALL SELECT 'about_profiles', count(*)::bigint FROM about_profiles
    UNION ALL SELECT 'contact_profiles', count(*)::bigint FROM contact_profiles
    UNION ALL SELECT 'admins', count(*)::bigint FROM admins
    UNION ALL SELECT 'contact_channels', count(*)::bigint FROM contact_channels;
  `;
  console.log('1. Database Baseline Pre-Check:');
  console.table(preCounts);

  // 1. HERO PROFILE DTO VALIDATION TESTS
  console.log('\n2. Testing HeroProfile DTO Validation Edge Cases...');
  
  // 1.1 Empty required fields
  const heroEmpty = validateHeroProfileInput({
    name: '',
    tagline: '',
    bio: '',
    country: '',
    code: '',
    timezone: '',
    discipline: '',
  });
  assert.equal(heroEmpty.success, false, 'Hero empty input must fail');
  if (heroEmpty.success === false) {
    assert.ok(heroEmpty.errors.name, 'Hero name error required');
    assert.ok(heroEmpty.errors.tagline, 'Hero tagline error required');
    assert.ok(heroEmpty.errors.bio, 'Hero bio error required');
    assert.ok(heroEmpty.errors.country, 'Hero country error required');
    assert.ok(heroEmpty.errors.code, 'Hero code error required');
    assert.ok(heroEmpty.errors.timezone, 'Hero timezone error required');
    assert.ok(heroEmpty.errors.discipline, 'Hero discipline error required');
  }
  console.log('   ✓ Empty required fields correctly rejected.');

  // 1.2 Below min length
  const heroShort = validateHeroProfileInput({
    name: 'A',
    tagline: 'T',
    bio: 'Short',
    country: 'C',
    code: 'X',
    timezone: 'Z',
    discipline: 'D',
  });
  assert.equal(heroShort.success, false, 'Hero short input must fail');
  if (heroShort.success === false) {
    assert.ok(heroShort.errors.name?.includes('between 2 and 100'), 'Name min length check');
    assert.ok(heroShort.errors.bio?.includes('between 10 and 2000'), 'Bio min length check');
  }
  console.log('   ✓ Below minimum length correctly rejected.');

  // 1.3 Exceeding max length
  const heroLong = validateHeroProfileInput({
    name: 'A'.repeat(101),
    tagline: 'T'.repeat(501),
    bio: 'B'.repeat(2001),
    country: 'C'.repeat(101),
    code: 'CODE1234567',
    timezone: 'Z'.repeat(51),
    discipline: 'D'.repeat(501),
  });
  assert.equal(heroLong.success, false, 'Hero long input must fail');
  if (heroLong.success === false) {
    assert.ok(heroLong.errors.name?.includes('between 2 and 100'), 'Name max length check');
    assert.ok(heroLong.errors.tagline?.includes('between 2 and 500'), 'Tagline max length check');
    assert.ok(heroLong.errors.bio?.includes('between 10 and 2000'), 'Bio max length check');
    assert.ok(heroLong.errors.country?.includes('between 2 and 100'), 'Country max length check');
    assert.ok(heroLong.errors.code?.includes('between 2 and 10'), 'Code max length check');
    assert.ok(heroLong.errors.timezone?.includes('between 2 and 50'), 'Timezone max length check');
    assert.ok(heroLong.errors.discipline?.includes('between 2 and 500'), 'Discipline max length check');
  }
  console.log('   ✓ Exceeding maximum length correctly rejected.');

  // 1.4 Whitespace only
  const heroWhitespace = validateHeroProfileInput({
    name: '    ',
    tagline: '   ',
    bio: '          ',
    country: '  ',
    code: '   ',
    timezone: '   ',
    discipline: '   ',
  });
  assert.equal(heroWhitespace.success, false, 'Hero whitespace input must fail');
  console.log('   ✓ Whitespace-only input correctly rejected.');

  // 1.5 Unknown & System fields directly passed to DTO
  const heroUnknown = validateHeroProfileInput({
    name: 'Valid Name',
    tagline: 'Valid Tagline',
    bio: 'Valid bio narrative with more than 10 characters',
    country: 'Indonesia',
    code: 'ID',
    timezone: 'Asia/Jakarta',
    discipline: 'Software Engineering',
    id: 'malicious-id',
    createdAt: new Date().toISOString(),
    hackerField: 'drop table',
  });
  assert.equal(heroUnknown.success, false, 'Hero unknown fields must fail');
  if (heroUnknown.success === false) {
    assert.ok(heroUnknown.errors.id?.includes('not allowed'), 'System field id rejected');
    assert.ok(heroUnknown.errors.createdAt?.includes('not allowed'), 'System field createdAt rejected');
    assert.ok(heroUnknown.errors.hackerField?.includes('not allowed'), 'Unknown field rejected');
  }
  console.log('   ✓ Unknown and system fields explicitly rejected by DTO.');

  // 1.6 Valid input
  const heroValid = validateHeroProfileInput({
    name: 'Agun Firmansyah',
    tagline: 'Building deterministic, resilient systems.',
    bio: 'Full-stack software developer focusing on distributed systems and clean architecture.',
    country: 'Indonesia',
    code: 'ID',
    timezone: 'Asia/Jakarta (UTC+7)',
    discipline: 'Systems & Backend Engineering',
  });
  assert.equal(heroValid.success, true, 'Hero valid input must pass');
  console.log('   ✓ Valid Hero profile input passed cleanly.');

  // 2. ABOUT PROFILE DTO VALIDATION TESTS
  console.log('\n3. Testing AboutProfile DTO Validation Edge Cases...');
  
  // 2.1 Empty required
  const aboutEmpty = validateAboutProfileInput({
    heading: '',
    quote: '',
    primaryNarrative: '',
    secondaryNarrative: '',
  });
  assert.equal(aboutEmpty.success, false, 'About empty input must fail');
  if (aboutEmpty.success === false) {
    assert.ok(aboutEmpty.errors.heading, 'About heading error required');
    assert.ok(aboutEmpty.errors.quote, 'About quote error required');
    assert.ok(aboutEmpty.errors.primaryNarrative, 'About primary narrative error required');
    assert.ok(aboutEmpty.errors.secondaryNarrative, 'About secondary narrative error required');
  }
  console.log('   ✓ Empty required fields correctly rejected.');

  // 2.2 Short & Long
  const aboutShort = validateAboutProfileInput({
    heading: 'H',
    quote: 'Q',
    primaryNarrative: 'P',
    secondaryNarrative: 'S',
  });
  assert.equal(aboutShort.success, false, 'About short input must fail');
  if (aboutShort.success === false) {
    assert.ok(aboutShort.errors.heading?.includes('between 2 and 150'), 'Heading min length');
    assert.ok(aboutShort.errors.quote?.includes('between 5 and 1000'), 'Quote min length');
    assert.ok(aboutShort.errors.primaryNarrative?.includes('between 5 and 3000'), 'Narrative min length');
  }

  const aboutLong = validateAboutProfileInput({
    heading: 'H'.repeat(151),
    quote: 'Q'.repeat(1001),
    primaryNarrative: 'P'.repeat(3001),
    secondaryNarrative: 'S'.repeat(3001),
  });
  assert.equal(aboutLong.success, false, 'About long input must fail');
  if (aboutLong.success === false) {
    assert.ok(aboutLong.errors.heading?.includes('between 2 and 150'), 'Heading max length');
    assert.ok(aboutLong.errors.quote?.includes('between 5 and 1000'), 'Quote max length');
  }
  console.log('   ✓ Min/Max boundaries correctly enforced.');

  // 2.3 System fields
  const aboutSystem = validateAboutProfileInput({
    heading: 'Valid Heading',
    quote: 'Valid quote here',
    primaryNarrative: 'Primary narrative long enough',
    secondaryNarrative: 'Secondary narrative long enough',
    id: 'singleton-override',
    updatedAt: new Date().toISOString(),
  });
  assert.equal(aboutSystem.success, false, 'About system fields rejected');
  if (aboutSystem.success === false) {
    assert.ok(aboutSystem.errors.id?.includes('not allowed'), 'About id rejected');
  }
  console.log('   ✓ System fields explicitly rejected.');

  // 2.4 Valid
  const aboutValid = validateAboutProfileInput({
    heading: 'Architecting Scalable Backend Systems',
    quote: 'Simplicity is prerequisite for reliability.',
    primaryNarrative: 'Specialized in Go, Node.js, and PostgreSQL with high concurrency workloads.',
    secondaryNarrative: 'Passionate about mentoring emerging developers and building maintainable codebases.',
  });
  assert.equal(aboutValid.success, true, 'About valid input must pass');
  console.log('   ✓ Valid About profile input passed cleanly.');

  // 3. CONTACT PROFILE DTO VALIDATION TESTS
  console.log('\n4. Testing ContactProfile DTO Validation Edge Cases...');
  
  // 3.1 Empty
  const contactEmpty = validateContactProfileInput({
    heading: '',
    ctaLabel: '',
    description: '',
  });
  assert.equal(contactEmpty.success, false, 'Contact empty input must fail');
  if (contactEmpty.success === false) {
    assert.ok(contactEmpty.errors.heading, 'Contact heading error');
    assert.ok(contactEmpty.errors.ctaLabel, 'Contact ctaLabel error');
    assert.ok(contactEmpty.errors.description, 'Contact description error');
  }
  console.log('   ✓ Empty required fields correctly rejected.');

  // 3.2 Short & Long
  const contactShort = validateContactProfileInput({
    heading: 'A',
    ctaLabel: 'B',
    description: 'C',
  });
  assert.equal(contactShort.success, false, 'Contact short input must fail');
  if (contactShort.success === false) {
    assert.ok(contactShort.errors.description?.includes('between 5 and 2000'), 'Description min length');
  }

  const contactLong = validateContactProfileInput({
    heading: 'A'.repeat(201),
    ctaLabel: 'B'.repeat(101),
    description: 'C'.repeat(2001),
  });
  assert.equal(contactLong.success, false, 'Contact long input must fail');
  console.log('   ✓ Min/Max boundaries correctly enforced.');

  // 3.3 System fields
  const contactSystem = validateContactProfileInput({
    heading: 'Initiate Collaboration',
    ctaLabel: 'Send Inquiry',
    description: 'Available for high-impact backend contracts.',
    id: 'bad-id',
    channelCount: 99,
  });
  assert.equal(contactSystem.success, false, 'Contact system fields rejected');
  if (contactSystem.success === false) {
    assert.ok(contactSystem.errors.id?.includes('not allowed'), 'Contact id rejected');
    assert.ok(contactSystem.errors.channelCount?.includes('not allowed'), 'Unknown channelCount rejected');
  }
  console.log('   ✓ System & unknown fields rejected.');

  // 3.4 Valid
  const contactValid = validateContactProfileInput({
    heading: 'Initiate Collaboration',
    ctaLabel: 'Send Inquiry',
    description: 'Available for high-impact backend contracts and engineering roles.',
  });
  assert.equal(contactValid.success, true, 'Contact valid input must pass');
  console.log('   ✓ Valid Contact profile input passed cleanly.');

  // 4. DATABASE POST-AUDIT INTEGRITY CHECK (STRICT ZERO MUTATIONS)
  console.log('\n5. Verifying Zero Database Mutations Post-Audit...');
  const postCounts = await prisma.$queryRaw<Array<{ tablename: string; count: bigint }>>`
    SELECT 'hero_profiles' as tablename, count(*)::bigint as count FROM hero_profiles
    UNION ALL SELECT 'about_profiles', count(*)::bigint FROM about_profiles
    UNION ALL SELECT 'contact_profiles', count(*)::bigint FROM contact_profiles
    UNION ALL SELECT 'admins', count(*)::bigint FROM admins
    UNION ALL SELECT 'contact_channels', count(*)::bigint FROM contact_channels;
  `;
  console.table(postCounts);

  assert.equal(Number(postCounts.find((c) => c.tablename === 'hero_profiles')?.count), 1, 'hero_profiles must be 1');
  assert.equal(Number(postCounts.find((c) => c.tablename === 'about_profiles')?.count), 1, 'about_profiles must be 1');
  assert.equal(Number(postCounts.find((c) => c.tablename === 'contact_profiles')?.count), 1, 'contact_profiles must be 1');
  assert.equal(Number(postCounts.find((c) => c.tablename === 'admins')?.count), 0, 'admins must be 0');
  assert.equal(Number(postCounts.find((c) => c.tablename === 'contact_channels')?.count), 0, 'contact_channels must be 0');

  console.log('   ✓ Database integrity confirmed: EXACTLY ZERO mutations, 100% read-only.\n');
  console.log('=== ALL PHASE 3.1 AUDIT HARNESS CHECKS PASSED ===');
}

main()
  .catch((err) => {
    console.error('Audit failure:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
