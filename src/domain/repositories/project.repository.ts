// src/domain/repositories/project.repository.ts
// Domain contract for Project persistence operations.
// STRICT: Must not import Application DTOs or external infrastructure libraries.

import type { ProjectRecord } from '../entities/project-record';

export interface CreateProjectData {
  readonly title: string;
  readonly category: string;
  readonly description: string;
  readonly technologies: readonly string[];
  readonly thumbnailUrl?: string | null;
  readonly projectUrl?: string | null;
  readonly githubUrl?: string | null;
  readonly published: boolean;
  readonly publishedAt?: Date | null;
  readonly order?: number;
}

export interface UpdateProjectData {
  readonly title?: string;
  readonly category?: string;
  readonly description?: string;
  readonly technologies?: readonly string[];
  readonly thumbnailUrl?: string | null;
  readonly projectUrl?: string | null;
  readonly githubUrl?: string | null;
  readonly published?: boolean;
  readonly publishedAt?: Date | null;
  readonly order?: number;
}

export interface IProjectRepository {
  /**
   * Retrieves all projects ordered by ascending display order.
   */
  getAll(): Promise<ProjectRecord[]>;

  /**
   * Retrieves a single project by primary key ID.
   * Returns null if no record exists with the specified ID.
   */
  getById(id: string): Promise<ProjectRecord | null>;

  /**
   * Persists a new project record.
   */
  create(data: CreateProjectData): Promise<ProjectRecord>;

  /**
   * Updates an existing project record by ID.
   * Throws an Error if the record does not exist.
   */
  update(id: string, data: UpdateProjectData): Promise<ProjectRecord>;

  /**
   * Deletes an existing project record by ID.
   * Throws an Error if the record does not exist.
   */
  delete(id: string): Promise<void>;

  /**
   * Atomically reorders projects by setting sequential order (1, 2, 3...)
   * matching the sequence in orderedIds.
   */
  reorder(orderedIds: string[]): Promise<void>;
}
