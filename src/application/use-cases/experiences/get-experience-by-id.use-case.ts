// src/application/use-cases/experiences/get-experience-by-id.use-case.ts
// Use Case: Retrieve a single experience by primary key ID.

import type { IExperienceRepository } from '../../../domain/repositories/experience.repository';
import type { ExperienceRecord } from '../../../domain/entities/experience-record';

export class GetExperienceByIdUseCase {
  constructor(private readonly experienceRepository: IExperienceRepository) {}

  async execute(id: string): Promise<ExperienceRecord | null> {
    if (!id || typeof id !== 'string') {
      return null;
    }
    return this.experienceRepository.getById(id);
  }
}
