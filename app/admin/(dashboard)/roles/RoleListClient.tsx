// app/admin/(dashboard)/roles/RoleListClient.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createRoleAction,
  updateRoleAction,
  deleteRoleAction,
  reorderRolesAction,
  type ActionFormState,
} from './actions';
import type { RoleRecord } from '../../../../src/domain/entities/role-record';

interface RoleListClientProps {
  readonly initialRoles: readonly RoleRecord[];
}

export function RoleListClient({ initialRoles }: RoleListClientProps) {
  const router = useRouter();
  const [roles, setRoles] = useState<readonly RoleRecord[]>(initialRoles);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleRecord | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<RoleRecord | null>(null);

  // Form states & errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [modalError, setModalError] = useState<string | null>(null);

  // Reorder handler
  const handleReorder = (currentIndex: number, direction: 'up' | 'down') => {
    if (isPending) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= roles.length) return;

    const reordered = [...roles];
    const temp = reordered[currentIndex];
    reordered[currentIndex] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    setRoles(reordered);
    setFeedback(null);

    const orderedIds = reordered.map((r) => r.id);

    startTransition(async () => {
      const result = await reorderRolesAction(orderedIds);
      if (result.success) {
        setFeedback({ type: 'success', message: 'Role order updated successfully.' });
        router.refresh();
      } else {
        setRoles(initialRoles);
        setFeedback({
          type: 'error',
          message: result.error || 'Failed to update role order.',
        });
      }
    });
  };

  // Delete handler
  const confirmDelete = () => {
    if (!roleToDelete || isPending) return;
    const { id, title } = roleToDelete;

    startTransition(async () => {
      const result = await deleteRoleAction(id);
      if (result.success) {
        setRoles((prev) => prev.filter((r) => r.id !== id));
        setFeedback({
          type: 'success',
          message: `Role "${title}" deleted successfully.`,
        });
        setRoleToDelete(null);
        router.refresh();
      } else {
        setFeedback({
          type: 'error',
          message: result.error || `Failed to delete role "${title}".`,
        });
        setRoleToDelete(null);
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
      const result: ActionFormState = await createRoleAction({ success: false }, formData);
      if (result.success) {
        setFeedback({ type: 'success', message: 'Role created successfully.' });
        setIsCreateOpen(false);
        router.refresh();
      } else {
        setModalError(result.error || 'Failed to create role.');
        if (result.errors) setFormErrors(result.errors);
      }
    });
  };

  // Edit submission
  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingRole) return;
    setFormErrors({});
    setModalError(null);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result: ActionFormState = await updateRoleAction(editingRole.id, { success: false }, formData);
      if (result.success) {
        setFeedback({ type: 'success', message: 'Role updated successfully.' });
        setEditingRole(null);
        router.refresh();
      } else {
        setModalError(result.error || 'Failed to update role.');
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

      {/* Primary Role Policy Info */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4 text-xs">
        <p className="font-semibold text-[var(--text-primary)]">Primary Role Policy</p>
        <p className="text-[var(--text-secondary)] mt-1">
          Roles flagged as <strong>Primary</strong> receive bold cobalt highlight styling on the public hero section.
          Multiple primary roles or zero primary roles are permitted by public presentation.
        </p>
      </div>

      {/* Main Table */}
      {roles.length === 0 ? (
        <div className="bg-white border border-[var(--border-subtle)] p-12 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-secondary)]">
            No Roles Found
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="px-5 py-2.5 bg-[var(--text-primary)] text-white text-xs font-mono tracking-widest uppercase hover:bg-black transition-colors"
            >
              + Create First Role
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[var(--border-subtle)] overflow-hidden">
          <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
            <span className="font-mono text-xs uppercase text-[var(--text-secondary)]">
              Total Records: {roles.length}
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
              + Add Role
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">
                  <th scope="col" className="py-3 px-4 w-24 text-center">Order</th>
                  <th scope="col" className="py-3 px-4">Role Title</th>
                  <th scope="col" className="py-3 px-4 w-32 text-center">Status</th>
                  <th scope="col" className="py-3 px-4 w-44 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-xs">
                {roles.map((role, index) => {
                  const isFirst = index === 0;
                  const isLast = index === roles.length - 1;

                  return (
                    <tr key={role.id} className="hover:bg-[var(--bg-primary)] transition-colors">
                      {/* Order Controls */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">
                            #{role.order}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleReorder(index, 'up')}
                              disabled={isFirst || isPending}
                              aria-label={`Move role "${role.title}" up`}
                              title="Move Up"
                              className="p-1 text-[11px] border border-[var(--border-subtle)] bg-white hover:bg-[var(--bg-surface)] disabled:opacity-30 disabled:cursor-not-allowed leading-none"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReorder(index, 'down')}
                              disabled={isLast || isPending}
                              aria-label={`Move role "${role.title}" down`}
                              title="Move Down"
                              className="p-1 text-[11px] border border-[var(--border-subtle)] bg-white hover:bg-[var(--bg-surface)] disabled:opacity-30 disabled:cursor-not-allowed leading-none"
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Title */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <span className="font-semibold text-sm text-[var(--text-primary)]">
                            {role.title}
                          </span>
                          <div className="text-[11px] font-mono text-[var(--text-secondary)]">
                            ID: {role.id}
                          </div>
                        </div>
                      </td>

                      {/* Primary Flag Badge */}
                      <td className="py-4 px-4 text-center">
                        {role.primary ? (
                          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono uppercase bg-[#E8EEFD] text-[var(--accent-cobalt)] border border-[#C2D4F8] font-bold">
                            PRIMARY
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono uppercase bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                            STANDARD
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
                              setEditingRole(role);
                            }}
                            disabled={isPending}
                            className="px-3 py-1.5 text-xs font-mono uppercase border border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] transition-colors disabled:opacity-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setRoleToDelete(role)}
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
              <h2 className="text-base font-bold text-[var(--text-primary)]">Add New Role</h2>
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
                <label htmlFor="create-role-title" className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">
                  Role Title *
                </label>
                <input
                  id="create-role-title"
                  name="title"
                  type="text"
                  required
                  placeholder="e.g. Backend Engineer"
                  className="w-full text-xs p-2.5 border border-[var(--border-subtle)] focus:border-[var(--accent-cobalt)] outline-none"
                />
                {formErrors.title && (
                  <p className="text-[11px] text-[#B71C1C] mt-1">{formErrors.title}</p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  id="create-role-primary"
                  name="primary"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-[var(--accent-cobalt)]"
                />
                <label htmlFor="create-role-primary" className="text-xs text-[var(--text-primary)] font-medium">
                  Designate as Primary Role (accent styling)
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
                  {isPending ? 'Saving...' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[var(--border-subtle)] w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h2 className="text-base font-bold text-[var(--text-primary)]">Edit Role</h2>
              <button
                type="button"
                onClick={() => setEditingRole(null)}
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
                <label htmlFor="edit-role-title" className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">
                  Role Title *
                </label>
                <input
                  id="edit-role-title"
                  name="title"
                  type="text"
                  required
                  defaultValue={editingRole.title}
                  className="w-full text-xs p-2.5 border border-[var(--border-subtle)] focus:border-[var(--accent-cobalt)] outline-none"
                />
                {formErrors.title && (
                  <p className="text-[11px] text-[#B71C1C] mt-1">{formErrors.title}</p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  id="edit-role-primary"
                  name="primary"
                  type="checkbox"
                  defaultChecked={editingRole.primary}
                  className="h-4 w-4 rounded border-gray-300 text-[var(--accent-cobalt)]"
                />
                <label htmlFor="edit-role-primary" className="text-xs text-[var(--text-primary)] font-medium">
                  Designate as Primary Role (accent styling)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setEditingRole(null)}
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
      {roleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[var(--border-subtle)] w-full max-w-md p-6 space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-[#B71C1C]">Confirm Delete Role</h2>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Are you sure you want to permanently delete role <strong className="text-[var(--text-primary)]">&quot;{roleToDelete.title}&quot;</strong> (ID: {roleToDelete.id})?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setRoleToDelete(null)}
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
