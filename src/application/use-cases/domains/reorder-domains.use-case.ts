// src/application/use-cases/domains/reorder-domains.use-case.ts
// Use Case: Validate collection completeness and atomically reorder domains while preserving index.

import type { IDomainRepository } from '../../../domain/repositories/domain.repository';

export interface ReorderDomainsResult {
  readonly success: boolean;
  readonly error?: string;
}

export class ReorderDomainsUseCase {
  constructor(private readonly domainRepository: IDomainRepository) {}

  async execute(orderedIds: string[]): Promise<ReorderDomainsResult> {
    if (!Array.isArray(orderedIds)) {
      return { success: false, error: 'orderedIds must be an array of domain IDs' };
    }

    const existing = await this.domainRepository.getAll();

    // If repository has no domains and orderedIds is empty -> valid no-op
    if (existing.length === 0 && orderedIds.length === 0) {
      return { success: true };
    }

    // Reject empty list if records exist
    if (orderedIds.length === 0 && existing.length > 0) {
      return { success: false, error: 'orderedIds cannot be empty when domains exist' };
    }

    // Check for duplicate IDs
    const uniqueIds = new Set(orderedIds);
    if (uniqueIds.size !== orderedIds.length) {
      return { success: false, error: 'orderedIds contains duplicate domain IDs' };
    }

    // Verify count matches
    if (orderedIds.length !== existing.length) {
      return {
        success: false,
        error: `orderedIds count (${orderedIds.length}) does not match existing domains count (${existing.length})`,
      };
    }

    // Verify that every ID exists in the collection
    const existingIdSet = new Set(existing.map((d) => d.id));
    for (const id of orderedIds) {
      if (!existingIdSet.has(id)) {
        return { success: false, error: `Domain ID '${id}' does not exist in the collection` };
      }
    }

    try {
      await this.domainRepository.reorder(orderedIds);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to reorder domains',
      };
    }
  }
}
