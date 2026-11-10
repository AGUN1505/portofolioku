// src/application/use-cases/projects/get-project-by-id.use-case.ts
// Use Case: Retrieve a single project by primary key ID.

import type { IProjectRepository } from '../../../domain/repositories/project.repository';
import type { ProjectRecord } from '../../../domain/entities/project-record';

export class GetProjectByIdUseCase {
  constructor(private readonly projectRepository: IProjectRepository) {}

  async execute(id: string): Promise<ProjectRecord | null> {
    if (!id || typeof id !== 'string') {
      return null;
    }
    return this.projectRepository.getById(id);
  }
}
