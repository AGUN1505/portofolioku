// src/application/use-cases/certificates/reorder-certificates.use-case.ts
// Use Case: Validate collection completeness and atomically reorder certificates.

import type { ICertificateRepository } from '../../../domain/repositories/certificate.repository';

export interface ReorderCertificatesResult {
  readonly success: boolean;
  readonly error?: string;
}

export class ReorderCertificatesUseCase {
  constructor(private readonly certificateRepository: ICertificateRepository) {}

  async execute(orderedIds: string[]): Promise<ReorderCertificatesResult> {
    if (!Array.isArray(orderedIds)) {
      return { success: false, error: 'orderedIds must be an array of certificate IDs' };
    }

    const getAllFn = typeof this.certificateRepository.findAll === 'function'
      ? this.certificateRepository.findAll.bind(this.certificateRepository)
      : this.certificateRepository.getAll?.bind(this.certificateRepository);

    if (!getAllFn) {
      return { success: false, error: 'Certificate repository does not support findAll or getAll' };
    }

    const existing = await getAllFn();

    // If repository has no certificates and orderedIds is empty -> valid no-op
    if (existing.length === 0 && orderedIds.length === 0) {
      return { success: true };
    }

    // Reject empty list if records exist
    if (orderedIds.length === 0 && existing.length > 0) {
      return { success: false, error: 'orderedIds cannot be empty when certificates exist' };
    }

    // Check for duplicate IDs
    const uniqueIds = new Set(orderedIds);
    if (uniqueIds.size !== orderedIds.length) {
      return { success: false, error: 'orderedIds contains duplicate certificate IDs' };
    }

    // Verify count matches
    if (orderedIds.length !== existing.length) {
      return {
        success: false,
        error: `orderedIds count (${orderedIds.length}) does not match existing certificates count (${existing.length})`,
      };
    }

    // Verify that every ID exists in the collection
    const existingIdSet = new Set(existing.map((c) => c.id));
    for (const id of orderedIds) {
      if (!existingIdSet.has(id)) {
        return { success: false, error: `Certificate ID '${id}' does not exist in the collection` };
      }
    }

    try {
      await this.certificateRepository.reorder(orderedIds);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to reorder certificates',
      };
    }
  }
}
