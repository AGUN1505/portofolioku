// app/admin/(dashboard)/experiences/[id]/page.tsx
// Sub-Route: Edit Experience Form

import Link from 'next/link';
import { connection } from 'next/server';
import { CompositionRoot } from '../../../../../src/infrastructure/composition-root';
import { ExperienceForm } from '../ExperienceForm';

export const instant = false;

interface EditExperiencePageProps {
  readonly params: Promise<{ readonly id: string }>;
}

export default async function EditExperiencePage({ params }: EditExperiencePageProps) {
  await connection();
  const { id } = await params;
  const getExperienceByIdUseCase = CompositionRoot.getGetExperienceByIdUseCase();
  const experience = await getExperienceByIdUseCase.execute(id);

  if (!experience) {
    return (
      <div className="space-y-6">
        <header className="pb-5 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
            <Link href="/admin/experiences" className="hover:text-[var(--text-primary)] transition-colors">
              Experiences
            </Link>
            <span>/</span>
            <span className="text-red-600 uppercase">Not Found</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mt-2">
            Experience Not Found
          </h1>
        </header>

        <div className="p-8 bg-white border border-[var(--border-subtle)] text-center space-y-4">
          <p className="font-mono text-xs uppercase tracking-wider text-red-600">
            Record ID &quot;{id}&quot; does not exist
          </p>
          <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
            The requested experience record may have been removed or the identifier is invalid.
          </p>
          <div>
            <Link
              href="/admin/experiences"
              className="inline-flex px-4 py-2 border border-[var(--border-subtle)] text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] hover:border-[var(--text-primary)]"
            >
              ← Back to Experiences List
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <header className="pb-5 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
          <Link href="/admin/experiences" className="hover:text-[var(--text-primary)] transition-colors">
            Experiences
          </Link>
          <span>/</span>
          <span className="text-[var(--accent-cobalt)] uppercase">Edit Experience</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mt-2">
          {experience.role}
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1.5 max-w-2xl leading-relaxed">
          Update role designation, institution, track category, dates, ongoing status, or responsibilities narrative.
        </p>
      </header>

      {/* Form Container */}
      <div className="bg-white border border-[var(--border-subtle)] p-6">
        <ExperienceForm mode="edit" initialData={experience} />
      </div>
    </div>
  );
}
