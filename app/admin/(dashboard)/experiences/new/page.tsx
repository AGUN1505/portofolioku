// app/admin/(dashboard)/experiences/new/page.tsx
// Sub-Route: Create New Experience Form

import Link from 'next/link';
import { connection } from 'next/server';
import { ExperienceForm } from '../ExperienceForm';

export const instant = false;

export default async function NewExperiencePage() {
  await connection();
  return (
    <div className="space-y-6">
      {/* Module Header */}
      <header className="pb-5 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
          <Link href="/admin/experiences" className="hover:text-[var(--text-primary)] transition-colors">
            Experiences
          </Link>
          <span>/</span>
          <span className="text-[var(--accent-cobalt)] uppercase">New Experience</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mt-2">
          Create New Experience
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1.5 max-w-2xl leading-relaxed">
          Record a new career milestone, academic credential, or instructional role. Ongoing experiences can be flagged with no conclusion date.
        </p>
      </header>

      {/* Form Container */}
      <div className="bg-white border border-[var(--border-subtle)] p-6">
        <ExperienceForm mode="create" />
      </div>
    </div>
  );
}
