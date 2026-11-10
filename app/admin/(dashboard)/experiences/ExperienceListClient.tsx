// app/admin/(dashboard)/experiences/ExperienceListClient.tsx
'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { reorderExperiencesAction, deleteExperienceAction } from './actions';
import type { ExperienceRecord } from '../../../../src/domain/entities/experience-record';

interface ExperienceListClientProps {
  readonly initialExperiences: readonly ExperienceRecord[];
}

function formatDate(date: Date | null): string {
  if (!date) return 'Present';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
}

export function ExperienceListClient({ initialExperiences }: ExperienceListClientProps) {
  const router = useRouter();
  const [experiences, setExperiences] = useState<readonly ExperienceRecord[]>(initialExperiences);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Delete modal state
  const [experienceToDelete, setExperienceToDelete] = useState<ExperienceRecord | null>(null);

  const handleReorder = (currentIndex: number, direction: 'up' | 'down') => {
    if (isPending) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= experiences.length) return;

    const reordered = [...experiences];
    const temp = reordered[currentIndex];
    reordered[currentIndex] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    setExperiences(reordered);
    setFeedback(null);

    const orderedIds = reordered.map((e) => e.id);

    startTransition(async () => {
      const result = await reorderExperiencesAction(orderedIds);
      if (result.success) {
        setFeedback({ type: 'success', message: 'Experience order updated successfully.' });
        router.refresh();
      } else {
        setExperiences(initialExperiences);
        setFeedback({
          type: 'error',
          message: result.error || 'Failed to update experience order.',
        });
      }
    });
  };

  const confirmDelete = () => {
    if (!experienceToDelete || isPending) return;
    const { id, role } = experienceToDelete;

    startTransition(async () => {
      const result = await deleteExperienceAction(id);
      if (result.success) {
        setExperiences((prev) => prev.filter((e) => e.id !== id));
        setFeedback({
          type: 'success',
          message: `Experience "${role}" deleted successfully.`,
        });
        setExperienceToDelete(null);
        router.refresh();
      } else {
        setFeedback({
          type: 'error',
          message: result.error || `Failed to delete experience "${role}".`,
        });
        setExperienceToDelete(null);
      }
    });
  };

  if (experiences.length === 0) {
    return (
      <div className="bg-white border border-[var(--border-subtle)] p-12 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-secondary)]">
          No Experiences Found
        </p>
        <p className="text-sm text-[var(--text-primary)] mt-2 font-medium">
          The experiences chronology is currently empty.
        </p>
        <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-md mx-auto">
          Add professional positions, academic credentials, or programming instructor tenures.
        </p>
        <div className="mt-6">
          <Link
            href="/admin/experiences/new"
            className="inline-flex items-center px-5 py-2.5 bg-[var(--text-primary)] text-white text-xs font-mono tracking-widest uppercase hover:bg-black transition-colors"
          >
            + Create First Experience
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Feedback Notification */}
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

      {/* Experiences Table */}
      <div className="bg-white border border-[var(--border-subtle)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] font-mono text-[11px] text-[var(--text-secondary)] uppercase tracking-wider">
                <th scope="col" className="py-3 px-4 w-16 text-center">Order</th>
                <th scope="col" className="py-3 px-4">Role &amp; Institution</th>
                <th scope="col" className="py-3 px-4 w-40">Period</th>
                <th scope="col" className="py-3 px-4 w-28 text-center">Status</th>
                <th scope="col" className="py-3 px-4 w-44 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-xs">
              {experiences.map((experience, index) => {
                const isFirst = index === 0;
                const isLast = index === experiences.length - 1;
                const isOngoing = experience.endDate === null;

                return (
                  <tr key={experience.id} className="hover:bg-[var(--bg-primary)] transition-colors">
                    {/* Order Controls */}
                    <td className="py-4 px-4 text-center">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">
                          #{experience.order}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleReorder(index, 'up')}
                            disabled={isFirst || isPending}
                            aria-label={`Move experience "${experience.role}" up`}
                            title="Move Up"
                            className="p-1 text-[11px] border border-[var(--border-subtle)] bg-white hover:bg-[var(--bg-surface)] disabled:opacity-30 disabled:cursor-not-allowed leading-none"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReorder(index, 'down')}
                            disabled={isLast || isPending}
                            aria-label={`Move experience "${experience.role}" down`}
                            title="Move Down"
                            className="p-1 text-[11px] border border-[var(--border-subtle)] bg-white hover:bg-[var(--bg-surface)] disabled:opacity-30 disabled:cursor-not-allowed leading-none"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Role, Institution & Description */}
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/experiences/${experience.id}`}
                            className="font-semibold text-sm text-[var(--text-primary)] hover:text-[var(--accent-cobalt)] transition-colors"
                          >
                            {experience.role}
                          </Link>
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                            {experience.track}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-[var(--text-secondary)]">
                          {experience.institution}
                        </p>
                        {experience.description && (
                          <p className="text-xs text-[var(--text-secondary)] line-clamp-2 max-w-xl leading-relaxed">
                            {experience.description}
                          </p>
                        )}
                        <span className="inline-block text-[11px] font-mono text-[var(--text-secondary)] pt-1">
                          ID: {experience.id}
                        </span>
                      </div>
                    </td>

                    {/* Period */}
                    <td className="py-4 px-4 font-mono text-xs text-[var(--text-secondary)]">
                      <div>
                        <span>{formatDate(experience.startDate)}</span>
                        <span className="mx-1.5">—</span>
                        <span>{formatDate(experience.endDate)}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4 text-center">
                      {isOngoing ? (
                        <span className="inline-block px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-300 font-semibold">
                          Ongoing
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-neutral-100 text-neutral-600 border border-neutral-300">
                          Concluded
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/experiences/${experience.id}`}
                          className="px-2.5 py-1 text-xs font-mono uppercase tracking-wider border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => setExperienceToDelete(experience)}
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
      {experienceToDelete && (
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
              Are you sure you want to delete experience{' '}
              <strong className="text-[var(--text-primary)]">
                &ldquo;{experienceToDelete.role}&rdquo;
              </strong>{' '}
              at {experienceToDelete.institution} (ID: {experienceToDelete.id})? This will permanently remove the record from the database.
            </p>
            <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setExperienceToDelete(null)}
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
