// src/application/use-cases/skills/delete-skill-category.use-case.ts
// Use Case: HIGH-RISK cascade deletion protection for SkillCategory.
// Requires explicit confirmation and exposes child skill count impact before deletion.

import type { ISkillCategoryRepository } from '../../../domain/repositories/skill-category.repository';
import type { ISkillRepository } from '../../../domain/repositories/skill.repository';

export interface DeleteSkillCategoryResult {
  readonly success: boolean;
  readonly requiresConfirmation?: boolean;
  readonly categoryId?: string;
  readonly categoryTitle?: string;
  readonly affectedSkillCount?: number;
  readonly error?: string;
}

export class DeleteSkillCategoryUseCase {
  constructor(
    private readonly skillCategoryRepository: ISkillCategoryRepository,
    private readonly skillRepository: ISkillRepository
  ) {}

  /**
   * Evaluates cascade impact and deletes SkillCategory only upon explicit confirmation.
   *
   * @param id The ID of the SkillCategory to delete.
   * @param confirmed Explicit confirmation flag (must be true to execute deletion).
   * @param expectedChildCount The confirmed number of child skills expected to be affected.
   */
  async execute(
    id: string,
    confirmed?: boolean,
    expectedChildCount?: number
  ): Promise<DeleteSkillCategoryResult> {
    if (!id || typeof id !== 'string') {
      return { success: false, error: 'Skill category ID is required' };
    }

    const existing = await this.skillCategoryRepository.getById(id);
    if (!existing) {
      return { success: false, error: 'Skill category not found' };
    }

    const affectedSkillCount = await this.skillRepository.countByCategoryId(id);

    // If confirmation is absent or false, reject deletion and return impact metadata
    if (confirmed !== true) {
      return {
        success: false,
        requiresConfirmation: true,
        categoryId: existing.id,
        categoryTitle: existing.title,
        affectedSkillCount,
        error: `Deleting category '${existing.title}' will cascade delete ${affectedSkillCount} associated child skills. Explicit confirmation is required.`,
      };
    }

    // Fail closed: expected child count is mandatory when deletion is confirmed
    if (
      expectedChildCount === undefined ||
      expectedChildCount === null ||
      typeof expectedChildCount !== 'number' ||
      !Number.isInteger(expectedChildCount) ||
      expectedChildCount < 0
    ) {
      return {
        success: false,
        error: 'Expected child skill count is required for confirmed deletion.',
      };
    }

    // Confirmed deletion with atomic verification in repository
    try {
      await this.skillCategoryRepository.delete(id, expectedChildCount);
      return {
        success: true,
        categoryId: existing.id,
        categoryTitle: existing.title,
        affectedSkillCount,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete skill category',
      };
    }
  }
}
