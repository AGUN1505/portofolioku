// src/application/use-cases/pillars/get-pillars.use-case.ts
// Use Case: Retrieve all pillars ordered by ascending display order.

import type { IPillarRepository } from '../../../domain/repositories/pillar.repository';
import type { PillarRecord } from '../../../domain/entities/pillar-record';

export class GetPillarsUseCase {
  constructor(private readonly pillarRepository: IPillarRepository) {}

  async execute(): Promise<PillarRecord[]> {
    return this.pillarRepository.getAll();
  }
}
