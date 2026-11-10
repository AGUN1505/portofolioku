// app/admin/(dashboard)/projects/new/page.tsx
// Sub-Route: Create New Project Form

import Link from 'next/link';
import { ProjectForm } from '../ProjectForm';

export default function NewProjectPage() {
  return (
    <div className="space-y-6">
      {/* Module Header */}
      <header className="pb-5 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
          <Link href="/admin/projects" className="hover:text-[var(--text-primary)] transition-colors">
            Projects
          </Link>
          <span>/</span>
          <span className="text-[var(--accent-cobalt)] uppercase">New Project</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mt-2">
          Create New Project
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1.5 max-w-2xl leading-relaxed">
          Author a new portfolio case study. External thumbnail image URLs are supported; file uploads are excluded per architecture decision.
        </p>
      </header>

      {/* Form Container */}
      <div className="bg-white border border-[var(--border-subtle)] p-6">
        <ProjectForm mode="create" />
      </div>
    </div>
  );
}
