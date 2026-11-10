// app/admin/(dashboard)/hero/page.tsx
// Module 2: Hero Profile Management (Singleton)

import { CompositionRoot } from '../../../../src/infrastructure/composition-root';
import { HeroForm } from './HeroForm';

export default async function HeroProfilePage() {
  const useCase = CompositionRoot.getGetHeroProfileUseCase();
  const profile = await useCase.execute();

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <header className="pb-5 border-b border-[var(--border-subtle)]">
        <p className="text-xs uppercase font-mono tracking-widest text-[var(--accent-cobalt)]">
          Hero Section
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mt-1">
          Hero Profile
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1.5 max-w-2xl leading-relaxed">
          Manage core public identity, headline tagline, editorial bio narrative, country code, and discipline metadata.
        </p>
      </header>

      {/* Record State / Form Area */}
      {!profile ? (
        <div className="p-6 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-mono">
          <p className="font-bold">NOTICE: Singleton record not found.</p>
          <p className="mt-1 text-amber-800">
            The HeroProfile singleton record is missing from the database. Automatic record generation is disallowed per Stage 10.4 safety constraints.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[var(--border-subtle)] p-6">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-[var(--border-subtle)]">
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-secondary)]">
              Model: HeroProfile • ID: {profile.id}
            </span>
            {profile.updatedAt && (
              <span className="font-mono text-[11px] text-[var(--text-secondary)]">
                Last modified: {new Date(profile.updatedAt).toLocaleString()}
              </span>
            )}
          </div>
          <HeroForm initialData={profile} />
        </div>
      )}
    </div>
  );
}
