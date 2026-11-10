// src/application/use-cases/pillars/reorder-pillars.use-case.ts
// Use Case: Validate collection completeness and atomically reorder pillars while preserving index.

import type { IPillarRepository } from '../../../domain/repositories/pillar.repository';

export interface ReorderPillarsResult {
  readonly success: boolean;
  readonly error?: string;
}

export class ReorderPillarsUseCase {
  constructor(private readonly pillarRepository: IPillarRepository) {}

  async execute(orderedIds: string[]): Promise<ReorderPillarsResult> {
    if (!Array.isArray(orderedIds)) {
      return { success: false, error: 'orderedIds must be an array of pillar IDs' };
    }

    const existing = await this.pillarRepository.getAll();

    // If repository has no pillars and orderedIds is empty -> valid no-op
    if (existing.length === 0 && orderedIds.length === 0) {
      return { success: true };
    }

    // Reject empty list if records exist
    if (orderedIds.length === 0 && existing.length > 0) {
      return { success: false, error: 'orderedIds cannot be empty when pillars exist' };
    }

    // Check for duplicate IDs
    const uniqueIds = new Set(orderedIds);
    if (uniqueIds.size !== orderedIds.length) {
      return { success: false, error: 'orderedIds contains duplicate pillar IDs' };
    }

    // Verify count matches
    if (orderedIds.length !== existing.length) {
      return {
        success: false,
        error: `orderedIds count (${orderedIds.length}) does not match existing pillars count (${existing.length})`,
      };
    }

    // Verify that every ID exists in the collection
    const existingIdSet = new Set(existing.map((p) => p.id));
    for (const id of orderedIds) {
      if (!existingIdSet.has(id)) {
        return { success: false, error: `Pillar ID '${id}' does not exist in the collection` };
      }
    }

    try {
      await this.pillarRepository.reorder(orderedIds);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to reorder pillars',
      };
    }
  }
}
