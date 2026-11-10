// src/application/use-cases/experiences/reorder-experiences.use-case.ts
// Use Case: Validate collection completeness and atomically reorder experiences.

import type { IExperienceRepository } from '../../../domain/repositories/experience.repository';

export interface ReorderExperiencesResult {
  readonly success: boolean;
  readonly error?: string;
}

export class ReorderExperiencesUseCase {
  constructor(private readonly experienceRepository: IExperienceRepository) {}

  async execute(orderedIds: string[]): Promise<ReorderExperiencesResult> {
    if (!Array.isArray(orderedIds)) {
      return { success: false, error: 'orderedIds must be an array of experience IDs' };
    }

    const existing = await this.experienceRepository.getAll();

    // If repository has no experiences and orderedIds is empty -> valid no-op
    if (existing.length === 0 && orderedIds.length === 0) {
      return { success: true };
    }

    // Reject empty list if records exist
    if (orderedIds.length === 0 && existing.length > 0) {
      return { success: false, error: 'orderedIds cannot be empty when experiences exist' };
    }

    // Check for duplicate IDs
    const uniqueIds = new Set(orderedIds);
    if (uniqueIds.size !== orderedIds.length) {
      return { success: false, error: 'orderedIds contains duplicate experience IDs' };
    }

    // Verify count matches
    if (orderedIds.length !== existing.length) {
      return {
        success: false,
        error: `orderedIds count (${orderedIds.length}) does not match existing experiences count (${existing.length})`,
      };
    }

    // Verify that every ID exists in the collection
    const existingIdSet = new Set(existing.map((e) => e.id));
    for (const id of orderedIds) {
      if (!existingIdSet.has(id)) {
        return { success: false, error: `Experience ID '${id}' does not exist in the collection` };
      }
    }

    try {
      await this.experienceRepository.reorder(orderedIds);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to reorder experiences',
      };
    }
  }
}
