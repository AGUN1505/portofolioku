// src/application/use-cases/experiences/get-experiences.use-case.ts
// Use Case: Retrieve all experiences ordered by ascending display order.

import type { IExperienceRepository } from '../../../domain/repositories/experience.repository';
import type { ExperienceRecord } from '../../../domain/entities/experience-record';

export class GetExperiencesUseCase {
  constructor(private readonly experienceRepository: IExperienceRepository) {}

  async execute(): Promise<ExperienceRecord[]> {
    return this.experienceRepository.getAll();
  }
}
