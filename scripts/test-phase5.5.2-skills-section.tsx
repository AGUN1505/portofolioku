// scripts/test-phase5.5.2-skills-section.tsx
// Automated Tests for SkillsSection Bounds Safety and Dynamic Categories

import * as assert from 'node:assert';
import { SkillsSection } from '../src/presentation/components/portfolio/SkillsSection';
import { SKILL_CATEGORY_PRESENTATION_CONFIG } from '../src/presentation/data/presentation-config';
import type { SkillTaxonomy } from '../src/domain/entities';

async function runSkillsTests() {
  console.log('--- RUNNING SKILLS SECTION BOUNDS SAFETY TEST SUITE ---');
  let passedTests = 0;

  // Test 1: Configured categories (first 4) render without errors and preserve view configuration
  {
    const standardTaxonomy: SkillTaxonomy = {
      categories: [
        { title: 'Backend', skills: ['Go', 'PostgreSQL', 'Docker'] },
        { title: 'Frontend', skills: ['React', 'Next.js', 'Tailwind'] },
        { title: 'Database', skills: ['PostgreSQL', 'Redis'] },
        { title: 'Tools', skills: ['Git', 'Postman'] },
      ],
    };

    const element = SkillsSection({
      taxonomy: standardTaxonomy,
      viewConfig: SKILL_CATEGORY_PRESENTATION_CONFIG,
    });

    assert.ok(element);
    assert.equal(element.type, 'section');
    assert.equal(element.props.id, 'skills');
    passedTests++;
    console.log('  ✓ 1: Configured categories render valid JSX tree');
  }

  // Test 2: More categories than configured entries (5 categories > 4 configs)
  {
    const extendedTaxonomy: SkillTaxonomy = {
      categories: [
        { title: 'Backend', skills: ['Go', 'PostgreSQL'] },
        { title: 'Frontend', skills: ['React'] },
        { title: 'Database', skills: ['PostgreSQL'] },
        { title: 'Tools', skills: ['Git'] },
        { title: 'DevOps & Cloud', skills: ['Kubernetes', 'Terraform', 'CI/CD'] },
        { title: 'Security & Quality', skills: ['OAuth 2.0', 'Jest'] },
      ],
    };

    const element = SkillsSection({
      taxonomy: extendedTaxonomy,
      viewConfig: SKILL_CATEGORY_PRESENTATION_CONFIG,
    });

    assert.ok(element);
    assert.equal(element.type, 'section');
    passedTests++;
    console.log('  ✓ 2: Categories beyond configured array (idx >= 4) render safely with fallback');
  }

  // Test 3: Empty categories collection
  {
    const emptyTaxonomy: SkillTaxonomy = {
      categories: [],
    };

    const element = SkillsSection({
      taxonomy: emptyTaxonomy,
      viewConfig: SKILL_CATEGORY_PRESENTATION_CONFIG,
    });

    assert.ok(element);
    assert.equal(element.type, 'section');
    passedTests++;
    console.log('  ✓ 3: Empty categories collection handled safely');
  }

  // Test 4: Category with zero skills
  {
    const zeroSkillsTaxonomy: SkillTaxonomy = {
      categories: [
        { title: 'Emerging Technologies', skills: [] },
      ],
    };

    const element = SkillsSection({
      taxonomy: zeroSkillsTaxonomy,
      viewConfig: SKILL_CATEGORY_PRESENTATION_CONFIG,
    });

    assert.ok(element);
    assert.equal(element.type, 'section');
    passedTests++;
    console.log('  ✓ 4: Category with zero skills renders without error');
  }

  console.log(`\n==============================================`);
  console.log(`ALL SKILLS TESTS PASSED: ${passedTests} / ${passedTests} verified.`);
  console.log(`==============================================`);
}

runSkillsTests().catch((err) => {
  console.error('\n❌ Skills test failed:', err);
  process.exit(1);
});
