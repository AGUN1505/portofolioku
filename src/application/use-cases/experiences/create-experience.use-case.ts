// src/application/use-cases/experiences/create-experience.use-case.ts
// Use Case: Validate input DTO, compute next order if omitted, and persist new Experience.

import type { IExperienceRepository } from '../../../domain/repositories/experience.repository';
import type { ExperienceRecord } from '../../../domain/entities/experience-record';
import { validateCreateExperienceInput } from '../../dtos/experience.dto';

export interface CreateExperienceResult {
  readonly success: boolean;
  readonly data?: ExperienceRecord;
  readonly errors?: Record<string, string>;
  readonly error?: string;
}

export class CreateExperienceUseCase {
  constructor(private readonly experienceRepository: IExperienceRepository) {}

  async execute(rawInput: Record<string, unknown>): Promise<CreateExperienceResult> {
    const validation = validateCreateExperienceInput(rawInput);
    if (validation.success === false) {
      return { success: false, errors: validation.errors };
    }

    const { data } = validation;

    try {
      const created = await this.experienceRepository.create({
        role: data.role,
        institution: data.institution,
        track: data.track,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        order: data.order,
      });

      return { success: true, data: created };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create experience',
      };
    }
  }
}
