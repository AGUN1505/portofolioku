// app/admin/(dashboard)/hero/HeroForm.tsx
'use client';

import { useActionState } from 'react';
import { updateHeroProfileAction, type HeroFormState } from './actions';
import type { HeroProfileRecord } from '../../../../src/domain/entities/hero-profile-record';

interface HeroFormProps {
  readonly initialData: HeroProfileRecord;
}

const initialState: HeroFormState = {
  success: false,
};

export function HeroForm({ initialData }: HeroFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateHeroProfileAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-6">
      {/* Feedback Notifications */}
      {state.success && state.message && (
        <div
          role="status"
          className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-mono"
        >
          <span className="font-bold mr-2">SUCCESS:</span>
          {state.message}
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

      {/* Field: Name */}
      <div className="space-y-1.5">
        <label
          htmlFor="hero-name"
          className="block text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold"
        >
          Full Name <span className="text-[var(--accent-cobalt)]">*</span>
        </label>
        <input
          id="hero-name"
          name="name"
          type="text"
          defaultValue={initialData.name}
          disabled={isPending}
          required
          className="w-full px-3 py-2 bg-white border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-sans focus:outline-none focus:border-[var(--accent-cobalt)] disabled:opacity-60"
        />
        {state.errors?.name && (
          <p className="text-[11px] font-mono text-red-600 mt-1">
            {state.errors.name}
          </p>
        )}
      </div>

      {/* Field: Tagline */}
      <div className="space-y-1.5">
        <label
          htmlFor="hero-tagline"
          className="block text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold"
        >
          Tagline / Headline <span className="text-[var(--accent-cobalt)]">*</span>
        </label>
        <textarea
          id="hero-tagline"
          name="tagline"
          rows={2}
          defaultValue={initialData.tagline}
          disabled={isPending}
          required
          className="w-full px-3 py-2 bg-white border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-sans focus:outline-none focus:border-[var(--accent-cobalt)] disabled:opacity-60 resize-y"
        />
        {state.errors?.tagline && (
          <p className="text-[11px] font-mono text-red-600 mt-1">
            {state.errors.tagline}
          </p>
        )}
      </div>

      {/* Field: Bio */}
      <div className="space-y-1.5">
        <label
          htmlFor="hero-bio"
          className="block text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold"
        >
          Editorial Bio Narrative <span className="text-[var(--accent-cobalt)]">*</span>
        </label>
        <textarea
          id="hero-bio"
          name="bio"
          rows={4}
          defaultValue={initialData.bio}
          disabled={isPending}
          required
          className="w-full px-3 py-2 bg-white border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-sans focus:outline-none focus:border-[var(--accent-cobalt)] disabled:opacity-60 resize-y"
        />
        {state.errors?.bio && (
          <p className="text-[11px] font-mono text-red-600 mt-1">
            {state.errors.bio}
          </p>
        )}
      </div>

      {/* Row: Location (Country, Code, Timezone) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label
            htmlFor="hero-country"
            className="block text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold"
          >
            Country <span className="text-[var(--accent-cobalt)]">*</span>
          </label>
          <input
            id="hero-country"
            name="country"
            type="text"
            defaultValue={initialData.country}
            disabled={isPending}
            required
            className="w-full px-3 py-2 bg-white border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-sans focus:outline-none focus:border-[var(--accent-cobalt)] disabled:opacity-60"
          />
          {state.errors?.country && (
            <p className="text-[11px] font-mono text-red-600 mt-1">
              {state.errors.country}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="hero-code"
            className="block text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold"
          >
            Country Code <span className="text-[var(--accent-cobalt)]">*</span>
          </label>
          <input
            id="hero-code"
            name="code"
            type="text"
            defaultValue={initialData.code}
            disabled={isPending}
            required
            className="w-full px-3 py-2 bg-white border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-sans focus:outline-none focus:border-[var(--accent-cobalt)] disabled:opacity-60 uppercase"
          />
          {state.errors?.code && (
            <p className="text-[11px] font-mono text-red-600 mt-1">
              {state.errors.code}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="hero-timezone"
            className="block text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold"
          >
            Timezone <span className="text-[var(--accent-cobalt)]">*</span>
          </label>
          <input
            id="hero-timezone"
            name="timezone"
            type="text"
            defaultValue={initialData.timezone}
            disabled={isPending}
            required
            className="w-full px-3 py-2 bg-white border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-sans focus:outline-none focus:border-[var(--accent-cobalt)] disabled:opacity-60"
          />
          {state.errors?.timezone && (
            <p className="text-[11px] font-mono text-red-600 mt-1">
              {state.errors.timezone}
            </p>
          )}
        </div>
      </div>

      {/* Field: Discipline */}
      <div className="space-y-1.5">
        <label
          htmlFor="hero-discipline"
          className="block text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold"
        >
          Discipline Metadata <span className="text-[var(--accent-cobalt)]">*</span>
        </label>
        <input
          id="hero-discipline"
          name="discipline"
          type="text"
          defaultValue={initialData.discipline}
          disabled={isPending}
          required
          className="w-full px-3 py-2 bg-white border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-sans focus:outline-none focus:border-[var(--accent-cobalt)] disabled:opacity-60"
        />
        {state.errors?.discipline && (
          <p className="text-[11px] font-mono text-red-600 mt-1">
            {state.errors.discipline}
          </p>
        )}
      </div>

      {/* Submission Bar */}
      <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
        <span className="text-[11px] font-mono text-[var(--text-secondary)]">
          Target: Singleton (id: singleton)
        </span>
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 bg-[var(--text-primary)] text-white hover:bg-[var(--accent-cobalt)] text-xs font-mono uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          {isPending ? 'Saving Changes...' : 'Save Profile Changes'}
        </button>
      </div>
    </form>
  );
}
