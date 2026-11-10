// src/application/use-cases/experiences/delete-experience.use-case.ts
// Use Case: Verify experience existence and delete experience by ID.

import type { IExperienceRepository } from '../../../domain/repositories/experience.repository';

export interface DeleteExperienceResult {
  readonly success: boolean;
  readonly error?: string;
}

export class DeleteExperienceUseCase {
  constructor(private readonly experienceRepository: IExperienceRepository) {}

  async execute(id: string): Promise<DeleteExperienceResult> {
    if (!id || typeof id !== 'string') {
      return { success: false, error: 'Experience ID is required' };
    }

    const existing = await this.experienceRepository.getById(id);
    if (!existing) {
      return { success: false, error: 'Experience not found' };
    }

    try {
      await this.experienceRepository.delete(id);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete experience',
      };
    }
  }
}
