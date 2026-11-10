// app/admin/(dashboard)/projects/page.tsx
// Module 8: Projects Showcase Management (Clean Architecture Presentation Layer)

import Link from 'next/link';
import { CompositionRoot } from '../../../../src/infrastructure/composition-root';
import { ProjectListClient } from './ProjectListClient';

export default async function ProjectsPage() {
  const getProjectsUseCase = CompositionRoot.getGetProjectsUseCase();
  const projects = await getProjectsUseCase.execute();

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <header className="pb-5 border-b border-[var(--border-subtle)] flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase font-mono tracking-widest text-[var(--accent-cobalt)]">
            Work & History
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mt-1">
            Projects Management
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 max-w-2xl leading-relaxed">
            Manage portfolio case studies, technical summaries, JSON technology arrays, publication visibility toggles, external thumbnail links, and project repositories.
          </p>
        </div>
        <Link
          href="/admin/projects/new"
          className="px-5 py-2.5 bg-[var(--text-primary)] text-white text-xs font-mono tracking-widest uppercase hover:bg-black transition-colors shrink-0"
        >
          + New Project
        </Link>
      </header>

      {/* Main Collection View */}
      <ProjectListClient initialProjects={projects} />
    </div>
  );
}
