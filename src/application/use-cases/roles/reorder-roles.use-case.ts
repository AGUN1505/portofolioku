// src/application/use-cases/roles/reorder-roles.use-case.ts
// Use Case: Validate collection completeness and atomically reorder roles.

import type { IRoleRepository } from '../../../domain/repositories/role.repository';

export interface ReorderRolesResult {
  readonly success: boolean;
  readonly error?: string;
}

export class ReorderRolesUseCase {
  constructor(private readonly roleRepository: IRoleRepository) {}

  async execute(orderedIds: string[]): Promise<ReorderRolesResult> {
    if (!Array.isArray(orderedIds)) {
      return { success: false, error: 'orderedIds must be an array of role IDs' };
    }

    const existing = await this.roleRepository.getAll();

    // If repository has no roles and orderedIds is empty -> valid no-op
    if (existing.length === 0 && orderedIds.length === 0) {
      return { success: true };
    }

    // Reject empty list if records exist
    if (orderedIds.length === 0 && existing.length > 0) {
      return { success: false, error: 'orderedIds cannot be empty when roles exist' };
    }

    // Check for duplicate IDs
    const uniqueIds = new Set(orderedIds);
    if (uniqueIds.size !== orderedIds.length) {
      return { success: false, error: 'orderedIds contains duplicate role IDs' };
    }

    // Verify count matches
    if (orderedIds.length !== existing.length) {
      return {
        success: false,
        error: `orderedIds count (${orderedIds.length}) does not match existing roles count (${existing.length})`,
      };
    }

    // Verify that every ID exists in the collection
    const existingIdSet = new Set(existing.map((r) => r.id));
    for (const id of orderedIds) {
      if (!existingIdSet.has(id)) {
        return { success: false, error: `Role ID '${id}' does not exist in the collection` };
      }
    }

    try {
      await this.roleRepository.reorder(orderedIds);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to reorder roles',
      };
    }
  }
}
