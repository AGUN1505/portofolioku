// app/admin/(dashboard)/domains/DomainListClient.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createDomainAction,
  updateDomainAction,
  deleteDomainAction,
  reorderDomainsAction,
  type ActionFormState,
} from './actions';
import type { DomainRecord } from '../../../../src/domain/entities/domain-record';

interface DomainListClientProps {
  readonly initialDomains: readonly DomainRecord[];
}

export function DomainListClient({ initialDomains }: DomainListClientProps) {
  const router = useRouter();
  const [domains, setDomains] = useState<readonly DomainRecord[]>(initialDomains);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<DomainRecord | null>(null);
  const [domainToDelete, setDomainToDelete] = useState<DomainRecord | null>(null);

  // Form states & errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [modalError, setModalError] = useState<string | null>(null);

  // Reorder handler
  const handleReorder = (currentIndex: number, direction: 'up' | 'down') => {
    if (isPending) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= domains.length) return;

    const reordered = [...domains];
    const temp = reordered[currentIndex];
    reordered[currentIndex] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    setDomains(reordered);
    setFeedback(null);

    const orderedIds = reordered.map((d) => d.id);

    startTransition(async () => {
      const result = await reorderDomainsAction(orderedIds);
      if (result.success) {
        setFeedback({ type: 'success', message: 'Domain order updated successfully.' });
        router.refresh();
      } else {
        setDomains(initialDomains);
        setFeedback({
          type: 'error',
          message: result.error || 'Failed to update domain order.',
        });
      }
    });
  };

  // Delete handler
  const confirmDelete = () => {
    if (!domainToDelete || isPending) return;
    const { id, title } = domainToDelete;

    startTransition(async () => {
      const result = await deleteDomainAction(id);
      if (result.success) {
        setDomains((prev) => prev.filter((d) => d.id !== id));
        setFeedback({
          type: 'success',
          message: `Domain "${title}" deleted successfully.`,
        });
        setDomainToDelete(null);
        router.refresh();
      } else {
        setFeedback({
          type: 'error',
          message: result.error || `Failed to delete domain "${title}".`,
        });
        setDomainToDelete(null);
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
      const result: ActionFormState = await createDomainAction({ success: false }, formData);
      if (result.success) {
        setFeedback({ type: 'success', message: 'Domain created successfully.' });
        setIsCreateOpen(false);
        router.refresh();
      } else {
        setModalError(result.error || 'Failed to create domain.');
        if (result.errors) setFormErrors(result.errors);
      }
    });
  };

  // Edit submission
  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingDomain) return;
    setFormErrors({});
    setModalError(null);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result: ActionFormState = await updateDomainAction(editingDomain.id, { success: false }, formData);
      if (result.success) {
        setFeedback({ type: 'success', message: 'Domain updated successfully.' });
        setEditingDomain(null);
        router.refresh();
      } else {
        setModalError(result.error || 'Failed to update domain.');
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
      {domains.length === 0 ? (
        <div className="bg-white border border-[var(--border-subtle)] p-12 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-secondary)]">
            No Domains Found
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="px-5 py-2.5 bg-[var(--text-primary)] text-white text-xs font-mono tracking-widest uppercase hover:bg-black transition-colors"
            >
              + Create First Domain
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[var(--border-subtle)] overflow-hidden">
          <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
            <span className="font-mono text-xs uppercase text-[var(--text-secondary)]">
              Total Domains: {domains.length}
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
              + Add Domain
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">
                  <th scope="col" className="py-3 px-4 w-24 text-center">Order</th>
                  <th scope="col" className="py-3 px-4 w-28 text-center">Index (Str)</th>
                  <th scope="col" className="py-3 px-4">Domain Title</th>
                  <th scope="col" className="py-3 px-4 w-44 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-xs">
                {domains.map((domain, index) => {
                  const isFirst = index === 0;
                  const isLast = index === domains.length - 1;

                  return (
                    <tr key={domain.id} className="hover:bg-[var(--bg-primary)] transition-colors">
                      {/* Order Controls */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">
                            #{domain.order}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleReorder(index, 'up')}
                              disabled={isFirst || isPending}
                              aria-label={`Move domain "${domain.title}" up`}
                              title="Move Up"
                              className="p-1 text-[11px] border border-[var(--border-subtle)] bg-white hover:bg-[var(--bg-surface)] disabled:opacity-30 disabled:cursor-not-allowed leading-none"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReorder(index, 'down')}
                              disabled={isLast || isPending}
                              aria-label={`Move domain "${domain.title}" down`}
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
                          {domain.index}
                        </span>
                      </td>

                      {/* Title */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <span className="font-semibold text-sm text-[var(--text-primary)]">
                            {domain.title}
                          </span>
                          <div className="text-[11px] font-mono text-[var(--text-secondary)]">
                            ID: {domain.id}
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
                              setEditingDomain(domain);
                            }}
                            disabled={isPending}
                            className="px-3 py-1.5 text-xs font-mono uppercase border border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] transition-colors disabled:opacity-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDomainToDelete(domain)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[var(--border-subtle)] w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h2 className="text-base font-bold text-[var(--text-primary)]">Add New Domain</h2>
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
                <label htmlFor="create-domain-index" className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">
                  String Index * (e.g. &quot;01&quot;, &quot;02&quot;)
                </label>
                <input
                  id="create-domain-index"
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
                <label htmlFor="create-domain-title" className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">
                  Domain Title *
                </label>
                <input
                  id="create-domain-title"
                  name="title"
                  type="text"
                  required
                  placeholder="e.g. Distributed Systems"
                  className="w-full text-xs p-2.5 border border-[var(--border-subtle)] focus:border-[var(--accent-cobalt)] outline-none"
                />
                {formErrors.title && (
                  <p className="text-[11px] text-[#B71C1C] mt-1">{formErrors.title}</p>
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
                  {isPending ? 'Saving...' : 'Create Domain'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingDomain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[var(--border-subtle)] w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h2 className="text-base font-bold text-[var(--text-primary)]">Edit Domain</h2>
              <button
                type="button"
                onClick={() => setEditingDomain(null)}
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
                <label htmlFor="edit-domain-index" className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">
                  String Index * (Preserved as string)
                </label>
                <input
                  id="edit-domain-index"
                  name="index"
                  type="text"
                  required
                  defaultValue={editingDomain.index}
                  className="w-full text-xs p-2.5 border border-[var(--border-subtle)] focus:border-[var(--accent-cobalt)] outline-none font-mono"
                />
                {formErrors.index && (
                  <p className="text-[11px] text-[#B71C1C] mt-1">{formErrors.index}</p>
                )}
              </div>

              <div>
                <label htmlFor="edit-domain-title" className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">
                  Domain Title *
                </label>
                <input
                  id="edit-domain-title"
                  name="title"
                  type="text"
                  required
                  defaultValue={editingDomain.title}
                  className="w-full text-xs p-2.5 border border-[var(--border-subtle)] focus:border-[var(--accent-cobalt)] outline-none"
                />
                {formErrors.title && (
                  <p className="text-[11px] text-[#B71C1C] mt-1">{formErrors.title}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setEditingDomain(null)}
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
      {domainToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[var(--border-subtle)] w-full max-w-md p-6 space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-[#B71C1C]">Confirm Delete Domain</h2>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Are you sure you want to permanently delete domain <strong className="text-[var(--text-primary)]">&quot;{domainToDelete.title}&quot;</strong> (Index: {domainToDelete.index}, ID: {domainToDelete.id})?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setDomainToDelete(null)}
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
