// src/domain/repositories/skill-category.repository.ts
// Domain contract for SkillCategory persistence operations.
// STRICT: Must not import Application DTOs or external infrastructure libraries.

import type { SkillCategoryRecord } from '../entities/skill-category-record';

export interface CreateSkillCategoryData {
  readonly title: string;
  readonly order?: number;
}

export interface UpdateSkillCategoryData {
  readonly title?: string;
  readonly order?: number;
}

export interface ISkillCategoryRepository {
  getAll(): Promise<SkillCategoryRecord[]>;
  getById(id: string): Promise<SkillCategoryRecord | null>;
  create(data: CreateSkillCategoryData): Promise<SkillCategoryRecord>;
  update(id: string, data: UpdateSkillCategoryData): Promise<SkillCategoryRecord>;
  delete(id: string, expectedChildCount?: number): Promise<void>;
  reorder(orderedIds: string[]): Promise<void>;
}
