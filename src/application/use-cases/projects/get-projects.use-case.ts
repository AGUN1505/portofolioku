// src/application/use-cases/projects/get-projects.use-case.ts
// Use Case: Retrieve all projects ordered by ascending display order.

import type { IProjectRepository } from '../../../domain/repositories/project.repository';
import type { ProjectRecord } from '../../../domain/entities/project-record';

export class GetProjectsUseCase {
  constructor(private readonly projectRepository: IProjectRepository) {}

  async execute(): Promise<ProjectRecord[]> {
    return this.projectRepository.getAll();
  }
}
