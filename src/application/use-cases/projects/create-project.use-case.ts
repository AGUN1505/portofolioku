// src/application/use-cases/projects/create-project.use-case.ts
// Use Case: Validate input DTO, compute next order if omitted, manage publishedAt, and persist new Project.

import type { IProjectRepository } from '../../../domain/repositories/project.repository';
import type { ProjectRecord } from '../../../domain/entities/project-record';
import { validateCreateProjectInput } from '../../dtos/project.dto';

export interface CreateProjectResult {
  readonly success: boolean;
  readonly data?: ProjectRecord;
  readonly errors?: Record<string, string>;
  readonly error?: string;
}

export class CreateProjectUseCase {
  constructor(
    private readonly projectRepository: IProjectRepository,
    private readonly nowProvider: () => Date = () => new Date()
  ) {}

  async execute(rawInput: Record<string, unknown>): Promise<CreateProjectResult> {
    const validation = validateCreateProjectInput(rawInput);
    if (validation.success === false) {
      return { success: false, errors: validation.errors };
    }

    const { data } = validation;

    // Determine initial publishedAt: set to current time if published is true
    const publishedAt = data.published ? this.nowProvider() : null;

    try {
      const created = await this.projectRepository.create({
        title: data.title,
        category: data.category,
        description: data.description,
        technologies: data.technologies,
        thumbnailUrl: data.thumbnailUrl,
        projectUrl: data.projectUrl,
        githubUrl: data.githubUrl,
        published: data.published,
        publishedAt,
        order: data.order,
      });

      return { success: true, data: created };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create project',
      };
    }
  }
}
