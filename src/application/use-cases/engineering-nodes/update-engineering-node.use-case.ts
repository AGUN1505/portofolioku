// src/application/use-cases/engineering-nodes/update-engineering-node.use-case.ts
// Use Case: Validate update DTO, verify engineering node existence, and update EngineeringNode.

import type { IEngineeringNodeRepository } from '../../../domain/repositories/engineering-node.repository';
import type { EngineeringNodeRecord } from '../../../domain/entities/engineering-node-record';
import { validateUpdateEngineeringNodeInput } from '../../dtos/engineering-node.dto';

export interface UpdateEngineeringNodeResult {
  readonly success: boolean;
  readonly data?: EngineeringNodeRecord;
  readonly errors?: Record<string, string>;
  readonly error?: string;
}

export class UpdateEngineeringNodeUseCase {
  constructor(private readonly engineeringNodeRepository: IEngineeringNodeRepository) {}

  async execute(id: string, rawInput: Record<string, unknown>): Promise<UpdateEngineeringNodeResult> {
    if (!id || typeof id !== 'string') {
      return { success: false, error: 'Engineering node ID is required' };
    }

    const existing = await this.engineeringNodeRepository.getById(id);
    if (!existing) {
      return { success: false, error: 'Engineering node not found' };
    }

    const validation = validateUpdateEngineeringNodeInput(rawInput);
    if (validation.success === false) {
      return { success: false, errors: validation.errors };
    }

    try {
      const updated = await this.engineeringNodeRepository.update(id, validation.data);
      return { success: true, data: updated };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update engineering node',
      };
    }
  }
}
