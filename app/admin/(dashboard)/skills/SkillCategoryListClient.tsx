// app/admin/(dashboard)/skills/SkillCategoryListClient.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createSkillCategoryAction,
  updateSkillCategoryAction,
  deleteSkillCategoryAction,
  reorderSkillCategoriesAction,
  createSkillAction,
  updateSkillAction,
  deleteSkillAction,
  reorderSkillsAction,
  type ActionFormState,
} from './actions';
import type { SkillCategoryRecord } from '../../../../src/domain/entities/skill-category-record';
import type { SkillRecord } from '../../../../src/domain/entities/skill-record';

export interface SkillCategoryWithSkills extends SkillCategoryRecord {
  skills: SkillRecord[];
}

interface SkillCategoryListClientProps {
  readonly initialCategories: readonly SkillCategoryWithSkills[];
}

export function SkillCategoryListClient({ initialCategories }: SkillCategoryListClientProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<SkillCategoryWithSkills[]>(
    initialCategories.map((c) => ({ ...c, skills: [...c.skills] }))
  );
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Category Modal states
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SkillCategoryRecord | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<{
    id: string;
    title: string;
    skillCount: number;
    requiresConfirmation: boolean;
  } | null>(null);

  // Skill Modal states
  const [createSkillTargetCategory, setCreateSkillTargetCategory] = useState<string | null>(null);
  const [editingSkill, setEditingSkill] = useState<SkillRecord | null>(null);
  const [skillToDelete, setSkillToDelete] = useState<SkillRecord | null>(null);

  // Form errors & modal error
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [modalError, setModalError] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // CATEGORY ACTIONS
  // -------------------------------------------------------------------------

  const handleCategoryReorder = (currentIndex: number, direction: 'up' | 'down') => {
    if (isPending) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const reordered = [...categories];
    const temp = reordered[currentIndex];
    reordered[currentIndex] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    setCategories(reordered);
    setFeedback(null);

    const orderedIds = reordered.map((c) => c.id);

    startTransition(async () => {
      const result = await reorderSkillCategoriesAction(orderedIds);
      if (result.success) {
        setFeedback({ type: 'success', message: 'Category order updated successfully.' });
        router.refresh();
      } else {
        setCategories(initialCategories.map((c) => ({ ...c, skills: [...c.skills] })));
        setFeedback({
          type: 'error',
          message: result.error || 'Failed to update category order.',
        });
      }
    });
  };

  const handleCreateCategorySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormErrors({});
    setModalError(null);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result: ActionFormState = await createSkillCategoryAction({ success: false }, formData);
      if (result.success) {
        setFeedback({ type: 'success', message: 'Skill category created successfully.' });
        setIsCreateCategoryOpen(false);
        router.refresh();
      } else {
        setModalError(result.error || 'Failed to create category.');
        if (result.errors) setFormErrors(result.errors);
      }
    });
  };

  const handleEditCategorySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCategory) return;
    setFormErrors({});
    setModalError(null);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result: ActionFormState = await updateSkillCategoryAction(editingCategory.id, { success: false }, formData);
      if (result.success) {
        setFeedback({ type: 'success', message: 'Skill category updated successfully.' });
        setEditingCategory(null);
        router.refresh();
      } else {
        setModalError(result.error || 'Failed to update category.');
        if (result.errors) setFormErrors(result.errors);
      }
    });
  };

  const initiateDeleteCategory = (cat: SkillCategoryWithSkills) => {
    setCategoryToDelete({
      id: cat.id,
      title: cat.title,
      skillCount: cat.skills.length,
      requiresConfirmation: cat.skills.length > 0,
    });
  };

  const confirmDeleteCategory = () => {
    if (!categoryToDelete || isPending) return;
    const { id, title, skillCount } = categoryToDelete;

    startTransition(async () => {
      const result = await deleteSkillCategoryAction(id, true, skillCount);
      if (result.success) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        setFeedback({
          type: 'success',
          message: `Category "${title}" deleted successfully.`,
        });
        setCategoryToDelete(null);
        router.refresh();
      } else {
        setFeedback({
          type: 'error',
          message: result.error || `Failed to delete category "${title}".`,
        });
        setCategoryToDelete(null);
      }
    });
  };

  // -------------------------------------------------------------------------
  // SKILL ACTIONS
  // -------------------------------------------------------------------------

  const handleSkillReorder = (categoryId: string, currentIndex: number, direction: 'up' | 'down') => {
    if (isPending) return;
    const catIndex = categories.findIndex((c) => c.id === categoryId);
    if (catIndex === -1) return;

    const cat = categories[catIndex];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= cat.skills.length) return;

    const updatedSkills = [...cat.skills];
    const temp = updatedSkills[currentIndex];
    updatedSkills[currentIndex] = updatedSkills[targetIndex];
    updatedSkills[targetIndex] = temp;

    const updatedCategories = [...categories];
    updatedCategories[catIndex] = { ...cat, skills: updatedSkills };

    setCategories(updatedCategories);
    setFeedback(null);

    const orderedIds = updatedSkills.map((s) => s.id);

    startTransition(async () => {
      const result = await reorderSkillsAction(categoryId, orderedIds);
      if (result.success) {
        setFeedback({ type: 'success', message: 'Skill order updated successfully.' });
        router.refresh();
      } else {
        setCategories(initialCategories.map((c) => ({ ...c, skills: [...c.skills] })));
        setFeedback({
          type: 'error',
          message: result.error || 'Failed to update skill order.',
        });
      }
    });
  };

  const handleCreateSkillSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormErrors({});
    setModalError(null);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result: ActionFormState = await createSkillAction({ success: false }, formData);
      if (result.success) {
        setFeedback({ type: 'success', message: 'Skill created successfully.' });
        setCreateSkillTargetCategory(null);
        router.refresh();
      } else {
        setModalError(result.error || 'Failed to create skill.');
        if (result.errors) setFormErrors(result.errors);
      }
    });
  };

  const handleEditSkillSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingSkill) return;
    setFormErrors({});
    setModalError(null);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result: ActionFormState = await updateSkillAction(editingSkill.id, { success: false }, formData);
      if (result.success) {
        setFeedback({ type: 'success', message: 'Skill updated successfully.' });
        setEditingSkill(null);
        router.refresh();
      } else {
        setModalError(result.error || 'Failed to update skill.');
        if (result.errors) setFormErrors(result.errors);
      }
    });
  };

  const confirmDeleteSkill = () => {
    if (!skillToDelete || isPending) return;
    const { id, name } = skillToDelete;

    startTransition(async () => {
      const result = await deleteSkillAction(id);
      if (result.success) {
        setCategories((prev) =>
          prev.map((c) => ({
            ...c,
            skills: c.skills.filter((s) => s.id !== id),
          }))
        );
        setFeedback({
          type: 'success',
          message: `Skill "${name}" deleted successfully.`,
        });
        setSkillToDelete(null);
        router.refresh();
      } else {
        setFeedback({
          type: 'error',
          message: result.error || `Failed to delete skill "${name}".`,
        });
        setSkillToDelete(null);
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

      {/* Top Controls */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase text-[var(--text-secondary)]">
          Total Categories: {categories.length} | Total Skills: {categories.reduce((acc, c) => acc + c.skills.length, 0)}
        </span>
        <button
          type="button"
          onClick={() => {
            setFormErrors({});
            setModalError(null);
            setIsCreateCategoryOpen(true);
          }}
          className="px-4 py-2 bg-[var(--text-primary)] text-white text-xs font-mono tracking-widest uppercase hover:bg-black transition-colors"
        >
          + Add Category
        </button>
      </div>

      {/* Category List */}
      {categories.length === 0 ? (
        <div className="bg-white border border-[var(--border-subtle)] p-12 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-secondary)]">
            No Skill Categories Found
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setIsCreateCategoryOpen(true)}
              className="px-5 py-2.5 bg-[var(--text-primary)] text-white text-xs font-mono tracking-widest uppercase hover:bg-black transition-colors"
            >
              + Create First Category
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {categories.map((category, catIndex) => {
            const isFirstCat = catIndex === 0;
            const isLastCat = catIndex === categories.length - 1;

            return (
              <div
                key={category.id}
                className="bg-white border border-[var(--border-subtle)] overflow-hidden"
              >
                {/* Category Header */}
                <div className="bg-[var(--bg-surface)] p-4 border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {/* Category Order Reorder Controls */}
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-white border border-[var(--border-subtle)]">
                        Cat #{category.order}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCategoryReorder(catIndex, 'up')}
                        disabled={isFirstCat || isPending}
                        title="Move Category Up"
                        className="p-1 text-[11px] border border-[var(--border-subtle)] bg-white hover:bg-[var(--bg-primary)] disabled:opacity-30 disabled:cursor-not-allowed leading-none"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCategoryReorder(catIndex, 'down')}
                        disabled={isLastCat || isPending}
                        title="Move Category Down"
                        className="p-1 text-[11px] border border-[var(--border-subtle)] bg-white hover:bg-[var(--bg-primary)] disabled:opacity-30 disabled:cursor-not-allowed leading-none"
                      >
                        ▼
                      </button>
                    </div>

                    <h2 className="text-base font-bold text-[var(--text-primary)]">
                      {category.title}
                    </h2>
                    <span className="text-xs font-mono text-[var(--text-secondary)]">
                      ({category.skills.length} skills)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormErrors({});
                        setModalError(null);
                        setCreateSkillTargetCategory(category.id);
                      }}
                      className="px-3 py-1.5 text-xs font-mono uppercase bg-[var(--text-primary)] text-white hover:bg-black transition-colors"
                    >
                      + Add Skill
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormErrors({});
                        setModalError(null);
                        setEditingCategory(category);
                      }}
                      disabled={isPending}
                      className="px-3 py-1.5 text-xs font-mono uppercase border border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] transition-colors disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => initiateDeleteCategory(category)}
                      disabled={isPending}
                      className="px-3 py-1.5 text-xs font-mono uppercase text-[#B71C1C] border border-[#F5C6CB] hover:bg-[#FDEDEC] transition-colors disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Skills Table */}
                {category.skills.length === 0 ? (
                  <div className="p-6 text-center text-xs font-mono text-[var(--text-secondary)]">
                    No skills in this category. Click &quot;+ Add Skill&quot; above to add one.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[var(--border-subtle)] bg-white text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">
                          <th scope="col" className="py-2.5 px-4 w-24 text-center">Skill Order</th>
                          <th scope="col" className="py-2.5 px-4">Skill Name</th>
                          <th scope="col" className="py-2.5 px-4 w-40 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)] text-xs">
                        {category.skills.map((skill, sIndex) => {
                          const isFirstSkill = sIndex === 0;
                          const isLastSkill = sIndex === category.skills.length - 1;

                          return (
                            <tr key={skill.id} className="hover:bg-[var(--bg-primary)] transition-colors">
                              {/* Reorder Skill */}
                              <td className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">
                                    #{skill.order}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleSkillReorder(category.id, sIndex, 'up')}
                                    disabled={isFirstSkill || isPending}
                                    title="Move Skill Up"
                                    className="p-1 text-[10px] border border-[var(--border-subtle)] bg-white hover:bg-[var(--bg-surface)] disabled:opacity-30 disabled:cursor-not-allowed leading-none"
                                  >
                                    ▲
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSkillReorder(category.id, sIndex, 'down')}
                                    disabled={isLastSkill || isPending}
                                    title="Move Skill Down"
                                    className="p-1 text-[10px] border border-[var(--border-subtle)] bg-white hover:bg-[var(--bg-surface)] disabled:opacity-30 disabled:cursor-not-allowed leading-none"
                                  >
                                    ▼
                                  </button>
                                </div>
                              </td>

                              {/* Skill Name */}
                              <td className="py-3 px-4">
                                <div className="space-y-0.5">
                                  <span className="font-semibold text-sm text-[var(--text-primary)]">
                                    {skill.name}
                                  </span>
                                  <div className="text-[10px] font-mono text-[var(--text-secondary)]">
                                    ID: {skill.id}
                                  </div>
                                </div>
                              </td>

                              {/* Actions */}
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFormErrors({});
                                      setModalError(null);
                                      setEditingSkill(skill);
                                    }}
                                    disabled={isPending}
                                    className="px-2.5 py-1 text-xs font-mono uppercase border border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] transition-colors disabled:opacity-50"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setSkillToDelete(skill)}
                                    disabled={isPending}
                                    className="px-2.5 py-1 text-xs font-mono uppercase text-[#B71C1C] border border-[#F5C6CB] hover:bg-[#FDEDEC] transition-colors disabled:opacity-50"
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
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Category Modal */}
      {isCreateCategoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[var(--border-subtle)] w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h2 className="text-base font-bold text-[var(--text-primary)]">Add Skill Category</h2>
              <button
                type="button"
                onClick={() => setIsCreateCategoryOpen(false)}
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

            <form onSubmit={handleCreateCategorySubmit} className="space-y-4">
              <div>
                <label htmlFor="create-cat-title" className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">
                  Category Title *
                </label>
                <input
                  id="create-cat-title"
                  name="title"
                  type="text"
                  required
                  placeholder="e.g. Backend & Systems"
                  className="w-full text-xs p-2.5 border border-[var(--border-subtle)] focus:border-[var(--accent-cobalt)] outline-none"
                />
                {formErrors.title && (
                  <p className="text-[11px] text-[#B71C1C] mt-1">{formErrors.title}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setIsCreateCategoryOpen(false)}
                  className="px-4 py-2 text-xs font-mono uppercase border border-[var(--border-subtle)] hover:bg-[var(--bg-surface)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 text-xs font-mono uppercase bg-[var(--text-primary)] text-white hover:bg-black disabled:opacity-50"
                >
                  {isPending ? 'Saving...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[var(--border-subtle)] w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h2 className="text-base font-bold text-[var(--text-primary)]">Edit Skill Category</h2>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
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

            <form onSubmit={handleEditCategorySubmit} className="space-y-4">
              <div>
                <label htmlFor="edit-cat-title" className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">
                  Category Title *
                </label>
                <input
                  id="edit-cat-title"
                  name="title"
                  type="text"
                  required
                  defaultValue={editingCategory.title}
                  className="w-full text-xs p-2.5 border border-[var(--border-subtle)] focus:border-[var(--accent-cobalt)] outline-none"
                />
                {formErrors.title && (
                  <p className="text-[11px] text-[#B71C1C] mt-1">{formErrors.title}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
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

      {/* Delete Category Modal (CASCADE PROTECTION) */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[var(--border-subtle)] w-full max-w-md p-6 space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-[#B71C1C]">Confirm Delete Skill Category</h2>
            <div className="space-y-2 text-xs text-[var(--text-secondary)] leading-relaxed">
              <p>
                Are you sure you want to delete category <strong className="text-[var(--text-primary)]">&quot;{categoryToDelete.title}&quot;</strong> (ID: {categoryToDelete.id})?
              </p>
              {categoryToDelete.requiresConfirmation ? (
                <div className="p-3 bg-[#FDEDEC] border border-[#F5C6CB] text-[#B71C1C] font-semibold space-y-1">
                  <p>WARNING: CASCADE DELETION RISK</p>
                  <p className="font-normal">
                    This category contains <strong>{categoryToDelete.skillCount} child skill(s)</strong>.
                    Deleting this category will permanently cascade and delete all associated child skills.
                  </p>
                </div>
              ) : (
                <p>This category contains no child skills.</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                disabled={isPending}
                className="px-4 py-2 text-xs font-mono uppercase border border-[var(--border-subtle)] hover:bg-[var(--bg-surface)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCategory}
                disabled={isPending}
                className="px-4 py-2 text-xs font-mono uppercase bg-[#B71C1C] text-white hover:bg-red-800 disabled:opacity-50"
              >
                {isPending ? 'Deleting...' : 'Delete Category & Skills'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Skill Modal */}
      {createSkillTargetCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[var(--border-subtle)] w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h2 className="text-base font-bold text-[var(--text-primary)]">Add Skill</h2>
              <button
                type="button"
                onClick={() => setCreateSkillTargetCategory(null)}
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

            <form onSubmit={handleCreateSkillSubmit} className="space-y-4">
              <div>
                <label htmlFor="create-skill-name" className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">
                  Skill Name *
                </label>
                <input
                  id="create-skill-name"
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Go, PostgreSQL, Docker"
                  className="w-full text-xs p-2.5 border border-[var(--border-subtle)] focus:border-[var(--accent-cobalt)] outline-none"
                />
                {formErrors.name && (
                  <p className="text-[11px] text-[#B71C1C] mt-1">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="create-skill-cat" className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">
                  Category *
                </label>
                <select
                  id="create-skill-cat"
                  name="categoryId"
                  defaultValue={createSkillTargetCategory}
                  className="w-full text-xs p-2.5 border border-[var(--border-subtle)] focus:border-[var(--accent-cobalt)] outline-none bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
                {formErrors.categoryId && (
                  <p className="text-[11px] text-[#B71C1C] mt-1">{formErrors.categoryId}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setCreateSkillTargetCategory(null)}
                  className="px-4 py-2 text-xs font-mono uppercase border border-[var(--border-subtle)] hover:bg-[var(--bg-surface)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 text-xs font-mono uppercase bg-[var(--text-primary)] text-white hover:bg-black disabled:opacity-50"
                >
                  {isPending ? 'Saving...' : 'Create Skill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Skill Modal (Allows moving to another category) */}
      {editingSkill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[var(--border-subtle)] w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h2 className="text-base font-bold text-[var(--text-primary)]">Edit Skill</h2>
              <button
                type="button"
                onClick={() => setEditingSkill(null)}
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

            <form onSubmit={handleEditSkillSubmit} className="space-y-4">
              <div>
                <label htmlFor="edit-skill-name" className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">
                  Skill Name *
                </label>
                <input
                  id="edit-skill-name"
                  name="name"
                  type="text"
                  required
                  defaultValue={editingSkill.name}
                  className="w-full text-xs p-2.5 border border-[var(--border-subtle)] focus:border-[var(--accent-cobalt)] outline-none"
                />
                {formErrors.name && (
                  <p className="text-[11px] text-[#B71C1C] mt-1">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="edit-skill-cat" className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1">
                  Category * (Move skill across categories)
                </label>
                <select
                  id="edit-skill-cat"
                  name="categoryId"
                  defaultValue={editingSkill.categoryId}
                  className="w-full text-xs p-2.5 border border-[var(--border-subtle)] focus:border-[var(--accent-cobalt)] outline-none bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
                {formErrors.categoryId && (
                  <p className="text-[11px] text-[#B71C1C] mt-1">{formErrors.categoryId}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setEditingSkill(null)}
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

      {/* Delete Skill Modal */}
      {skillToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[var(--border-subtle)] w-full max-w-md p-6 space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-[#B71C1C]">Confirm Delete Skill</h2>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Are you sure you want to permanently delete skill <strong className="text-[var(--text-primary)]">&quot;{skillToDelete.name}&quot;</strong> (ID: {skillToDelete.id})?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setSkillToDelete(null)}
                disabled={isPending}
                className="px-4 py-2 text-xs font-mono uppercase border border-[var(--border-subtle)] hover:bg-[var(--bg-surface)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteSkill}
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
