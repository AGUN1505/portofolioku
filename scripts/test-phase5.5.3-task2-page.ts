import * as dotenv from 'dotenv';
dotenv.config({ path: 'D:/portoku/porto/.env.local' });
dotenv.config({ path: '.env.local' });

import * as assert from 'node:assert';
import Home from '../app/page';
import { CompositionRoot } from '../src/infrastructure/composition-root';
import { PortfolioViewMapper } from '../src/presentation/mappers/portfolio-view-mapper';

console.log('=== TEST SUITE: Stage 10.5 Phase 5.5.3 Task 2 (Home Async Server Component) ===\n');

async function runTests() {
  console.log('1. Verifying Home is an async component function...');
  assert.equal(typeof Home, 'function', 'Home must be a function');
  assert.equal(Home.constructor.name, 'AsyncFunction', 'Home must be an async function');
  console.log('   ✓ Home component is an AsyncFunction\n');

  console.log('2. Verifying CompositionRoot.getResilientPortfolioUseCase execution...');
  const useCase = CompositionRoot.getResilientPortfolioUseCase();
  const portfolio = await useCase.execute();

  assert.ok(portfolio, 'Portfolio aggregate must not be null/undefined');
  assert.ok(portfolio.hero, 'portfolio.hero must exist');
  assert.ok(portfolio.about, 'portfolio.about must exist');
  assert.ok(portfolio.projects, 'portfolio.projects must exist');
  assert.ok(portfolio.experiences, 'portfolio.experiences must exist');
  assert.ok(portfolio.skills, 'portfolio.skills must exist');
  assert.ok(portfolio.contact, 'portfolio.contact must exist');
  console.log(`   ✓ Portfolio retrieved successfully (Hero: ${portfolio.hero.name})`);
  console.log(`   ✓ Hero roles: ${portfolio.hero.roles.length} items`);
  console.log(`   ✓ Engineering nodes: ${portfolio.hero.engineeringNodes.length} items`);
  console.log(`   ✓ Contact channels in DB: ${portfolio.contact.channels.length} items\n`);

  console.log('3. Verifying ViewMapper integration with dynamic portfolio data...');
  const heroRoles = PortfolioViewMapper.toHeroRoleViewModels(portfolio.hero.roles);
  const engineeringNodes = PortfolioViewMapper.toEngineeringNodeViewModels(portfolio.hero.engineeringNodes);
  const contactChannels = PortfolioViewMapper.toContactChannelViewModels(portfolio.contact.channels);

  assert.ok(heroRoles.length > 0, 'heroRoles must be non-empty (either mapped or fallback)');
  assert.ok(engineeringNodes.length > 0, 'engineeringNodes must be non-empty (either mapped or fallback)');
  assert.ok(Array.isArray(contactChannels), 'contactChannels must be an array');
  assert.equal(
    contactChannels.some((c) => c.value.toLowerCase().includes('placeholder')),
    false,
    'No placeholder contact channels allowed'
  );
  console.log('   ✓ ViewModels mapped cleanly with zero placeholders\n');

  console.log('4. Rendering Home() Server Component to inspect JSX tree...');
  const jsxElement = await Home();
  assert.ok(jsxElement, 'Home() must return a valid React element tree');
  assert.equal(typeof jsxElement, 'object', 'JSX element must be an object');
  console.log('   ✓ Home() executed and returned valid React element tree\n');

  console.log('=== ALL TASK 2 TESTS PASSED SUCCESSFULLY (100%) ===');
}

runTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
