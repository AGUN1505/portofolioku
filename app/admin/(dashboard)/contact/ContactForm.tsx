// app/admin/(dashboard)/contact/ContactForm.tsx
'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { updateContactProfileAction, type ContactFormState } from './actions';
import type { ContactProfileRecord } from '../../../../src/domain/entities/contact-profile-record';

interface ContactFormProps {
  readonly initialData: ContactProfileRecord;
}

const initialState: ContactFormState = {
  success: false,
};

export function ContactForm({ initialData }: ContactFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateContactProfileAction,
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
          htmlFor="contact-heading"
          className="block text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold"
        >
          Section Title / Heading <span className="text-[var(--accent-cobalt)]">*</span>
        </label>
        <input
          id="contact-heading"
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

      {/* Field: CTA Label */}
      <div className="space-y-1.5">
        <label
          htmlFor="contact-ctaLabel"
          className="block text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold"
        >
          Call-To-Action (CTA) Label <span className="text-[var(--accent-cobalt)]">*</span>
        </label>
        <input
          id="contact-ctaLabel"
          name="ctaLabel"
          type="text"
          defaultValue={initialData.ctaLabel}
          disabled={isPending}
          required
          className="w-full px-3 py-2 bg-white border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-sans focus:outline-none focus:border-[var(--accent-cobalt)] disabled:opacity-60"
        />
        {state.errors?.ctaLabel && (
          <p className="text-[11px] font-mono text-red-600 mt-1">
            {state.errors.ctaLabel}
          </p>
        )}
      </div>

      {/* Field: Description */}
      <div className="space-y-1.5">
        <label
          htmlFor="contact-description"
          className="block text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold"
        >
          Contact Description / Availability Narrative <span className="text-[var(--accent-cobalt)]">*</span>
        </label>
        <textarea
          id="contact-description"
          name="description"
          rows={4}
          defaultValue={initialData.description}
          disabled={isPending}
          required
          className="w-full px-3 py-2 bg-white border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-sans focus:outline-none focus:border-[var(--accent-cobalt)] disabled:opacity-60 resize-y"
        />
        {state.errors?.description && (
          <p className="text-[11px] font-mono text-red-600 mt-1">
            {state.errors.description}
          </p>
        )}
      </div>

      {/* Notice about Contact Channels */}
      <div className="p-3 bg-[var(--bg-warm)] border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-secondary)] flex flex-wrap items-center justify-between gap-2">
        <span>
          Note: Contact Channels (social links, email addresses) are managed separately from the Contact Profile copy.
        </span>
        <Link
          href="/admin/contact-channels"
          className="text-[var(--accent-cobalt)] hover:underline font-semibold whitespace-nowrap"
        >
          Manage Contact Channels →
        </Link>
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
