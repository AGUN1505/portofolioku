// src/application/use-cases/skills/reorder-skill-categories.use-case.ts
// Use Case: Validate collection completeness and atomically reorder skill categories.

import type { ISkillCategoryRepository } from '../../../domain/repositories/skill-category.repository';

export interface ReorderSkillCategoriesResult {
  readonly success: boolean;
  readonly error?: string;
}

export class ReorderSkillCategoriesUseCase {
  constructor(private readonly skillCategoryRepository: ISkillCategoryRepository) {}

  async execute(orderedIds: string[]): Promise<ReorderSkillCategoriesResult> {
    if (!Array.isArray(orderedIds)) {
      return { success: false, error: 'orderedIds must be an array of skill category IDs' };
    }

    const existing = await this.skillCategoryRepository.getAll();

    // If repository has no categories and orderedIds is empty -> valid no-op
    if (existing.length === 0 && orderedIds.length === 0) {
      return { success: true };
    }

    // Reject empty list if records exist
    if (orderedIds.length === 0 && existing.length > 0) {
      return { success: false, error: 'orderedIds cannot be empty when skill categories exist' };
    }

    // Check for duplicate IDs
    const uniqueIds = new Set(orderedIds);
    if (uniqueIds.size !== orderedIds.length) {
      return { success: false, error: 'orderedIds contains duplicate skill category IDs' };
    }

    // Verify count matches
    if (orderedIds.length !== existing.length) {
      return {
        success: false,
        error: `orderedIds count (${orderedIds.length}) does not match existing skill categories count (${existing.length})`,
      };
    }

    // Verify that every ID exists in the collection
    const existingIdSet = new Set(existing.map((c) => c.id));
    for (const id of orderedIds) {
      if (!existingIdSet.has(id)) {
        return { success: false, error: `Skill category ID '${id}' does not exist in the collection` };
      }
    }

    try {
      await this.skillCategoryRepository.reorder(orderedIds);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to reorder skill categories',
      };
    }
  }
}
