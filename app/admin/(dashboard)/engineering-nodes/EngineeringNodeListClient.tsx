// app/admin/(dashboard)/engineering-nodes/EngineeringNodeListClient.tsx
'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  createEngineeringNodeAction,
  updateEngineeringNodeAction,
  deleteEngineeringNodeAction,
  reorderEngineeringNodesAction,
  type ActionFormState,
} from './actions';
import type { EngineeringNodeRecord } from '../../../../src/domain/entities/engineering-node-record';

interface EngineeringNodeListClientProps {
  readonly initialNodes: readonly EngineeringNodeRecord[];
}

export function EngineeringNodeListClient({ initialNodes }: EngineeringNodeListClientProps) {
  const router = useRouter();
  const [nodes, setNodes] = useState<readonly EngineeringNodeRecord[]>(initialNodes);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<EngineeringNodeRecord | null>(null);
  const [nodeToDelete, setNodeToDelete] = useState<EngineeringNodeRecord | null>(null);

  // Form states & errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [modalError, setModalError] = useState<string | null>(null);

  const isAnyModalOpen = isCreateOpen || editingNode !== null || nodeToDelete !== null;

  useEffect(() => {
    if (!isAnyModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isPending) {
        setIsCreateOpen(false);
        setEditingNode(null);
        setNodeToDelete(null);
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
    if (targetIndex < 0 || targetIndex >= nodes.length) return;

    const reordered = [...nodes];
    const temp = reordered[currentIndex];
    reordered[currentIndex] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    setNodes(reordered);
    setFeedback(null);

    const orderedIds = reordered.map((n) => n.id);

    startTransition(async () => {
      const result = await reorderEngineeringNodesAction(orderedIds);
      if (result.success) {
        setFeedback({ type: 'success', message: 'Node order updated successfully.' });
        router.refresh();
      } else {
        setNodes(initialNodes);
        setFeedback({
          type: 'error',
          message: result.error || 'Failed to update node order.',
        });
      }
    });
  };

  // Delete handler
  const confirmDelete = () => {
    if (!nodeToDelete || isPending) return;
    const { id, title } = nodeToDelete;

    startTransition(async () => {
      const result = await deleteEngineeringNodeAction(id);
      if (result.success) {
        setNodes((prev) => prev.filter((n) => n.id !== id));
        setFeedback({
          type: 'success',
          message: `Node "${title}" deleted successfully.`,
        });
        setNodeToDelete(null);
        router.refresh();
      } else {
        setFeedback({
          type: 'error',
          message: result.error || `Failed to delete node "${title}".`,
        });
        setNodeToDelete(null);
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
      const result: ActionFormState = await createEngineeringNodeAction({ success: false }, formData);
      if (result.success) {
        setFeedback({ type: 'success', message: 'Engineering node created successfully.' });
        setIsCreateOpen(false);
        router.refresh();
      } else {
        setModalError(result.error || 'Failed to create engineering node.');
        if (result.errors) setFormErrors(result.errors);
      }
    });
  };

  // Edit submission
  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingNode) return;
    setFormErrors({});
    setModalError(null);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result: ActionFormState = await updateEngineeringNodeAction(editingNode.id, { success: false }, formData);
      if (result.success) {
        setFeedback({ type: 'success', message: 'Engineering node updated successfully.' });
        setEditingNode(null);
        router.refresh();
      } else {
        setModalError(result.error || 'Failed to update engineering node.');
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
      {nodes.length === 0 ? (
        <div className="bg-white border border-[var(--border-subtle)] p-12 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-secondary)]">
            No Engineering Nodes Found
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="px-5 py-2.5 bg-[var(--text-primary)] text-white text-xs font-mono tracking-widest uppercase hover:bg-black transition-colors"
            >
              + Create First Node
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[var(--border-subtle)] overflow-hidden">
          <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
            <span className="font-mono text-xs uppercase text-[var(--text-secondary)]">
              Total Nodes: {nodes.length}
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
              + Add Node
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">
                  <th scope="col" className="py-3 px-4 w-24 text-center">Order</th>
                  <th scope="col" className="py-3 px-4 w-28">Tag</th>
                  <th scope="col" className="py-3 px-4">Node Title &amp; Description</th>
                  <th scope="col" className="py-3 px-4 w-36">Tech Stack</th>
                  <th scope="col" className="py-3 px-4 w-28 text-center">Highlight</th>
                  <th scope="col" className="py-3 px-4 w-44 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-xs">
                {nodes.map((node, index) => {
                  const isFirst = index === 0;
                  const isLast = index === nodes.length - 1;

                  return (
                    <tr key={node.id} className="hover:bg-[var(--bg-primary)] transition-colors">
                      {/* Order Controls */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">
                            #{node.order}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleReorder(index, 'up')}
                              disabled={isFirst || isPending}
                              aria-label={`Move node "${node.title}" up`}
                              title="Move Up"
                              className="p-1 text-[11px] border border-[var(--border-subtle)] bg-white hover:bg-[var(--bg-surface)] disabled:opacity-30 disabled:cursor-not-allowed leading-none"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReorder(index, 'down')}
                              disabled={isLast || isPending}
                              aria-label={`Move node "${node.title}" down`}
                              title="Move Down"
                              className="p-1 text-[11px] border border-[var(--border-subtle)] bg-white hover:bg-[var(--bg-surface)] disabled:opacity-30 disabled:cursor-not-allowed leading-none"
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Tag */}
                      <td className="py-4 px-4">
                        <span className="font-mono text-xs px-2 py-0.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] font-medium text-[var(--accent-cobalt)]">
                          {node.tag}
                        </span>
                      </td>

                      {/* Title & Description */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <span className="font-semibold text-sm text-[var(--text-primary)]">
                            {node.title}
                          </span>
                          <p className="text-xs text-[var(--text-secondary)] line-clamp-2 max-w-lg leading-relaxed">
                            {node.description}
                          </p>
                          <div className="text-[11px] font-mono text-[var(--text-secondary)]">
                            ID: {node.id}
                          </div>
                        </div>
                      </td>

                      {/* Tech Stack */}
                      <td className="py-4 px-4">
                        {node.stack ? (
                          <span className="text-xs font-mono text-[var(--text-primary)]">
                            {node.stack}
                          </span>
                        ) : (
                          <span className="text-xs font-mono text-[var(--text-secondary)] italic">
                            —
                          </span>
                        )}
                      </td>

                      {/* Highlighted Flag */}
                      <td className="py-4 px-4 text-center">
                        {node.highlighted ? (
                          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono uppercase bg-[#E8EEFD] text-[var(--accent-cobalt)] border border-[#C2D4F8] font-bold">
                            YES
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono uppercase bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                            NO
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setFormErrors({});
                              setModalError(null);
                              setEditingNode(node);
                            }}
                            disabled={isPending}
                            className="px-3 py-1.5 text-xs font-mono uppercase border border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] transition-colors disabled:opacity-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setNodeToDelete(node)}
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
          aria-labelledby="create-node-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="bg-white border border-[var(--border-subtle)] w-full max-w-lg p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h2 id="create-node-modal-title" className="text-base font-bold text-[var(--text-primary)]">Add New Engineering Node</h2>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="create-node-tag" className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">
                    Tag *
                  </label>
                  <input
                    id="create-node-tag"
                    name="tag"
                    type="text"
                    required
                    placeholder="e.g. CORE"
                    className="w-full text-xs p-2.5 border border-[var(--border-subtle)] focus:border-[var(--accent-cobalt)] outline-none"
                  />
                  {formErrors.tag && (
                    <p className="text-[11px] text-[#B71C1C] mt-1">{formErrors.tag}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="create-node-title" className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">
                    Title *
                  </label>
                  <input
                    id="create-node-title"
                    name="title"
                    type="text"
                    required
                    placeholder="e.g. Distributed Architecture"
                    className="w-full text-xs p-2.5 border border-[var(--border-subtle)] focus:border-[var(--accent-cobalt)] outline-none"
                  />
                  {formErrors.title && (
                    <p className="text-[11px] text-[#B71C1C] mt-1">{formErrors.title}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="create-node-description" className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">
                  Description *
                </label>
                <textarea
                  id="create-node-description"
                  name="description"
                  rows={3}
                  required
                  placeholder="Concise technical description of this engineering schematic node..."
                  className="w-full text-xs p-2.5 border border-[var(--border-subtle)] focus:border-[var(--accent-cobalt)] outline-none"
                />
                {formErrors.description && (
                  <p className="text-[11px] text-[#B71C1C] mt-1">{formErrors.description}</p>
                )}
              </div>

              <div>
                <label htmlFor="create-node-stack" className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">
                  Tech Stack (Optional / Nullable)
                </label>
                <input
                  id="create-node-stack"
                  name="stack"
                  type="text"
                  placeholder="e.g. Go, PostgreSQL, Redis (or leave blank for null)"
                  className="w-full text-xs p-2.5 border border-[var(--border-subtle)] focus:border-[var(--accent-cobalt)] outline-none"
                />
                <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                  Leave completely empty to persist as null.
                </p>
                {formErrors.stack && (
                  <p className="text-[11px] text-[#B71C1C] mt-1">{formErrors.stack}</p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  id="create-node-highlighted"
                  name="highlighted"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-[var(--accent-cobalt)]"
                />
                <label htmlFor="create-node-highlighted" className="text-xs text-[var(--text-primary)] font-medium">
                  Highlighted Schematic Node
                </label>
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
                  {isPending ? 'Saving...' : 'Create Node'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingNode && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-node-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="bg-white border border-[var(--border-subtle)] w-full max-w-lg p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h2 id="edit-node-modal-title" className="text-base font-bold text-[var(--text-primary)]">Edit Engineering Node</h2>
              <button
                type="button"
                onClick={() => setEditingNode(null)}
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-node-tag" className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">
                    Tag *
                  </label>
                  <input
                    id="edit-node-tag"
                    name="tag"
                    type="text"
                    required
                    defaultValue={editingNode.tag}
                    className="w-full text-xs p-2.5 border border-[var(--border-subtle)] focus:border-[var(--accent-cobalt)] outline-none"
                  />
                  {formErrors.tag && (
                    <p className="text-[11px] text-[#B71C1C] mt-1">{formErrors.tag}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="edit-node-title" className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">
                    Title *
                  </label>
                  <input
                    id="edit-node-title"
                    name="title"
                    type="text"
                    required
                    defaultValue={editingNode.title}
                    className="w-full text-xs p-2.5 border border-[var(--border-subtle)] focus:border-[var(--accent-cobalt)] outline-none"
                  />
                  {formErrors.title && (
                    <p className="text-[11px] text-[#B71C1C] mt-1">{formErrors.title}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="edit-node-description" className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">
                  Description *
                </label>
                <textarea
                  id="edit-node-description"
                  name="description"
                  rows={3}
                  required
                  defaultValue={editingNode.description}
                  className="w-full text-xs p-2.5 border border-[var(--border-subtle)] focus:border-[var(--accent-cobalt)] outline-none"
                />
                {formErrors.description && (
                  <p className="text-[11px] text-[#B71C1C] mt-1">{formErrors.description}</p>
                )}
              </div>

              <div>
                <label htmlFor="edit-node-stack" className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">
                  Tech Stack (Optional / Nullable)
                </label>
                <input
                  id="edit-node-stack"
                  name="stack"
                  type="text"
                  defaultValue={editingNode.stack ?? ''}
                  placeholder="e.g. Go, PostgreSQL (or leave blank to clear to null)"
                  className="w-full text-xs p-2.5 border border-[var(--border-subtle)] focus:border-[var(--accent-cobalt)] outline-none"
                />
                <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                  Clear input completely to save as null.
                </p>
                {formErrors.stack && (
                  <p className="text-[11px] text-[#B71C1C] mt-1">{formErrors.stack}</p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  id="edit-node-highlighted"
                  name="highlighted"
                  type="checkbox"
                  defaultChecked={editingNode.highlighted}
                  className="h-4 w-4 rounded border-gray-300 text-[var(--accent-cobalt)]"
                />
                <label htmlFor="edit-node-highlighted" className="text-xs text-[var(--text-primary)] font-medium">
                  Highlighted Schematic Node
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setEditingNode(null)}
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
      {nodeToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-node-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="bg-white border border-[var(--border-subtle)] w-full max-w-md p-6 space-y-4 shadow-xl">
            <h2 id="delete-node-modal-title" className="text-base font-bold text-[#B71C1C]">Confirm Delete Engineering Node</h2>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Are you sure you want to permanently delete node <strong className="text-[var(--text-primary)]">&quot;{nodeToDelete.title}&quot;</strong> (Tag: {nodeToDelete.tag}, ID: {nodeToDelete.id})?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setNodeToDelete(null)}
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
