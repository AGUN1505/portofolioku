// src/application/use-cases/projects/reorder-projects.use-case.ts
// Use Case: Validate collection completeness and atomically reorder projects.

import type { IProjectRepository } from '../../../domain/repositories/project.repository';

export interface ReorderProjectsResult {
  readonly success: boolean;
  readonly error?: string;
}

export class ReorderProjectsUseCase {
  constructor(private readonly projectRepository: IProjectRepository) {}

  async execute(orderedIds: string[]): Promise<ReorderProjectsResult> {
    if (!Array.isArray(orderedIds)) {
      return { success: false, error: 'orderedIds must be an array of project IDs' };
    }

    const existing = await this.projectRepository.getAll();

    // If repository has no projects and orderedIds is empty -> valid no-op
    if (existing.length === 0 && orderedIds.length === 0) {
      return { success: true };
    }

    // Reject empty list if records exist
    if (orderedIds.length === 0 && existing.length > 0) {
      return { success: false, error: 'orderedIds cannot be empty when projects exist' };
    }

    // Check for duplicate IDs
    const uniqueIds = new Set(orderedIds);
    if (uniqueIds.size !== orderedIds.length) {
      return { success: false, error: 'orderedIds contains duplicate project IDs' };
    }

    // Verify count matches
    if (orderedIds.length !== existing.length) {
      return {
        success: false,
        error: `orderedIds count (${orderedIds.length}) does not match existing projects count (${existing.length})`,
      };
    }

    // Verify that every ID exists in the collection
    const existingIdSet = new Set(existing.map((p) => p.id));
    for (const id of orderedIds) {
      if (!existingIdSet.has(id)) {
        return { success: false, error: `Project ID '${id}' does not exist in the collection` };
      }
    }

    try {
      await this.projectRepository.reorder(orderedIds);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to reorder projects',
      };
    }
  }
}
