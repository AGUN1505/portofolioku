// src/application/use-cases/engineering-nodes/get-engineering-node-by-id.use-case.ts
// Use Case: Retrieve a single engineering node by primary key ID.

import type { IEngineeringNodeRepository } from '../../../domain/repositories/engineering-node.repository';
import type { EngineeringNodeRecord } from '../../../domain/entities/engineering-node-record';

export class GetEngineeringNodeByIdUseCase {
  constructor(private readonly engineeringNodeRepository: IEngineeringNodeRepository) {}

  async execute(id: string): Promise<EngineeringNodeRecord | null> {
    if (!id || typeof id !== 'string') {
      return null;
    }
    return this.engineeringNodeRepository.getById(id);
  }
}
