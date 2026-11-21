// src/application/use-cases/sections/reorder-section-configs.use-case.ts
// Use Case: Validate collection completeness and atomically reorder section configs.

import type { ISectionConfigRepository } from '../../../domain/repositories/section-config.repository';
import { validateReorderSectionConfigsInput } from '../../dtos/section-config.dto';

export interface ReorderSectionConfigsResult {
  readonly success: boolean;
  readonly error?: string;
  readonly errors?: Record<string, string>;
}

export class ReorderSectionConfigsUseCase {
  constructor(private readonly repository: ISectionConfigRepository) {}

  async execute(input: unknown): Promise<ReorderSectionConfigsResult> {
    const validation = validateReorderSectionConfigsInput(input);
    if (!validation.success) {
      const errorMsg = Object.values(validation.errors)[0] || 'Invalid reorder input';
      return { success: false, error: errorMsg, errors: validation.errors };
    }

    const { orderedIds } = validation.data;
    const existing = await this.repository.getAll();

    if (existing.length === 0 && orderedIds.length === 0) {
      return { success: true };
    }

    if (orderedIds.length !== existing.length) {
      return {
        success: false,
        error: `orderedIds count (${orderedIds.length}) does not match existing sections count (${existing.length})`,
      };
    }

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
