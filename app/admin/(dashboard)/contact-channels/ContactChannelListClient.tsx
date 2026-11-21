// app/admin/(dashboard)/contact-channels/ContactChannelListClient.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createContactChannelAction,
  updateContactChannelAction,
  deleteContactChannelAction,
  reorderContactChannelsAction,
  type ActionFormState,
} from './actions';
import type { ContactChannelRecord } from '../../../../src/domain/entities/contact-channel-record';

interface ContactChannelListClientProps {
  readonly initialChannels: readonly ContactChannelRecord[];
}

export function ContactChannelListClient({ initialChannels }: ContactChannelListClientProps) {
  const router = useRouter();
  const [channels, setChannels] = useState<readonly ContactChannelRecord[]>(initialChannels);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<ContactChannelRecord | null>(null);
  const [channelToDelete, setChannelToDelete] = useState<ContactChannelRecord | null>(null);

  // Form states & errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [modalError, setModalError] = useState<string | null>(null);

  // Reorder handler
  const handleReorder = (currentIndex: number, direction: 'up' | 'down') => {
    if (isPending) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= channels.length) return;

    const reordered = [...channels];
    const temp = reordered[currentIndex];
    reordered[currentIndex] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    setChannels(reordered);
    setFeedback(null);

    const orderedIds = reordered.map((c) => c.id);

    startTransition(async () => {
      const result = await reorderContactChannelsAction(orderedIds);
      if (result.success) {
        setFeedback({ type: 'success', message: 'Contact channel order updated successfully.' });
        router.refresh();
      } else {
        setChannels(initialChannels);
        setFeedback({
          type: 'error',
          message: result.error || 'Failed to update contact channel order.',
        });
      }
    });
  };

  // Delete handler
  const confirmDelete = () => {
    if (!channelToDelete || isPending) return;
    const { id, label } = channelToDelete;

    startTransition(async () => {
      const result = await deleteContactChannelAction(id);
      if (result.success) {
        setChannels((prev) => prev.filter((c) => c.id !== id));
        setFeedback({
          type: 'success',
          message: `Contact channel "${label}" deleted successfully.`,
        });
        setChannelToDelete(null);
        router.refresh();
      } else {
        setFeedback({
          type: 'error',
          message: result.error || `Failed to delete contact channel "${label}".`,
        });
        setChannelToDelete(null);
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
      const result: ActionFormState = await createContactChannelAction({ success: false }, formData);
      if (result.success) {
        const createdChannel = result.data;
        if (createdChannel) {
          setChannels((prev) =>
            [...prev, createdChannel].sort((a, b) => a.order - b.order)
          );
        }
        setFeedback({ type: 'success', message: 'Contact channel created successfully.' });
        setIsCreateOpen(false);
        router.refresh();
      } else {
        setModalError(result.error || 'Failed to create contact channel.');
        if (result.errors) setFormErrors(result.errors);
      }
    });
  };

  // Edit submission
  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingChannel) return;
    setFormErrors({});
    setModalError(null);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result: ActionFormState = await updateContactChannelAction(
        editingChannel.id,
        { success: false },
        formData
      );
      if (result.success) {
        const updatedChannel = result.data;
        if (updatedChannel) {
          setChannels((prev) =>
            prev.map((c) => (c.id === updatedChannel.id ? updatedChannel : c))
          );
        }
        setFeedback({ type: 'success', message: 'Contact channel updated successfully.' });
        setEditingChannel(null);
        router.refresh();
      } else {
        setModalError(result.error || 'Failed to update contact channel.');
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

      {/* Anti-Placeholder Safety Note */}
      <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
        <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-primary)] font-semibold block mb-1">
          Authentic Channel Policy
        </span>
        Only verified official contact points (Email, GitHub, LinkedIn, etc.) are permitted. Synthetic placeholder markers (e.g. bracketed text) are automatically rejected at validation and presentation boundaries.
      </div>

      {/* Main Table / Empty State */}
      {channels.length === 0 ? (
        <div className="bg-white border border-[var(--border-subtle)] p-12 text-center space-y-3">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-secondary)]">
            No Contact Channels Configured
          </p>
          <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
            When 0 contact channels exist, the public portfolio safely hides the channel list without displaying placeholder entries. Add your first official channel below.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setFormErrors({});
                setModalError(null);
                setIsCreateOpen(true);
              }}
              className="px-5 py-2.5 bg-[var(--text-primary)] text-white text-xs font-mono tracking-widest uppercase hover:bg-black transition-colors"
            >
              + Create First Contact Channel
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[var(--border-subtle)] overflow-hidden">
          <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
            <span className="font-mono text-xs uppercase text-[var(--text-secondary)]">
              Total Channels: {channels.length}
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
              + Add Contact Channel
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">
                  <th scope="col" className="py-3 px-4 w-24 text-center">
                    Order
                  </th>
                  <th scope="col" className="py-3 px-4 w-40">
                    Label
                  </th>
                  <th scope="col" className="py-3 px-4">
                    Value / URL / Address
                  </th>
                  <th scope="col" className="py-3 px-4 w-44 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-xs">
                {channels.map((channel, index) => {
                  const isFirst = index === 0;
                  const isLast = index === channels.length - 1;

                  return (
                    <tr key={channel.id} className="hover:bg-[var(--bg-primary)] transition-colors">
                      {/* Order Controls */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">
                            #{channel.order}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleReorder(index, 'up')}
                              disabled={isFirst || isPending}
                              aria-label={`Move contact channel "${channel.label}" up`}
                              title="Move Up"
                              className="p-1 text-[11px] border border-[var(--border-subtle)] bg-white hover:bg-[var(--bg-surface)] disabled:opacity-30 disabled:cursor-not-allowed leading-none"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReorder(index, 'down')}
                              disabled={isLast || isPending}
                              aria-label={`Move contact channel "${channel.label}" down`}
                              title="Move Down"
                              className="p-1 text-[11px] border border-[var(--border-subtle)] bg-white hover:bg-[var(--bg-surface)] disabled:opacity-30 disabled:cursor-not-allowed leading-none"
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Label */}
                      <td className="py-4 px-4">
                        <span className="font-mono text-xs px-2 py-0.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] font-bold text-[var(--accent-cobalt)]">
                          {channel.label}
                        </span>
                      </td>

                      {/* Value */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <span className="font-medium text-sm text-[var(--text-primary)] break-all">
                            {channel.value}
                          </span>
                          <div className="text-[11px] font-mono text-[var(--text-secondary)]">
                            ID: {channel.id}
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
                              setEditingChannel(channel);
                            }}
                            disabled={isPending}
                            className="px-3 py-1.5 text-xs font-mono uppercase border border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] transition-colors disabled:opacity-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setChannelToDelete(channel)}
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
          aria-labelledby="create-channel-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="bg-white border border-[var(--border-subtle)] w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h2 id="create-channel-modal-title" className="text-base font-bold text-[var(--text-primary)]">
                Add Contact Channel
              </h2>
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
                <label
                  htmlFor="create-channel-label"
                  className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1"
                >
                  Channel Label * (e.g. &quot;Email&quot;, &quot;GitHub&quot;, &quot;LinkedIn&quot;)
                </label>
                <input
                  id="create-channel-label"
                  name="label"
                  type="text"
                  required
                  maxLength={100}
                  placeholder="Email"
                  className="w-full text-xs p-2.5 border border-[var(--border-subtle)] focus:border-[var(--accent-cobalt)] outline-none font-mono"
                />
                {formErrors.label && (
                  <p className="text-[11px] text-[#B71C1C] mt-1">{formErrors.label}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="create-channel-value"
                  className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1"
                >
                  Value / URL / Address *
                </label>
                <input
                  id="create-channel-value"
                  name="value"
                  type="text"
                  required
                  maxLength={500}
                  placeholder="e.g. hello@example.com or https://github.com/username"
                  className="w-full text-xs p-2.5 border border-[var(--border-subtle)] focus:border-[var(--accent-cobalt)] outline-none"
                />
                {formErrors.value && (
                  <p className="text-[11px] text-[#B71C1C] mt-1">{formErrors.value}</p>
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
                  {isPending ? 'Saving...' : 'Create Channel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingChannel && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-channel-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="bg-white border border-[var(--border-subtle)] w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h2 id="edit-channel-modal-title" className="text-base font-bold text-[var(--text-primary)]">
                Edit Contact Channel
              </h2>
              <button
                type="button"
                onClick={() => setEditingChannel(null)}
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
                <label
                  htmlFor="edit-channel-label"
                  className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1"
                >
                  Channel Label *
                </label>
                <input
                  id="edit-channel-label"
                  name="label"
                  type="text"
                  required
                  maxLength={100}
                  defaultValue={editingChannel.label}
                  className="w-full text-xs p-2.5 border border-[var(--border-subtle)] focus:border-[var(--accent-cobalt)] outline-none font-mono"
                />
                {formErrors.label && (
                  <p className="text-[11px] text-[#B71C1C] mt-1">{formErrors.label}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="edit-channel-value"
                  className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1"
                >
                  Value / URL / Address *
                </label>
                <input
                  id="edit-channel-value"
                  name="value"
                  type="text"
                  required
                  maxLength={500}
                  defaultValue={editingChannel.value}
                  className="w-full text-xs p-2.5 border border-[var(--border-subtle)] focus:border-[var(--accent-cobalt)] outline-none"
                />
                {formErrors.value && (
                  <p className="text-[11px] text-[#B71C1C] mt-1">{formErrors.value}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setEditingChannel(null)}
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
      {channelToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-channel-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="bg-white border border-[var(--border-subtle)] w-full max-w-md p-6 space-y-4 shadow-xl">
            <h2 id="delete-channel-modal-title" className="text-base font-bold text-[#B71C1C]">
              Confirm Delete Contact Channel
            </h2>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Are you sure you want to permanently delete contact channel{' '}
              <strong className="text-[var(--text-primary)]">&quot;{channelToDelete.label}&quot;</strong>{' '}
              ({channelToDelete.value}, ID: {channelToDelete.id})? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setChannelToDelete(null)}
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
