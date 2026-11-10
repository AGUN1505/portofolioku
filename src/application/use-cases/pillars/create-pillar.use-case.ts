// src/application/use-cases/pillars/create-pillar.use-case.ts
// Use Case: Validate input DTO, compute next order if omitted, and persist new Pillar.

import type { IPillarRepository } from '../../../domain/repositories/pillar.repository';
import type { PillarRecord } from '../../../domain/entities/pillar-record';
import { validateCreatePillarInput } from '../../dtos/pillar.dto';

export interface CreatePillarResult {
  readonly success: boolean;
  readonly data?: PillarRecord;
  readonly errors?: Record<string, string>;
  readonly error?: string;
}

export class CreatePillarUseCase {
  constructor(private readonly pillarRepository: IPillarRepository) {}

  async execute(rawInput: Record<string, unknown>): Promise<CreatePillarResult> {
    const validation = validateCreatePillarInput(rawInput);
    if (validation.success === false) {
      return { success: false, errors: validation.errors };
    }

    const { data } = validation;

    try {
      const created = await this.pillarRepository.create({
        index: data.index,
        title: data.title,
        description: data.description,
        order: data.order,
      });

      return { success: true, data: created };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create pillar',
      };
    }
  }
}
