// src/domain/repositories/skill.repository.ts
// Domain contract for Skill persistence operations.
// STRICT: Must not import Application DTOs or external infrastructure libraries.

import type { SkillRecord } from '../entities/skill-record';

export interface CreateSkillData {
  readonly name: string;
  readonly categoryId: string;
  readonly order?: number;
}

export interface UpdateSkillData {
  readonly name?: string;
  readonly categoryId?: string;
  readonly order?: number;
}

export interface ISkillRepository {
  /**
   * Retrieves all skills across all categories.
   */
  getAll(): Promise<SkillRecord[]>;

  /**
   * Retrieves skills scoped to a specific category ordered by ascending order.
   */
  getByCategoryId(categoryId: string): Promise<SkillRecord[]>;

  /**
   * Counts the number of skills belonging to a specific category.
   * Useful for impact analysis prior to category deletion.
   */
  countByCategoryId(categoryId: string): Promise<number>;

  /**
   * Retrieves a single skill by primary key ID.
   */
  getById(id: string): Promise<SkillRecord | null>;

  /**
   * Persists a new skill.
   */
  create(data: CreateSkillData): Promise<SkillRecord>;

  /**
   * Updates an existing skill by ID.
   */
  update(id: string, data: UpdateSkillData): Promise<SkillRecord>;

  /**
   * Deletes a skill by ID.
   */
  delete(id: string): Promise<void>;

  /**
   * Atomically reorders skills within a category to 1..N sequence.
   */
  reorder(categoryId: string, orderedIds: string[]): Promise<void>;
}
