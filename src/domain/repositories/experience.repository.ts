// src/domain/repositories/experience.repository.ts
// Domain contract for Experience persistence operations.
// STRICT: Must not import Application DTOs or external infrastructure libraries.

import type { ExperienceRecord } from '../entities/experience-record';

export interface CreateExperienceData {
  readonly role: string;
  readonly institution: string;
  readonly track: string;
  readonly description?: string | null;
  readonly startDate?: Date | null;
  readonly endDate?: Date | null;
  readonly order?: number;
}

export interface UpdateExperienceData {
  readonly role?: string;
  readonly institution?: string;
  readonly track?: string;
  readonly description?: string | null;
  readonly startDate?: Date | null;
  readonly endDate?: Date | null;
  readonly order?: number;
}

export interface IExperienceRepository {
  /**
   * Retrieves all experiences ordered by ascending display order.
   */
  getAll(): Promise<ExperienceRecord[]>;

  /**
   * Retrieves a single experience by primary key ID.
   * Returns null if no record exists with the specified ID.
   */
  getById(id: string): Promise<ExperienceRecord | null>;

  /**
   * Persists a new experience record.
   */
  create(data: CreateExperienceData): Promise<ExperienceRecord>;

  /**
   * Updates an existing experience record by ID.
   * Throws an Error if the record does not exist.
   */
  update(id: string, data: UpdateExperienceData): Promise<ExperienceRecord>;

  /**
   * Deletes an existing experience record by ID.
   * Throws an Error if the record does not exist.
   */
  delete(id: string): Promise<void>;

  /**
   * Atomically reorders experiences by setting sequential order (1, 2, 3...)
   * matching the sequence in orderedIds.
   */
  reorder(orderedIds: string[]): Promise<void>;
}
