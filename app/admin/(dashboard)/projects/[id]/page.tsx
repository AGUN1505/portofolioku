// app/admin/(dashboard)/projects/[id]/page.tsx
// Sub-Route: Edit Project Form

import Link from 'next/link';
import { CompositionRoot } from '../../../../../src/infrastructure/composition-root';
import { ProjectForm } from '../ProjectForm';

interface EditProjectPageProps {
  readonly params: Promise<{ readonly id: string }>;
}

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { id } = await params;
  const getProjectByIdUseCase = CompositionRoot.getGetProjectByIdUseCase();
  const project = await getProjectByIdUseCase.execute(id);

  if (!project) {
    return (
      <div className="space-y-6">
        <header className="pb-5 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
            <Link href="/admin/projects" className="hover:text-[var(--text-primary)] transition-colors">
              Projects
            </Link>
            <span>/</span>
            <span className="text-red-600 uppercase">Not Found</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mt-2">
            Project Not Found
          </h1>
        </header>

        <div className="p-8 bg-white border border-[var(--border-subtle)] text-center space-y-4">
          <p className="font-mono text-xs uppercase tracking-wider text-red-600">
            Record ID &quot;{id}&quot; does not exist
          </p>
          <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
            The requested project may have been deleted or the identifier in the URL is incorrect.
          </p>
          <div>
            <Link
              href="/admin/projects"
              className="inline-flex px-4 py-2 border border-[var(--border-subtle)] text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] hover:border-[var(--text-primary)]"
            >
              ← Back to Projects List
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
          <Link href="/admin/projects" className="hover:text-[var(--text-primary)] transition-colors">
            Projects
          </Link>
          <span>/</span>
          <span className="text-[var(--accent-cobalt)] uppercase">Edit Project</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mt-2">
          {project.title}
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1.5 max-w-2xl leading-relaxed">
          Update case study copy, technologies tags, publication status, or external repository and demo URLs.
        </p>
      </header>

      {/* Form Container */}
      <div className="bg-white border border-[var(--border-subtle)] p-6">
        <ProjectForm mode="edit" initialData={project} />
      </div>
    </div>
  );
}
