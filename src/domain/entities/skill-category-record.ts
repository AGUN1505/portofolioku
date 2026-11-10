// src/domain/entities/skill-category-record.ts
// Domain entity representing a strictly typed persisted SkillCategory in the CMS.

export interface SkillCategoryRecord {
  readonly id: string;
  readonly title: string;
  readonly order: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
