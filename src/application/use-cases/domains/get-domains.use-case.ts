// src/application/use-cases/domains/get-domains.use-case.ts
// Use Case: Retrieve all domains ordered by ascending display order.

import type { IDomainRepository } from '../../../domain/repositories/domain.repository';
import type { DomainRecord } from '../../../domain/entities/domain-record';

export class GetDomainsUseCase {
  constructor(private readonly domainRepository: IDomainRepository) {}

  async execute(): Promise<DomainRecord[]> {
    return this.domainRepository.getAll();
  }
}
