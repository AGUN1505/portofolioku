// src/application/use-cases/domains/get-domain-by-id.use-case.ts
// Use Case: Retrieve a single domain by primary key ID.

import type { IDomainRepository } from '../../../domain/repositories/domain.repository';
import type { DomainRecord } from '../../../domain/entities/domain-record';

export class GetDomainByIdUseCase {
  constructor(private readonly domainRepository: IDomainRepository) {}

  async execute(id: string): Promise<DomainRecord | null> {
    if (!id || typeof id !== 'string') {
      return null;
    }
    return this.domainRepository.getById(id);
  }
}
