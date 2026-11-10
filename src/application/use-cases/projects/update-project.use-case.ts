// src/application/use-cases/projects/update-project.use-case.ts
// Use Case: Validate update DTO, verify project existence, manage publishedAt transitions, and update Project.

import type { IProjectRepository } from '../../../domain/repositories/project.repository';
import type { ProjectRecord } from '../../../domain/entities/project-record';
import { validateUpdateProjectInput } from '../../dtos/project.dto';

export interface UpdateProjectResult {
  readonly success: boolean;
  readonly data?: ProjectRecord;
  readonly errors?: Record<string, string>;
  readonly error?: string;
}

export class UpdateProjectUseCase {
  constructor(
    private readonly projectRepository: IProjectRepository,
    private readonly nowProvider: () => Date = () => new Date()
  ) {}

  async execute(id: string, rawInput: Record<string, unknown>): Promise<UpdateProjectResult> {
    if (!id || typeof id !== 'string') {
      return { success: false, error: 'Project ID is required' };
    }

    const existing = await this.projectRepository.getById(id);
    if (!existing) {
      return { success: false, error: 'Project not found' };
    }

    const validation = validateUpdateProjectInput(rawInput);
    if (validation.success === false) {
      return { success: false, errors: validation.errors };
    }

    const { data } = validation;

    // Handle publishedAt transitions according to approved specification:
    // 1. When a project transitions from unpublished to published -> set publishedAt to current time.
    // 2. When a project transitions from published to unpublished -> preserve previous publishedAt as publication history.
    // 3. When a previously unpublished project is published again -> update publishedAt to new publication time.
    let publishedAt = existing.publishedAt;
    if (data.published !== undefined) {
      if (data.published && !existing.published) {
        // Transitioning from unpublished -> published: record current timestamp
        publishedAt = this.nowProvider();
      } else if (!data.published && existing.published) {
        // Transitioning from published -> unpublished: preserve history
        publishedAt = existing.publishedAt;
      } else if (data.published && existing.published) {
        // Stays published: keep existing publishedAt (or set if missing)
        publishedAt = existing.publishedAt ?? this.nowProvider();
      }
    }

    try {
      const updated = await this.projectRepository.update(id, {
        ...data,
        publishedAt,
      });

      return { success: true, data: updated };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update project',
      };
    }
  }
}
