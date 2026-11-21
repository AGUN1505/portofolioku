// app/admin/(dashboard)/experiences/page.tsx
// Module 9: Experiences Chronology Management (Clean Architecture Presentation Layer)

import Link from 'next/link';
import { connection } from 'next/server';
import { CompositionRoot } from '../../../../src/infrastructure/composition-root';
import { ExperienceListClient } from './ExperienceListClient';

export const instant = false;

export default async function ExperiencesPage() {
  await connection();
  const getExperiencesUseCase = CompositionRoot.getGetExperiencesUseCase();
  const experiences = await getExperiencesUseCase.execute();

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <header className="pb-5 border-b border-[var(--border-subtle)] flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase font-mono tracking-widest text-[var(--accent-cobalt)]">
            Work & History
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mt-1">
            Experiences Management
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 max-w-2xl leading-relaxed">
            Manage career milestones, academic tracks, role positions, date periods, descriptions, and chronological ordering.
          </p>
        </div>
        <Link
          href="/admin/experiences/new"
          className="px-5 py-2.5 bg-[var(--text-primary)] text-white text-xs font-mono tracking-widest uppercase hover:bg-black transition-colors shrink-0"
        >
          + New Experience
        </Link>
      </header>

      {/* Main Collection View */}
      <ExperienceListClient initialExperiences={experiences} />
    </div>
  );
}
