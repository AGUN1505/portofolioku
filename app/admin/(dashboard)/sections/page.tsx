// app/admin/(dashboard)/sections/page.tsx
// Section Order Management Page (Protected Server Component with Suspense boundary)

import { Suspense } from 'react';
import { connection } from 'next/server';
import { CompositionRoot } from '../../../../src/infrastructure/composition-root';
import { SectionListClient } from './SectionListClient';
import AdminLoading from '../loading';

export const instant = false;

async function SectionsContent() {
  await connection();
  const getSectionsUseCase = CompositionRoot.getGetSectionConfigsUseCase();
  const sections = await getSectionsUseCase.execute();

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <header className="pb-5 border-b border-[var(--border-subtle)] flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase font-mono tracking-widest text-[var(--accent-cobalt)]">
            Core System
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mt-1">
            Section Order
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 max-w-2xl leading-relaxed">
            Configure vertical sequencing, presentation priority, and layout structure of portfolio sections.
          </p>
        </div>
      </header>

      {/* Main Collection View */}
      <SectionListClient initialSections={sections} />
    </div>
  );
}

export default function SectionsPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <SectionsContent />
    </Suspense>
  );
}
