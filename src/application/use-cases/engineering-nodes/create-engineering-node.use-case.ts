// src/application/use-cases/engineering-nodes/create-engineering-node.use-case.ts
// Use Case: Validate input DTO, compute next order if omitted, and persist new EngineeringNode.

import type { IEngineeringNodeRepository } from '../../../domain/repositories/engineering-node.repository';
import type { EngineeringNodeRecord } from '../../../domain/entities/engineering-node-record';
import { validateCreateEngineeringNodeInput } from '../../dtos/engineering-node.dto';

export interface CreateEngineeringNodeResult {
  readonly success: boolean;
  readonly data?: EngineeringNodeRecord;
  readonly errors?: Record<string, string>;
  readonly error?: string;
}

export class CreateEngineeringNodeUseCase {
  constructor(private readonly engineeringNodeRepository: IEngineeringNodeRepository) {}

  async execute(rawInput: Record<string, unknown>): Promise<CreateEngineeringNodeResult> {
    const validation = validateCreateEngineeringNodeInput(rawInput);
    if (validation.success === false) {
      return { success: false, errors: validation.errors };
    }

    const { data } = validation;

    try {
      const created = await this.engineeringNodeRepository.create({
        tag: data.tag,
        title: data.title,
        description: data.description,
        stack: data.stack,
        highlighted: data.highlighted,
        order: data.order,
      });

      return { success: true, data: created };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create engineering node',
      };
    }
  }
}
