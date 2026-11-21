// app/admin/(dashboard)/contact/page.tsx
// Module 8: Contact Profile Management (Singleton)

import { connection } from 'next/server';
import { CompositionRoot } from '../../../../src/infrastructure/composition-root';
import { ContactForm } from './ContactForm';

export const instant = false;

export default async function ContactProfilePage() {
  await connection();
  const useCase = CompositionRoot.getGetContactProfileUseCase();
  const profile = await useCase.execute();

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <header className="pb-5 border-b border-[var(--border-subtle)]">
        <p className="text-xs uppercase font-mono tracking-widest text-[var(--accent-cobalt)]">
          Contact Section
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mt-1">
          Contact Profile
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1.5 max-w-2xl leading-relaxed">
          Manage contact section heading, call-to-action button label, and availability narrative.
        </p>
      </header>

      {/* Record State / Form Area */}
      {!profile ? (
        <div className="p-6 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-mono">
          <p className="font-bold">NOTICE: Singleton record not found.</p>
          <p className="mt-1 text-amber-800">
            The ContactProfile singleton record is missing from the database. Automatic record generation is disallowed per Stage 10.4 safety constraints.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[var(--border-subtle)] p-6">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-[var(--border-subtle)]">
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-secondary)]">
              Model: ContactProfile • ID: {profile.id}
            </span>
            {profile.updatedAt && (
              <span className="font-mono text-[11px] text-[var(--text-secondary)]">
                Last modified: {new Date(profile.updatedAt).toLocaleString()}
              </span>
            )}
          </div>
          <ContactForm initialData={profile} />
        </div>
      )}
    </div>
  );
}
