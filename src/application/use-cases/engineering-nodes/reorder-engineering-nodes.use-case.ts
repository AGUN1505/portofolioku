// src/application/use-cases/engineering-nodes/reorder-engineering-nodes.use-case.ts
// Use Case: Validate collection completeness and atomically reorder engineering nodes.

import type { IEngineeringNodeRepository } from '../../../domain/repositories/engineering-node.repository';

export interface ReorderEngineeringNodesResult {
  readonly success: boolean;
  readonly error?: string;
}

export class ReorderEngineeringNodesUseCase {
  constructor(private readonly engineeringNodeRepository: IEngineeringNodeRepository) {}

  async execute(orderedIds: string[]): Promise<ReorderEngineeringNodesResult> {
    if (!Array.isArray(orderedIds)) {
      return { success: false, error: 'orderedIds must be an array of engineering node IDs' };
    }

    const existing = await this.engineeringNodeRepository.getAll();

    // If repository has no nodes and orderedIds is empty -> valid no-op
    if (existing.length === 0 && orderedIds.length === 0) {
      return { success: true };
    }

    // Reject empty list if records exist
    if (orderedIds.length === 0 && existing.length > 0) {
      return { success: false, error: 'orderedIds cannot be empty when engineering nodes exist' };
    }

    // Check for duplicate IDs
    const uniqueIds = new Set(orderedIds);
    if (uniqueIds.size !== orderedIds.length) {
      return { success: false, error: 'orderedIds contains duplicate engineering node IDs' };
    }

    // Verify count matches
    if (orderedIds.length !== existing.length) {
      return {
        success: false,
        error: `orderedIds count (${orderedIds.length}) does not match existing engineering nodes count (${existing.length})`,
      };
    }

    // Verify that every ID exists in the collection
    const existingIdSet = new Set(existing.map((n) => n.id));
    for (const id of orderedIds) {
      if (!existingIdSet.has(id)) {
        return { success: false, error: `Engineering node ID '${id}' does not exist in the collection` };
      }
    }

    try {
      await this.engineeringNodeRepository.reorder(orderedIds);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to reorder engineering nodes',
      };
    }
  }
}
