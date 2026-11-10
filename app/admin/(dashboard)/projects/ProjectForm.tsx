// app/admin/(dashboard)/projects/ProjectForm.tsx
'use client';

import { useActionState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createProjectAction, updateProjectAction, type ProjectFormState } from './actions';
import type { ProjectRecord } from '../../../../src/domain/entities/project-record';

interface ProjectFormProps {
  readonly mode: 'create' | 'edit';
  readonly initialData?: ProjectRecord;
}

const initialState: ProjectFormState = {
  success: false,
};

export function ProjectForm({ mode, initialData }: ProjectFormProps) {
  const router = useRouter();

  // Bind update action with ID if edit mode
  const boundAction =
    mode === 'edit' && initialData
      ? updateProjectAction.bind(null, initialData.id)
      : createProjectAction;

  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  // If creation was successful, redirect after brief delay or user interaction
  useEffect(() => {
    if (state.success && mode === 'create') {
      const timer = setTimeout(() => {
        router.push('/admin/projects');
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [state.success, mode, router]);

  const defaultTechnologies = initialData?.technologies
    ? initialData.technologies.join(', ')
    : '';

  return (
    <form action={formAction} className="space-y-6">
      {/* Feedback Alerts */}
      {state.success && (
        <div
          role="status"
          className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-mono"
        >
          <span className="font-bold mr-2">SUCCESS:</span>
          {state.message || (mode === 'create' ? 'Project created successfully.' : 'Project updated successfully.')}
          {mode === 'create' && (
            <span className="block mt-1 text-emerald-700">Redirecting to projects list...</span>
          )}
        </div>
      )}

      {state.error && (
        <div
          role="alert"
          className="p-4 bg-red-50 border border-red-300 text-red-900 text-xs font-mono"
        >
          <span className="font-bold mr-2">ERROR:</span>
          {state.error}
        </div>
      )}

      {/* Mode & Metadata Header (Edit mode only) */}
      {mode === 'edit' && initialData && (
        <div className="p-3 bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[var(--text-secondary)]">
          <div>
            <span>ID: </span>
            <strong className="text-[var(--text-primary)]">{initialData.id}</strong>
            <span className="mx-2">•</span>
            <span>Display Order: </span>
            <strong className="text-[var(--text-primary)]">#{initialData.order}</strong>
          </div>
          <div>
            <span>Published At: </span>
            <strong className="text-[var(--text-primary)]">
              {initialData.publishedAt ? new Date(initialData.publishedAt).toLocaleString() : 'Not published'}
            </strong>
          </div>
        </div>
      )}

      {/* Field: Title */}
      <div className="space-y-1.5">
        <label
          htmlFor="project-title"
          className="block text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold"
        >
          Project Title <span className="text-[var(--accent-cobalt)]">*</span>
        </label>
        <input
          id="project-title"
          name="title"
          type="text"
          defaultValue={initialData?.title ?? ''}
          disabled={isPending}
          required
          placeholder="e.g. Water Reminder App"
          className="w-full px-3 py-2 bg-white border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-sans focus:outline-none focus:border-[var(--accent-cobalt)] disabled:opacity-60"
        />
        {state.errors?.title && (
          <p className="text-[11px] font-mono text-red-600 mt-1">{state.errors.title}</p>
        )}
      </div>

      {/* Field: Category */}
      <div className="space-y-1.5">
        <label
          htmlFor="project-category"
          className="block text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold"
        >
          Category <span className="text-[var(--accent-cobalt)]">*</span>
        </label>
        <input
          id="project-category"
          name="category"
          type="text"
          defaultValue={initialData?.category ?? ''}
          disabled={isPending}
          required
          placeholder="e.g. Mobile & REST API System"
          className="w-full px-3 py-2 bg-white border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-sans focus:outline-none focus:border-[var(--accent-cobalt)] disabled:opacity-60"
        />
        {state.errors?.category && (
          <p className="text-[11px] font-mono text-red-600 mt-1">{state.errors.category}</p>
        )}
      </div>

      {/* Field: Description */}
      <div className="space-y-1.5">
        <label
          htmlFor="project-description"
          className="block text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold"
        >
          Description <span className="text-[var(--accent-cobalt)]">*</span>
        </label>
        <textarea
          id="project-description"
          name="description"
          rows={4}
          defaultValue={initialData?.description ?? ''}
          disabled={isPending}
          required
          placeholder="Comprehensive project summary or technical case study narrative..."
          className="w-full px-3 py-2 bg-white border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-sans focus:outline-none focus:border-[var(--accent-cobalt)] disabled:opacity-60 leading-relaxed"
        />
        {state.errors?.description && (
          <p className="text-[11px] font-mono text-red-600 mt-1">{state.errors.description}</p>
        )}
      </div>

      {/* Field: Technologies */}
      <div className="space-y-1.5">
        <label
          htmlFor="project-technologies"
          className="block text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold"
        >
          Technologies <span className="text-[var(--accent-cobalt)]">*</span>
          <span className="text-[11px] font-normal lowercase tracking-normal text-[var(--text-secondary)] ml-2">
            (comma-separated, up to 20 tags)
          </span>
        </label>
        <input
          id="project-technologies"
          name="technologies"
          type="text"
          defaultValue={defaultTechnologies}
          disabled={isPending}
          required
          placeholder="Flutter, Laravel, REST API, PostgreSQL"
          className="w-full px-3 py-2 bg-white border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-sans focus:outline-none focus:border-[var(--accent-cobalt)] disabled:opacity-60"
        />
        {state.errors?.technologies && (
          <p className="text-[11px] font-mono text-red-600 mt-1">{state.errors.technologies}</p>
        )}
      </div>

      {/* Two-Column Grid for Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Field: Project URL */}
        <div className="space-y-1.5">
          <label
            htmlFor="project-projectUrl"
            className="block text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold"
          >
            Live Demo / Project URL
            <span className="text-[11px] font-normal lowercase tracking-normal text-[var(--text-secondary)] ml-1">
              (optional)
            </span>
          </label>
          <input
            id="project-projectUrl"
            name="projectUrl"
            type="url"
            defaultValue={initialData?.projectUrl ?? ''}
            disabled={isPending}
            placeholder="https://example.com"
            className="w-full px-3 py-2 bg-white border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-sans focus:outline-none focus:border-[var(--accent-cobalt)] disabled:opacity-60"
          />
          {state.errors?.projectUrl && (
            <p className="text-[11px] font-mono text-red-600 mt-1">{state.errors.projectUrl}</p>
          )}
        </div>

        {/* Field: GitHub URL */}
        <div className="space-y-1.5">
          <label
            htmlFor="project-githubUrl"
            className="block text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold"
          >
            Repository URL
            <span className="text-[11px] font-normal lowercase tracking-normal text-[var(--text-secondary)] ml-1">
              (optional)
            </span>
          </label>
          <input
            id="project-githubUrl"
            name="githubUrl"
            type="url"
            defaultValue={initialData?.githubUrl ?? ''}
            disabled={isPending}
            placeholder="https://github.com/agunfirmansyah/..."
            className="w-full px-3 py-2 bg-white border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-sans focus:outline-none focus:border-[var(--accent-cobalt)] disabled:opacity-60"
          />
          {state.errors?.githubUrl && (
            <p className="text-[11px] font-mono text-red-600 mt-1">{state.errors.githubUrl}</p>
          )}
        </div>
      </div>

      {/* Field: Thumbnail URL */}
      <div className="space-y-1.5">
        <label
          htmlFor="project-thumbnailUrl"
          className="block text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold"
        >
          Thumbnail Image URL
          <span className="text-[11px] font-normal lowercase tracking-normal text-[var(--text-secondary)] ml-1">
            (safe relative path /images/... or https://)
          </span>
        </label>
        <input
          id="project-thumbnailUrl"
          name="thumbnailUrl"
          type="text"
          defaultValue={initialData?.thumbnailUrl ?? ''}
          disabled={isPending}
          placeholder="/images/projects/water-reminder.png"
          className="w-full px-3 py-2 bg-white border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-sans focus:outline-none focus:border-[var(--accent-cobalt)] disabled:opacity-60"
        />
        {state.errors?.thumbnailUrl && (
          <p className="text-[11px] font-mono text-red-600 mt-1">{state.errors.thumbnailUrl}</p>
        )}
      </div>

      {/* Field: Published Toggle */}
      <div className="pt-2 border-t border-[var(--border-subtle)]">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="published"
            value="true"
            defaultChecked={initialData?.published ?? false}
            disabled={isPending}
            className="mt-0.5 h-4 w-4 border-[var(--border-subtle)] text-[var(--accent-cobalt)] focus:ring-[var(--accent-cobalt)]"
          />
          <div>
            <span className="block text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold">
              Published on Public Portfolio
            </span>
            <span className="block text-xs text-[var(--text-secondary)] mt-0.5">
              When checked, this project is visible to public visitors. Publication timestamp is managed automatically.
            </span>
          </div>
        </label>
      </div>

      {/* Actions Bar */}
      <div className="pt-5 border-t border-[var(--border-subtle)] flex items-center justify-between">
        <Link
          href="/admin/projects"
          className="px-4 py-2 text-xs font-mono tracking-wider uppercase border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2 bg-[var(--text-primary)] text-white text-xs font-mono tracking-widest uppercase hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isPending ? (
            <>
              <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
              <span>Saving...</span>
            </>
          ) : (
            <span>{mode === 'create' ? 'Create Project' : 'Save Changes'}</span>
          )}
        </button>
      </div>
    </form>
  );
}
