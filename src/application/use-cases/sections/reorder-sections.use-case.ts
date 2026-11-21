// src/application/use-cases/sections/reorder-sections.use-case.ts
// Use Case: Validate collection completeness and atomically reorder section configs.

import type { ISectionConfigRepository } from '../../../domain/repositories/section-config.repository';
import type { SectionConfig } from '../../../domain/entities/section-config';

export interface ReorderSectionConfigsResult {
  readonly success: boolean;
  readonly error?: string;
}

export class ReorderSectionConfigsUseCase {
  constructor(private readonly repository: ISectionConfigRepository) {}

  async execute(orderedIds: string[]): Promise<ReorderSectionConfigsResult> {
    if (!Array.isArray(orderedIds)) {
      return { success: false, error: 'orderedIds must be an array of section IDs' };
    }

    let existing: SectionConfig[];
    if (typeof this.repository.getAll === 'function') {
      existing = await this.repository.getAll();
    } else if (typeof this.repository.findAll === 'function') {
      existing = await this.repository.findAll();
    } else {
      return { success: false, error: 'Section config repository does not support getAll or findAll' };
    }

    // If repository has no section configs and orderedIds is empty -> valid no-op
    if (existing.length === 0 && orderedIds.length === 0) {
      return { success: true };
    }

    // Reject empty list if records exist
    if (orderedIds.length === 0 && existing.length > 0) {
      return { success: false, error: 'orderedIds cannot be empty when section configs exist' };
    }

    // 1. Strict validation: duplicate check
    const uniqueIds = new Set(orderedIds);
    if (uniqueIds.size !== orderedIds.length) {
      return { success: false, error: 'orderedIds contains duplicate section IDs' };
    }

    // 2. Strict validation: length match
    if (orderedIds.length !== existing.length) {
      return {
        success: false,
        error: `orderedIds count (${orderedIds.length}) does not match existing sections count (${existing.length})`,
      };
    }

    // 3. Strict validation: ID existence check
    const existingIdSet = new Set(existing.map((s) => s.id));
    for (const id of orderedIds) {
      if (!existingIdSet.has(id)) {
        return { success: false, error: `Section ID '${id}' does not exist in the collection` };
      }
    }

    try {
      await this.repository.reorder(orderedIds);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to reorder section configs',
      };
    }
  }
}

// Semantic alias
export const ReorderSectionsUseCase = ReorderSectionConfigsUseCase;
