// src/application/use-cases/engineering-nodes/get-engineering-nodes.use-case.ts
// Use Case: Retrieve all engineering nodes ordered by ascending display order.

import type { IEngineeringNodeRepository } from '../../../domain/repositories/engineering-node.repository';
import type { EngineeringNodeRecord } from '../../../domain/entities/engineering-node-record';

export class GetEngineeringNodesUseCase {
  constructor(private readonly engineeringNodeRepository: IEngineeringNodeRepository) {}

  async execute(): Promise<EngineeringNodeRecord[]> {
    return this.engineeringNodeRepository.getAll();
  }
}
