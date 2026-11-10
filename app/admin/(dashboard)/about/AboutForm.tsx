// app/admin/(dashboard)/about/AboutForm.tsx
'use client';

import { useActionState } from 'react';
import { updateAboutProfileAction, type AboutFormState } from './actions';
import type { AboutProfileRecord } from '../../../../src/domain/entities/about-profile-record';

interface AboutFormProps {
  readonly initialData: AboutProfileRecord;
}

const initialState: AboutFormState = {
  success: false,
};

export function AboutForm({ initialData }: AboutFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateAboutProfileAction,
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

      {/* Field: Heading */}
      <div className="space-y-1.5">
        <label
          htmlFor="about-heading"
          className="block text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold"
        >
          Biographical Section Heading <span className="text-[var(--accent-cobalt)]">*</span>
        </label>
        <input
          id="about-heading"
          name="heading"
          type="text"
          defaultValue={initialData.heading}
          disabled={isPending}
          required
          className="w-full px-3 py-2 bg-white border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-sans focus:outline-none focus:border-[var(--accent-cobalt)] disabled:opacity-60"
        />
        {state.errors?.heading && (
          <p className="text-[11px] font-mono text-red-600 mt-1">
            {state.errors.heading}
          </p>
        )}
      </div>

      {/* Field: Quote */}
      <div className="space-y-1.5">
        <label
          htmlFor="about-quote"
          className="block text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold"
        >
          Philosophy Quote <span className="text-[var(--accent-cobalt)]">*</span>
        </label>
        <textarea
          id="about-quote"
          name="quote"
          rows={3}
          defaultValue={initialData.quote}
          disabled={isPending}
          required
          className="w-full px-3 py-2 bg-white border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-sans focus:outline-none focus:border-[var(--accent-cobalt)] disabled:opacity-60 resize-y"
        />
        {state.errors?.quote && (
          <p className="text-[11px] font-mono text-red-600 mt-1">
            {state.errors.quote}
          </p>
        )}
      </div>

      {/* Field: Primary Narrative */}
      <div className="space-y-1.5">
        <label
          htmlFor="about-primaryNarrative"
          className="block text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold"
        >
          Primary Narrative Paragraph <span className="text-[var(--accent-cobalt)]">*</span>
        </label>
        <textarea
          id="about-primaryNarrative"
          name="primaryNarrative"
          rows={5}
          defaultValue={initialData.primaryNarrative}
          disabled={isPending}
          required
          className="w-full px-3 py-2 bg-white border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-sans focus:outline-none focus:border-[var(--accent-cobalt)] disabled:opacity-60 resize-y"
        />
        {state.errors?.primaryNarrative && (
          <p className="text-[11px] font-mono text-red-600 mt-1">
            {state.errors.primaryNarrative}
          </p>
        )}
      </div>

      {/* Field: Secondary Narrative */}
      <div className="space-y-1.5">
        <label
          htmlFor="about-secondaryNarrative"
          className="block text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold"
        >
          Secondary Narrative Paragraph <span className="text-[var(--accent-cobalt)]">*</span>
        </label>
        <textarea
          id="about-secondaryNarrative"
          name="secondaryNarrative"
          rows={5}
          defaultValue={initialData.secondaryNarrative}
          disabled={isPending}
          required
          className="w-full px-3 py-2 bg-white border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-sans focus:outline-none focus:border-[var(--accent-cobalt)] disabled:opacity-60 resize-y"
        />
        {state.errors?.secondaryNarrative && (
          <p className="text-[11px] font-mono text-red-600 mt-1">
            {state.errors.secondaryNarrative}
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
