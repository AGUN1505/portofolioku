// app/admin/(dashboard)/skills/page.tsx
// Module 7: Skills and Skill Categories Management (Clean Architecture Presentation Layer)

import { CompositionRoot } from '../../../../src/infrastructure/composition-root';
import { SkillCategoryListClient, type SkillCategoryWithSkills } from './SkillCategoryListClient';

export default async function SkillsPage() {
  const categoryRepo = CompositionRoot.getSkillCategoryRepository();
  const skillRepo = CompositionRoot.getSkillRepository();

  const [categories, allSkills] = await Promise.all([
    categoryRepo.getAll(),
    skillRepo.getAll(),
  ]);

  // Group skills into their respective categories
  const categoriesWithSkills: SkillCategoryWithSkills[] = categories.map((cat) => ({
    ...cat,
    skills: allSkills.filter((s) => s.categoryId === cat.id),
  }));

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <header className="pb-5 border-b border-[var(--border-subtle)] flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase font-mono tracking-widest text-[var(--accent-cobalt)]">
            Engineering Practice
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mt-1">
            Skills &amp; Categories Management
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 max-w-2xl leading-relaxed">
            Manage technical skill categories, grouped competencies, cross-category transfers, cascade deletion protections, and dual-level sequence ordering.
          </p>
        </div>
      </header>

      {/* Main Collection View */}
      <SkillCategoryListClient initialCategories={categoriesWithSkills} />
    </div>
  );
}
