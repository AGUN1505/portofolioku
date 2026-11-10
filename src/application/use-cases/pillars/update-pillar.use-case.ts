// src/application/use-cases/pillars/update-pillar.use-case.ts
// Use Case: Validate update DTO, verify pillar existence, and update Pillar.

import type { IPillarRepository } from '../../../domain/repositories/pillar.repository';
import type { PillarRecord } from '../../../domain/entities/pillar-record';
import { validateUpdatePillarInput } from '../../dtos/pillar.dto';

export interface UpdatePillarResult {
  readonly success: boolean;
  readonly data?: PillarRecord;
  readonly errors?: Record<string, string>;
  readonly error?: string;
}

export class UpdatePillarUseCase {
  constructor(private readonly pillarRepository: IPillarRepository) {}

  async execute(id: string, rawInput: Record<string, unknown>): Promise<UpdatePillarResult> {
    if (!id || typeof id !== 'string') {
      return { success: false, error: 'Pillar ID is required' };
    }

    const existing = await this.pillarRepository.getById(id);
    if (!existing) {
      return { success: false, error: 'Pillar not found' };
    }

    const validation = validateUpdatePillarInput(rawInput);
    if (validation.success === false) {
      return { success: false, errors: validation.errors };
    }

    try {
      const updated = await this.pillarRepository.update(id, validation.data);
      return { success: true, data: updated };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update pillar',
      };
    }
  }
}
