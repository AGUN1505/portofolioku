// src/application/use-cases/skills/reorder-skills.use-case.ts
// Use Case: Scoped reordering of skills within a specific category.
// Validates complete category membership, rejects duplicate/foreign IDs, and persists 1..N sequence.

import type { ISkillRepository } from '../../../domain/repositories/skill.repository';
import type { ISkillCategoryRepository } from '../../../domain/repositories/skill-category.repository';

export interface ReorderSkillsResult {
  readonly success: boolean;
  readonly error?: string;
}

export class ReorderSkillsUseCase {
  constructor(
    private readonly skillRepository: ISkillRepository,
    private readonly skillCategoryRepository: ISkillCategoryRepository
  ) {}

  /**
   * Reorders skills strictly scoped within a specified category.
   *
   * @param categoryId ID of the parent category.
   * @param orderedIds Complete ordered list of skill IDs belonging to this category.
   */
  async execute(categoryId: string, orderedIds: string[]): Promise<ReorderSkillsResult> {
    if (!categoryId || typeof categoryId !== 'string') {
      return { success: false, error: 'Category ID is required' };
    }

    if (!Array.isArray(orderedIds)) {
      return { success: false, error: 'orderedIds must be an array of skill IDs' };
    }

    // Verify parent category exists
    const category = await this.skillCategoryRepository.getById(categoryId);
    if (!category) {
      return { success: false, error: `Skill category with ID '${categoryId}' not found` };
    }

    const existingCategorySkills = await this.skillRepository.getByCategoryId(categoryId);

    // If category has no skills and orderedIds is empty -> valid no-op
    if (existingCategorySkills.length === 0 && orderedIds.length === 0) {
      return { success: true };
    }

    // Reject empty list if records exist in this category
    if (orderedIds.length === 0 && existingCategorySkills.length > 0) {
      return {
        success: false,
        error: `orderedIds cannot be empty when category '${category.title}' has skills`,
      };
    }

    // Check for duplicate IDs
    const uniqueIds = new Set(orderedIds);
    if (uniqueIds.size !== orderedIds.length) {
      return { success: false, error: 'orderedIds contains duplicate skill IDs' };
    }

    // Verify count matches exactly the skills in this category
    if (orderedIds.length !== existingCategorySkills.length) {
      return {
        success: false,
        error: `orderedIds count (${orderedIds.length}) does not match existing skills count (${existingCategorySkills.length}) for category '${category.title}'`,
      };
    }

    // Verify that every ID exists and belongs strictly to this category
    const existingIdSet = new Set(existingCategorySkills.map((s) => s.id));
    for (const id of orderedIds) {
      if (!existingIdSet.has(id)) {
        return {
          success: false,
          error: `Skill ID '${id}' does not belong to category '${category.title}' or does not exist`,
        };
      }
    }

    try {
      await this.skillRepository.reorder(categoryId, orderedIds);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to reorder skills',
      };
    }
  }
}
