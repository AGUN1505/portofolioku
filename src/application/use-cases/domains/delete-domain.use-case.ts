// src/application/use-cases/domains/delete-domain.use-case.ts
// Use Case: Verify domain existence and delete domain by ID.

import type { IDomainRepository } from '../../../domain/repositories/domain.repository';

export interface DeleteDomainResult {
  readonly success: boolean;
  readonly error?: string;
}

export class DeleteDomainUseCase {
  constructor(private readonly domainRepository: IDomainRepository) {}

  async execute(id: string): Promise<DeleteDomainResult> {
    if (!id || typeof id !== 'string') {
      return { success: false, error: 'Domain ID is required' };
    }

    const existing = await this.domainRepository.getById(id);
    if (!existing) {
      return { success: false, error: 'Domain not found' };
    }

    try {
      await this.domainRepository.delete(id);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete domain',
      };
    }
  }
}
