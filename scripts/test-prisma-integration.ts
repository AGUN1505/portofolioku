// scripts/test-prisma-integration.ts
// Verification script for Stage 10.2.2: Prisma & PostgreSQL Integration

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import * as assert from 'node:assert';
import { prisma } from '../src/infrastructure/prisma/client';
import { PrismaPortfolioRepository } from '../src/infrastructure/repositories/prisma-portfolio.repository';
import { StaticPortfolioRepository } from '../src/infrastructure/repositories/static-portfolio.repository';
import { PrismaPortfolioMapper } from '../src/infrastructure/mappers/prisma-portfolio.mapper';
import { CompositionRoot } from '../src/infrastructure/composition-root';

async function runTests() {
  console.log('--- STARTING STAGE 10.2.2 INTEGRATION TESTS ---');

  // Test 1: Prisma Client Connection & Isolation
  console.log('Test 1: Verifying DB connection to porto_cms...');
  const dbResult = await prisma.$queryRaw<Array<{ current_database: string; current_user: string }>>`
    SELECT current_database(), current_user;
  `;
  assert.equal(dbResult[0].current_database, 'porto_cms', 'Database must be porto_cms');
  console.log('✓ Connected to porto_cms successfully.');

  // Test 2: PrismaPortfolioRepository Data Retrieval
  console.log('Test 2: Verifying PrismaPortfolioRepository.getPortfolioData()...');
  const prismaRepo = new PrismaPortfolioRepository(prisma);
  const data = await prismaRepo.getPortfolioData();

  // Validate Hero
  assert.equal(data.hero.name, 'Agun Firmansyah');
  assert.equal(data.hero.roles.length, 4);
  assert.equal(data.hero.roles[0].title, 'Software Developer');
  assert.equal(data.hero.engineeringNodes.length, 3);
  console.log('✓ Hero Profile retrieved and mapped.');

  // Validate About
  assert.equal(data.about.heading, 'About & Philosophy');
  assert.equal(data.about.domains.length, 4);
  assert.equal(data.about.pillars.length, 3);
  console.log('✓ About Profile retrieved and mapped.');

  // Validate Projects
  assert.equal(data.projects.length, 3);
  assert.equal(data.projects[0].title, 'Water Reminder App');
  assert.deepEqual(data.projects[0].technologies, ['Flutter', 'Laravel', 'REST API']);
  console.log('✓ Projects retrieved and mapped.');

  // Validate Experiences
  assert.equal(data.experiences.length, 5);
  assert.equal(data.experiences[0].role, 'Programming Teacher');
  assert.equal(data.experiences[0].institution, 'Timedoor Academy');
  console.log('✓ Experiences retrieved and mapped.');

  // Validate Skills
  assert.equal(data.skills.categories.length, 4);
  const totalSkills = data.skills.categories.reduce((acc, c) => acc + c.skills.length, 0);
  assert.equal(totalSkills, 11);
  console.log('✓ Skill taxonomy retrieved and mapped.');

  // Validate Contact
  assert.equal(data.contact.heading, "Let's build something together.");
  assert.equal(data.contact.channels.length, 0); // Withheld per rule
  console.log('✓ Contact Profile retrieved (empty channels as expected).');

  // Test 3: Comparison with StaticPortfolioRepository
  console.log('Test 3: Comparing Prisma data vs Static data...');
  const staticRepo = new StaticPortfolioRepository();
  const staticData = staticRepo.getPortfolioData();

  assert.equal(data.hero.name, staticData.hero.name);
  assert.equal(data.hero.bio, staticData.hero.bio);
  assert.equal(data.about.heading, staticData.about.heading);
  assert.equal(data.about.quote, staticData.about.quote);
  assert.equal(data.projects.length, staticData.projects.length);
  assert.equal(data.experiences.length, staticData.experiences.length);
  assert.equal(data.skills.categories.length, staticData.skills.categories.length);
  console.log('✓ Data parity between Prisma and Static repositories verified.');

  // Test 4: Mapper Graceful Degradation on null / empty
  console.log('Test 4: Verifying mapper graceful fallback on empty inputs...');
  const emptyHero = PrismaPortfolioMapper.toHeroProfile(null, [], []);
  assert.equal(emptyHero.name, '');
  assert.equal(emptyHero.roles.length, 0);

  const emptyAbout = PrismaPortfolioMapper.toAboutProfile(null, [], []);
  assert.equal(emptyAbout.heading, '');

  const emptyContact = PrismaPortfolioMapper.toContactProfile(null, []);
  assert.equal(emptyContact.heading, '');
  assert.equal(emptyContact.channels.length, 0);
  console.log('✓ Mapper fallback handles null/empty records without throwing.');

  // Test 5: Composition Root & Use Case Execution
  console.log('Test 5: Verifying CompositionRoot dependency injection...');
  const staticUseCase = CompositionRoot.getPortfolioUseCase('static');
  const staticResult = staticUseCase.execute();
  assert.equal(staticResult.hero.name, 'Agun Firmansyah');

  const prismaUseCase = CompositionRoot.getPortfolioUseCase('prisma');
  const prismaResult = await prismaUseCase.execute();
  assert.equal(prismaResult.hero.name, 'Agun Firmansyah');
  console.log('✓ CompositionRoot and GetPortfolioUseCase work with both repositories.');

  // Test 6: Verify Database Unmutated
  console.log('Test 6: Verifying DB records remain intact (no unintended mutations)...');
  const counts = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT count(*) FROM projects;
  `;
  assert.equal(Number(counts[0].count), 3);
  console.log('✓ DB records unmutated.');

  console.log('--- ALL INTEGRATION TESTS PASSED (6/6) ---');
}

runTests()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('Integration test failed:', err);
    await prisma.$disconnect();
    process.exit(1);
  });
