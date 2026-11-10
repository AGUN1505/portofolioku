// src/application/use-cases/domains/create-domain.use-case.ts
// Use Case: Validate input DTO, compute next order if omitted, and persist new Domain.

import type { IDomainRepository } from '../../../domain/repositories/domain.repository';
import type { DomainRecord } from '../../../domain/entities/domain-record';
import { validateCreateDomainInput } from '../../dtos/domain.dto';

export interface CreateDomainResult {
  readonly success: boolean;
  readonly data?: DomainRecord;
  readonly errors?: Record<string, string>;
  readonly error?: string;
}

export class CreateDomainUseCase {
  constructor(private readonly domainRepository: IDomainRepository) {}

  async execute(rawInput: Record<string, unknown>): Promise<CreateDomainResult> {
    const validation = validateCreateDomainInput(rawInput);
    if (validation.success === false) {
      return { success: false, errors: validation.errors };
    }

    const { data } = validation;

    try {
      const created = await this.domainRepository.create({
        index: data.index,
        title: data.title,
        order: data.order,
      });

      return { success: true, data: created };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create domain',
      };
    }
  }
}
