// src/application/use-cases/experiences/update-experience.use-case.ts
// Use Case: Validate update DTO, verify experience existence, and update Experience.

import type { IExperienceRepository } from '../../../domain/repositories/experience.repository';
import type { ExperienceRecord } from '../../../domain/entities/experience-record';
import { validateUpdateExperienceInput } from '../../dtos/experience.dto';

export interface UpdateExperienceResult {
  readonly success: boolean;
  readonly data?: ExperienceRecord;
  readonly errors?: Record<string, string>;
  readonly error?: string;
}

export class UpdateExperienceUseCase {
  constructor(private readonly experienceRepository: IExperienceRepository) {}

  async execute(id: string, rawInput: Record<string, unknown>): Promise<UpdateExperienceResult> {
    if (!id || typeof id !== 'string') {
      return { success: false, error: 'Experience ID is required' };
    }

    const existing = await this.experienceRepository.getById(id);
    if (!existing) {
      return { success: false, error: 'Experience not found' };
    }

    const validation = validateUpdateExperienceInput(rawInput, {
      startDate: existing.startDate,
      endDate: existing.endDate,
    });

    if (validation.success === false) {
      return { success: false, errors: validation.errors };
    }

    try {
      const updated = await this.experienceRepository.update(id, validation.data);
      return { success: true, data: updated };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update experience',
      };
    }
  }
}
