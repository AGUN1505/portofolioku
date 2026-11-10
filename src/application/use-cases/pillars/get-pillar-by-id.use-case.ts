// src/application/use-cases/pillars/get-pillar-by-id.use-case.ts
// Use Case: Retrieve a single pillar by primary key ID.

import type { IPillarRepository } from '../../../domain/repositories/pillar.repository';
import type { PillarRecord } from '../../../domain/entities/pillar-record';

export class GetPillarByIdUseCase {
  constructor(private readonly pillarRepository: IPillarRepository) {}

  async execute(id: string): Promise<PillarRecord | null> {
    if (!id || typeof id !== 'string') {
      return null;
    }
    return this.pillarRepository.getById(id);
  }
}
