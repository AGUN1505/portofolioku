// app/admin/(dashboard)/projects/ProjectListClient.tsx
'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { reorderProjectsAction, deleteProjectAction } from './actions';
import type { ProjectRecord } from '../../../../src/domain/entities/project-record';

interface ProjectListClientProps {
  readonly initialProjects: readonly ProjectRecord[];
}

export function ProjectListClient({ initialProjects }: ProjectListClientProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<readonly ProjectRecord[]>(initialProjects);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Delete modal state
  const [projectToDelete, setProjectToDelete] = useState<ProjectRecord | null>(null);

  const handleReorder = (currentIndex: number, direction: 'up' | 'down') => {
    if (isPending) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= projects.length) return;

    const reordered = [...projects];
    const temp = reordered[currentIndex];
    reordered[currentIndex] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    // Optimistically update UI
    setProjects(reordered);
    setFeedback(null);

    const orderedIds = reordered.map((p) => p.id);

    startTransition(async () => {
      const result = await reorderProjectsAction(orderedIds);
      if (result.success) {
        setFeedback({ type: 'success', message: 'Project order updated successfully.' });
        router.refresh();
      } else {
        // Revert on failure
        setProjects(initialProjects);
        setFeedback({
          type: 'error',
          message: result.error || 'Failed to update project order.',
        });
      }
    });
  };

  const confirmDelete = () => {
    if (!projectToDelete || isPending) return;
    const { id, title } = projectToDelete;

    startTransition(async () => {
      const result = await deleteProjectAction(id);
      if (result.success) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
        setFeedback({
          type: 'success',
          message: `Project "${title}" deleted successfully.`,
        });
        setProjectToDelete(null);
        router.refresh();
      } else {
        setFeedback({
          type: 'error',
          message: result.error || `Failed to delete project "${title}".`,
        });
        setProjectToDelete(null);
      }
    });
  };

  if (projects.length === 0) {
    return (
      <div className="bg-white border border-[var(--border-subtle)] p-12 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-secondary)]">
          No Projects Found
        </p>
        <p className="text-sm text-[var(--text-primary)] mt-2 font-medium">
          The projects collection is currently empty.
        </p>
        <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-md mx-auto">
          Add your first technical showcase, open-source repository, or commercial system.
        </p>
        <div className="mt-6">
          <Link
            href="/admin/projects/new"
            className="inline-flex items-center px-5 py-2.5 bg-[var(--text-primary)] text-white text-xs font-mono tracking-widest uppercase hover:bg-black transition-colors"
          >
            + Create First Project
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action Feedback */}
      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={`p-4 border text-xs font-mono flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-red-50 border-red-300 text-red-900'
          }`}
        >
          <span>
            <strong className="mr-2">{feedback.type.toUpperCase()}:</strong>
            {feedback.message}
          </span>
          <button
            onClick={() => setFeedback(null)}
            className="text-[11px] underline hover:opacity-75 uppercase"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Projects Table */}
      <div className="bg-white border border-[var(--border-subtle)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] font-mono text-[11px] text-[var(--text-secondary)] uppercase tracking-wider">
                <th scope="col" className="py-3 px-4 w-16 text-center">Order</th>
                <th scope="col" className="py-3 px-4">Project</th>
                <th scope="col" className="py-3 px-4">Technologies</th>
                <th scope="col" className="py-3 px-4 w-28 text-center">Status</th>
                <th scope="col" className="py-3 px-4 w-44 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-xs">
              {projects.map((project, index) => {
                const isFirst = index === 0;
                const isLast = index === projects.length - 1;

                return (
                  <tr key={project.id} className="hover:bg-[var(--bg-primary)] transition-colors">
                    {/* Reorder Controls */}
                    <td className="py-4 px-4 text-center">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">
                          #{project.order}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleReorder(index, 'up')}
                            disabled={isFirst || isPending}
                            aria-label={`Move project "${project.title}" up`}
                            title="Move Up"
                            className="p-1 text-[11px] border border-[var(--border-subtle)] bg-white hover:bg-[var(--bg-surface)] disabled:opacity-30 disabled:cursor-not-allowed leading-none"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReorder(index, 'down')}
                            disabled={isLast || isPending}
                            aria-label={`Move project "${project.title}" down`}
                            title="Move Down"
                            className="p-1 text-[11px] border border-[var(--border-subtle)] bg-white hover:bg-[var(--bg-surface)] disabled:opacity-30 disabled:cursor-not-allowed leading-none"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Project Information */}
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/projects/${project.id}`}
                            className="font-semibold text-sm text-[var(--text-primary)] hover:text-[var(--accent-cobalt)] transition-colors"
                          >
                            {project.title}
                          </Link>
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                            {project.category}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] line-clamp-2 max-w-xl leading-relaxed">
                          {project.description}
                        </p>
                        <div className="flex items-center gap-3 pt-1 text-[11px] font-mono text-[var(--text-secondary)]">
                          <span>ID: {project.id}</span>
                          {project.projectUrl && (
                            <>
                              <span>•</span>
                              <a
                                href={project.projectUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[var(--accent-cobalt)] hover:underline inline-flex items-center gap-0.5"
                              >
                                Live ↗
                              </a>
                            </>
                          )}
                          {project.githubUrl && (
                            <>
                              <span>•</span>
                              <a
                                href={project.githubUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[var(--accent-cobalt)] hover:underline inline-flex items-center gap-0.5"
                              >
                                Repo ↗
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Technologies */}
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {project.technologies.map((tech) => (
                          <span
                            key={tech}
                            className="text-[10px] font-mono px-1.5 py-0.5 bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)]"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Published Status */}
                    <td className="py-4 px-4 text-center">
                      {project.published ? (
                        <span className="inline-block px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Published
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-neutral-100 text-neutral-600 border border-neutral-300">
                          Draft
                        </span>
                      )}
                      {project.publishedAt && (
                        <span className="block text-[10px] font-mono text-[var(--text-secondary)] mt-1">
                          {new Date(project.publishedAt).toLocaleDateString()}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/projects/${project.id}`}
                          className="px-2.5 py-1 text-xs font-mono uppercase tracking-wider border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => setProjectToDelete(project)}
                          disabled={isPending}
                          className="px-2.5 py-1 text-xs font-mono uppercase tracking-wider border border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-colors disabled:opacity-40"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Accessible Confirmation Dialog */}
      {projectToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-description"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div className="bg-white border border-[var(--border-subtle)] max-w-md w-full p-6 shadow-xl space-y-4">
            <h2
              id="delete-dialog-title"
              className="text-base font-bold text-[var(--text-primary)] tracking-tight"
            >
              Confirm Deletion
            </h2>
            <p
              id="delete-dialog-description"
              className="text-xs text-[var(--text-secondary)] leading-relaxed"
            >
              Are you sure you want to delete project{' '}
              <strong className="text-[var(--text-primary)]">
                &ldquo;{projectToDelete.title}&rdquo;
              </strong>{' '}
              (ID: {projectToDelete.id})? This will permanently remove the record from the database.
            </p>
            <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                disabled={isPending}
                className="px-4 py-2 text-xs font-mono uppercase tracking-wider border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isPending}
                className="px-4 py-2 text-xs font-mono uppercase tracking-wider bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isPending && (
                  <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                )}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
