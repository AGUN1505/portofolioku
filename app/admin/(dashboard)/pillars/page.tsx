// app/admin/(dashboard)/pillars/page.tsx
// Module 6: Engineering Pillars Management (Clean Architecture Presentation Layer)

import { connection } from 'next/server';
import { CompositionRoot } from '../../../../src/infrastructure/composition-root';
import { PillarListClient } from './PillarListClient';

export const instant = false;

export default async function PillarsPage() {
  await connection();
  const getPillarsUseCase = CompositionRoot.getGetPillarsUseCase();
  const pillars = await getPillarsUseCase.execute();

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <header className="pb-5 border-b border-[var(--border-subtle)] flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase font-mono tracking-widest text-[var(--accent-cobalt)]">
            Engineering Practice
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mt-1">
            Pillars Management
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 max-w-2xl leading-relaxed">
            Manage core engineering pillars, string indices, philosophical descriptions, and display sequence ordering.
          </p>
        </div>
      </header>

      {/* Main Collection View */}
      <PillarListClient initialPillars={pillars} />
    </div>
  );
}
