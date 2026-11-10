// src/application/use-cases/projects/delete-project.use-case.ts
// Use Case: Verify project existence and delete project by ID.

import type { IProjectRepository } from '../../../domain/repositories/project.repository';

export interface DeleteProjectResult {
  readonly success: boolean;
  readonly error?: string;
}

export class DeleteProjectUseCase {
  constructor(private readonly projectRepository: IProjectRepository) {}

  async execute(id: string): Promise<DeleteProjectResult> {
    if (!id || typeof id !== 'string') {
      return { success: false, error: 'Project ID is required' };
    }

    const existing = await this.projectRepository.getById(id);
    if (!existing) {
      return { success: false, error: 'Project not found' };
    }

    try {
      await this.projectRepository.delete(id);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete project',
      };
    }
  }
}
