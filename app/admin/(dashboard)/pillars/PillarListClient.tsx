// app/admin/(dashboard)/pillars/PillarListClient.tsx
'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  createPillarAction,
  updatePillarAction,
  deletePillarAction,
  reorderPillarsAction,
  type ActionFormState,
} from './actions';
import type { PillarRecord } from '../../../../src/domain/entities/pillar-record';

interface PillarListClientProps {
  readonly initialPillars: readonly PillarRecord[];
}

export function PillarListClient({ initialPillars }: PillarListClientProps) {
  const router = useRouter();
  const [pillars, setPillars] = useState<readonly PillarRecord[]>(initialPillars);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPillar, setEditingPillar] = useState<PillarRecord | null>(null);
  const [pillarToDelete, setPillarToDelete] = useState<PillarRecord | null>(null);

  // Form states & errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [modalError, setModalError] = useState<string | null>(null);

  const isAnyModalOpen = isCreateOpen || editingPillar !== null || pillarToDelete !== null;

  useEffect(() => {
    if (!isAnyModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isPending) {
        setIsCreateOpen(false);
        setEditingPillar(null);
        setPillarToDelete(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAnyModalOpen, isPending]);

  // Reorder handler
  const handleReorder = (currentIndex: number, direction: 'up' | 'down') => {
    if (isPending) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= pillars.length) return;

    const reordered = [...pillars];
    const temp = reordered[currentIndex];
    reordered[currentIndex] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    setPillars(reordered);
    setFeedback(null);

    const orderedIds = reordered.map((p) => p.id);

    startTransition(async () => {
      const result = await reorderPillarsAction(orderedIds);
      if (result.success) {
        setFeedback({ type: 'success', message: 'Pillar order updated successfully.' });
        router.refresh();
      } else {
        setPillars(initialPillars);
        setFeedback({
          type: 'error',
          message: result.error || 'Failed to update pillar order.',
        });
      }
    });
  };

  // Delete handler
  const confirmDelete = () => {
    if (!pillarToDelete || isPending) return;
    const { id, title } = pillarToDelete;

    startTransition(async () => {
      const result = await deletePillarAction(id);
      if (result.success) {
        setPillars((prev) => prev.filter((p) => p.id !== id));
        setFeedback({
          type: 'success',
          message: `Pillar "${title}" deleted successfully.`,
        });
        setPillarToDelete(null);
        router.refresh();
      } else {
        setFeedback({
          type: 'error',
          message: result.error || `Failed to delete pillar "${title}".`,
        });
        setPillarToDelete(null);
      }
    });
  };

  // Create submission
  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormErrors({});
    setModalError(null);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result: ActionFormState = await createPillarAction({ success: false }, formData);
      if (result.success) {
        setFeedback({ type: 'success', message: 'Pillar created successfully.' });
        setIsCreateOpen(false);
        router.refresh();
      } else {
        setModalError(result.error || 'Failed to create pillar.');
        if (result.errors) setFormErrors(result.errors);
      }
    });
  };

  // Edit submission
  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPillar) return;
    setFormErrors({});
    setModalError(null);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result: ActionFormState = await updatePillarAction(editingPillar.id, { success: false }, formData);
      if (result.success) {
        setFeedback({ type: 'success', message: 'Pillar updated successfully.' });
        setEditingPillar(null);
        router.refresh();
      } else {
        setModalError(result.error || 'Failed to update pillar.');
        if (result.errors) setFormErrors(result.errors);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Action Notification Banner */}
      {feedback && (
        <div
          role="alert"
          className={`p-4 text-xs font-mono border flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-[#EBF7EE] text-[#1B5E20] border-[#A5D6A7]'
              : 'bg-[#FDEDEC] text-[#B71C1C] border-[#F5C6CB]'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs uppercase font-bold hover:underline"
          >
            [Close]
          </button>
        </div>
      )}

      {/* Main Table */}
      {pillars.length === 0 ? (
        <div className="bg-white border border-[var(--border-subtle)] p-12 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-secondary)]">
            No Pillars Found
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="px-5 py-2.5 bg-[var(--text-primary)] text-white text-xs font-mono tracking-widest uppercase hover:bg-black transition-colors"
            >
              + Create First Pillar
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[var(--border-subtle)] overflow-hidden">
          <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
            <span className="font-mono text-xs uppercase text-[var(--text-secondary)]">
              Total Pillars: {pillars.length}
            </span>
            <button
              type="button"
              onClick={() => {
                setFormErrors({});
                setModalError(null);
                setIsCreateOpen(true);
              }}
              className="px-4 py-2 bg-[var(--text-primary)] text-white text-xs font-mono tracking-widest uppercase hover:bg-black transition-colors"
            >
              + Add Pillar
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">
                  <th scope="col" className="py-3 px-4 w-24 text-center">Order</th>
                  <th scope="col" className="py-3 px-4 w-28 text-center">Index (Str)</th>
                  <th scope="col" className="py-3 px-4">Pillar Title &amp; Description</th>
                  <th scope="col" className="py-3 px-4 w-44 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-xs">
                {pillars.map((pillar, index) => {
                  const isFirst = index === 0;
                  const isLast = index === pillars.length - 1;

                  return (
                    <tr key={pillar.id} className="hover:bg-[var(--bg-primary)] transition-colors">
                      {/* Order Controls */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">
                            #{pillar.order}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleReorder(index, 'up')}
                              disabled={isFirst || isPending}
                              aria-label={`Move pillar "${pillar.title}" up`}
                              title="Move Up"
                              className="p-1 text-[11px] border border-[var(--border-subtle)] bg-white hover:bg-[var(--bg-surface)] disabled:opacity-30 disabled:cursor-not-allowed leading-none"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReorder(index, 'down')}
                              disabled={isLast || isPending}
                              aria-label={`Move pillar "${pillar.title}" down`}
                              title="Move Down"
                              className="p-1 text-[11px] border border-[var(--border-subtle)] bg-white hover:bg-[var(--bg-surface)] disabled:opacity-30 disabled:cursor-not-allowed leading-none"
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* String Index */}
                      <td className="py-4 px-4 text-center">
                        <span className="font-mono text-xs px-2 py-0.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] font-bold text-[var(--accent-cobalt)]">
                          {pillar.index}
                        </span>
                      </td>

                      {/* Title & Description */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <span className="font-semibold text-sm text-[var(--text-primary)]">
                            {pillar.title}
                          </span>
                          <p className="text-xs text-[var(--text-secondary)] line-clamp-2 max-w-lg leading-relaxed">
                            {pillar.description}
                          </p>
                          <div className="text-[11px] font-mono text-[var(--text-secondary)]">
                            ID: {pillar.id}
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setFormErrors({});
                              setModalError(null);
                              setEditingPillar(pillar);
                            }}
                            disabled={isPending}
                            className="px-3 py-1.5 text-xs font-mono uppercase border border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] transition-colors disabled:opacity-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setPillarToDelete(pillar)}
                            disabled={isPending}
                            className="px-3 py-1.5 text-xs font-mono uppercase text-[#B71C1C] border border-[#F5C6CB] hover:bg-[#FDEDEC] transition-colors disabled:opacity-50"
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
      )}

      {/* Create Modal */}
      {isCreateOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-pillar-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="bg-white border border-[var(--border-subtle)] w-full max-w-lg p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h2 id="create-pillar-modal-title" className="text-base font-bold text-[var(--text-primary)]">Add New Pillar</h2>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-xs font-mono text-[var(--text-secondary)] hover:text-black"
              >
                [ESC]
              </button>
            </div>

            {modalError && (
              <div className="p-3 text-xs bg-[#FDEDEC] text-[#B71C1C] border border-[#F5C6CB]">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label htmlFor="create-pillar-index" className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">
                  String Index * (e.g. &quot;01&quot;, &quot;02&quot;)
                </label>
                <input
                  id="create-pillar-index"
                  name="index"
                  type="text"
                  required
                  placeholder="01"
                  className="w-full text-xs p-2.5 border border-[var(--border-subtle)] focus:border-[var(--accent-cobalt)] outline-none font-mono"
                />
                {formErrors.index && (
                  <p className="text-[11px] text-[#B71C1C] mt-1">{formErrors.index}</p>
                )}
              </div>

              <div>
                <label htmlFor="create-pillar-title" className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">
                  Pillar Title *
                </label>
                <input
                  id="create-pillar-title"
                  name="title"
                  type="text"
                  required
                  placeholder="e.g. Architectural Scalability"
                  className="w-full text-xs p-2.5 border border-[var(--border-subtle)] focus:border-[var(--accent-cobalt)] outline-none"
                />
                {formErrors.title && (
                  <p className="text-[11px] text-[#B71C1C] mt-1">{formErrors.title}</p>
                )}
              </div>

              <div>
                <label htmlFor="create-pillar-description" className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">
                  Description *
                </label>
                <textarea
                  id="create-pillar-description"
                  name="description"
                  rows={3}
                  required
                  placeholder="Core engineering philosophy and principles..."
                  className="w-full text-xs p-2.5 border border-[var(--border-subtle)] focus:border-[var(--accent-cobalt)] outline-none"
                />
                {formErrors.description && (
                  <p className="text-[11px] text-[#B71C1C] mt-1">{formErrors.description}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-mono uppercase border border-[var(--border-subtle)] hover:bg-[var(--bg-surface)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 text-xs font-mono uppercase bg-[var(--text-primary)] text-white hover:bg-black disabled:opacity-50"
                >
                  {isPending ? 'Saving...' : 'Create Pillar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingPillar && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-pillar-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="bg-white border border-[var(--border-subtle)] w-full max-w-lg p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h2 id="edit-pillar-modal-title" className="text-base font-bold text-[var(--text-primary)]">Edit Pillar</h2>
              <button
                type="button"
                onClick={() => setEditingPillar(null)}
                className="text-xs font-mono text-[var(--text-secondary)] hover:text-black"
              >
                [ESC]
              </button>
            </div>

            {modalError && (
              <div className="p-3 text-xs bg-[#FDEDEC] text-[#B71C1C] border border-[#F5C6CB]">
                {modalError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label htmlFor="edit-pillar-index" className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">
                  String Index * (Preserved as string)
                </label>
                <input
                  id="edit-pillar-index"
                  name="index"
                  type="text"
                  required
                  defaultValue={editingPillar.index}
                  className="w-full text-xs p-2.5 border border-[var(--border-subtle)] focus:border-[var(--accent-cobalt)] outline-none font-mono"
                />
                {formErrors.index && (
                  <p className="text-[11px] text-[#B71C1C] mt-1">{formErrors.index}</p>
                )}
              </div>

              <div>
                <label htmlFor="edit-pillar-title" className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">
                  Pillar Title *
                </label>
                <input
                  id="edit-pillar-title"
                  name="title"
                  type="text"
                  required
                  defaultValue={editingPillar.title}
                  className="w-full text-xs p-2.5 border border-[var(--border-subtle)] focus:border-[var(--accent-cobalt)] outline-none"
                />
                {formErrors.title && (
                  <p className="text-[11px] text-[#B71C1C] mt-1">{formErrors.title}</p>
                )}
              </div>

              <div>
                <label htmlFor="edit-pillar-description" className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">
                  Description *
                </label>
                <textarea
                  id="edit-pillar-description"
                  name="description"
                  rows={3}
                  required
                  defaultValue={editingPillar.description}
                  className="w-full text-xs p-2.5 border border-[var(--border-subtle)] focus:border-[var(--accent-cobalt)] outline-none"
                />
                {formErrors.description && (
                  <p className="text-[11px] text-[#B71C1C] mt-1">{formErrors.description}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setEditingPillar(null)}
                  className="px-4 py-2 text-xs font-mono uppercase border border-[var(--border-subtle)] hover:bg-[var(--bg-surface)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 text-xs font-mono uppercase bg-[var(--text-primary)] text-white hover:bg-black disabled:opacity-50"
                >
                  {isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {pillarToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-pillar-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="bg-white border border-[var(--border-subtle)] w-full max-w-md p-6 space-y-4 shadow-xl">
            <h2 id="delete-pillar-modal-title" className="text-base font-bold text-[#B71C1C]">Confirm Delete Pillar</h2>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Are you sure you want to permanently delete pillar <strong className="text-[var(--text-primary)]">&quot;{pillarToDelete.title}&quot;</strong> (Index: {pillarToDelete.index}, ID: {pillarToDelete.id})?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setPillarToDelete(null)}
                disabled={isPending}
                className="px-4 py-2 text-xs font-mono uppercase border border-[var(--border-subtle)] hover:bg-[var(--bg-surface)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isPending}
                className="px-4 py-2 text-xs font-mono uppercase bg-[#B71C1C] text-white hover:bg-red-800 disabled:opacity-50"
              >
                {isPending ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
