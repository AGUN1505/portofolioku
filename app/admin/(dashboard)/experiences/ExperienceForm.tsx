// app/admin/(dashboard)/experiences/ExperienceForm.tsx
'use client';

import { useState, useActionState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createExperienceAction, updateExperienceAction, type ExperienceFormState } from './actions';
import type { ExperienceRecord } from '../../../../src/domain/entities/experience-record';

interface ExperienceFormProps {
  readonly mode: 'create' | 'edit';
  readonly initialData?: ExperienceRecord;
}

const initialState: ExperienceFormState = {
  success: false,
};

function formatDateToInput(date: Date | null): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

export function ExperienceForm({ mode, initialData }: ExperienceFormProps) {
  const router = useRouter();

  // Initial ongoing state: true if endDate is null or undefined
  const initialOngoing = mode === 'edit' ? initialData?.endDate === null : false;
  const [isOngoing, setIsOngoing] = useState<boolean>(initialOngoing);

  const boundAction =
    mode === 'edit' && initialData
      ? updateExperienceAction.bind(null, initialData.id)
      : createExperienceAction;

  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  // If creation was successful, redirect to experiences list
  useEffect(() => {
    if (state.success && mode === 'create') {
      const timer = setTimeout(() => {
        router.push('/admin/experiences');
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [state.success, mode, router]);

  return (
    <form action={formAction} className="space-y-6">
      {/* Feedback Alerts */}
      {state.success && (
        <div
          role="status"
          className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-mono"
        >
          <span className="font-bold mr-2">SUCCESS:</span>
          {state.message ||
            (mode === 'create'
              ? 'Experience created successfully.'
              : 'Experience updated successfully.')}
          {mode === 'create' && (
            <span className="block mt-1 text-emerald-700">Redirecting to experiences list...</span>
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

      {/* Metadata Header (Edit mode) */}
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
            <span>Tenure: </span>
            <strong className="text-[var(--text-primary)]">
              {initialData.endDate === null ? 'Present / Ongoing' : 'Concluded'}
            </strong>
          </div>
        </div>
      )}

      {/* Field: Role */}
      <div className="space-y-1.5">
        <label
          htmlFor="exp-role"
          className="block text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold"
        >
          Position / Role Title <span className="text-[var(--accent-cobalt)]">*</span>
        </label>
        <input
          id="exp-role"
          name="role"
          type="text"
          defaultValue={initialData?.role ?? ''}
          disabled={isPending}
          required
          placeholder="e.g. Software Developer / Programming Instructor"
          className="w-full px-3 py-2 bg-white border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-sans focus:outline-none focus:border-[var(--accent-cobalt)] disabled:opacity-60"
        />
        {state.errors?.role && (
          <p className="text-[11px] font-mono text-red-600 mt-1">{state.errors.role}</p>
        )}
      </div>

      {/* Two-Column Grid: Institution & Track */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Field: Institution */}
        <div className="space-y-1.5">
          <label
            htmlFor="exp-institution"
            className="block text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold"
          >
            Institution / Company <span className="text-[var(--accent-cobalt)]">*</span>
          </label>
          <input
            id="exp-institution"
            name="institution"
            type="text"
            defaultValue={initialData?.institution ?? ''}
            disabled={isPending}
            required
            placeholder="e.g. Timedoor Academy / SMK Negeri 2 Kota Jambi"
            className="w-full px-3 py-2 bg-white border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-sans focus:outline-none focus:border-[var(--accent-cobalt)] disabled:opacity-60"
          />
          {state.errors?.institution && (
            <p className="text-[11px] font-mono text-red-600 mt-1">{state.errors.institution}</p>
          )}
        </div>

        {/* Field: Track */}
        <div className="space-y-1.5">
          <label
            htmlFor="exp-track"
            className="block text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold"
          >
            Category Track <span className="text-[var(--accent-cobalt)]">*</span>
          </label>
          <input
            id="exp-track"
            name="track"
            type="text"
            defaultValue={initialData?.track ?? ''}
            disabled={isPending}
            required
            placeholder="e.g. Professional Experience / Academic / Instructor"
            className="w-full px-3 py-2 bg-white border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-sans focus:outline-none focus:border-[var(--accent-cobalt)] disabled:opacity-60"
          />
          {state.errors?.track && (
            <p className="text-[11px] font-mono text-red-600 mt-1">{state.errors.track}</p>
          )}
        </div>
      </div>

      {/* Field: Description */}
      <div className="space-y-1.5">
        <label
          htmlFor="exp-description"
          className="block text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold"
        >
          Description / Key Responsibilities
          <span className="text-[11px] font-normal lowercase tracking-normal text-[var(--text-secondary)] ml-1">
            (optional, up to 3000 chars)
          </span>
        </label>
        <textarea
          id="exp-description"
          name="description"
          rows={4}
          defaultValue={initialData?.description ?? ''}
          disabled={isPending}
          placeholder="Detailed narrative of roles, key achievements, impact, technologies used, and responsibilities..."
          className="w-full px-3 py-2 bg-white border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-sans focus:outline-none focus:border-[var(--accent-cobalt)] disabled:opacity-60 leading-relaxed"
        />
        {state.errors?.description && (
          <p className="text-[11px] font-mono text-red-600 mt-1">{state.errors.description}</p>
        )}
      </div>

      {/* Date Range & Ongoing Tenure Section */}
      <div className="p-4 bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold">
            Tenure Period
          </span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="isOngoing"
              value="true"
              checked={isOngoing}
              onChange={(e) => setIsOngoing(e.target.checked)}
              disabled={isPending}
              className="h-4 w-4 border-[var(--border-subtle)] text-[var(--accent-cobalt)] focus:ring-[var(--accent-cobalt)]"
            />
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--accent-cobalt)] font-semibold">
              Currently Ongoing / Present
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Start Date */}
          <div className="space-y-1.5">
            <label
              htmlFor="exp-startDate"
              className="block text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)] font-semibold"
            >
              Start Date <span className="text-[var(--accent-cobalt)]">*</span>
            </label>
            <input
              id="exp-startDate"
              name="startDate"
              type="date"
              defaultValue={formatDateToInput(initialData?.startDate ?? null)}
              disabled={isPending}
              required
              className="w-full px-3 py-2 bg-white border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-cobalt)] disabled:opacity-60"
            />
            {state.errors?.startDate && (
              <p className="text-[11px] font-mono text-red-600 mt-1">{state.errors.startDate}</p>
            )}
          </div>

          {/* End Date */}
          <div className="space-y-1.5">
            <label
              htmlFor="exp-endDate"
              className="block text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)] font-semibold"
            >
              End Date {isOngoing ? '(Ongoing: null)' : <span className="text-[var(--accent-cobalt)]">*</span>}
            </label>
            {isOngoing ? (
              <div className="px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-secondary)] flex items-center justify-between">
                <span>Present / Ongoing (stored as null in database)</span>
                <input type="hidden" name="endDate" value="" />
              </div>
            ) : (
              <input
                id="exp-endDate"
                name="endDate"
                type="date"
                defaultValue={formatDateToInput(initialData?.endDate ?? null)}
                disabled={isPending}
                required={!isOngoing}
                className="w-full px-3 py-2 bg-white border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-cobalt)] disabled:opacity-60"
              />
            )}
            {state.errors?.endDate && (
              <p className="text-[11px] font-mono text-red-600 mt-1">{state.errors.endDate}</p>
            )}
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="pt-5 border-t border-[var(--border-subtle)] flex items-center justify-between">
        <Link
          href="/admin/experiences"
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
            <span>{mode === 'create' ? 'Create Experience' : 'Save Changes'}</span>
          )}
        </button>
      </div>
    </form>
  );
}
