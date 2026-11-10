// src/application/use-cases/domains/update-domain.use-case.ts
// Use Case: Validate update DTO, verify domain existence, and update Domain.

import type { IDomainRepository } from '../../../domain/repositories/domain.repository';
import type { DomainRecord } from '../../../domain/entities/domain-record';
import { validateUpdateDomainInput } from '../../dtos/domain.dto';

export interface UpdateDomainResult {
  readonly success: boolean;
  readonly data?: DomainRecord;
  readonly errors?: Record<string, string>;
  readonly error?: string;
}

export class UpdateDomainUseCase {
  constructor(private readonly domainRepository: IDomainRepository) {}

  async execute(id: string, rawInput: Record<string, unknown>): Promise<UpdateDomainResult> {
    if (!id || typeof id !== 'string') {
      return { success: false, error: 'Domain ID is required' };
    }

    const existing = await this.domainRepository.getById(id);
    if (!existing) {
      return { success: false, error: 'Domain not found' };
    }

    const validation = validateUpdateDomainInput(rawInput);
    if (validation.success === false) {
      return { success: false, errors: validation.errors };
    }

    try {
      const updated = await this.domainRepository.update(id, validation.data);
      return { success: true, data: updated };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update domain',
      };
    }
  }
}
