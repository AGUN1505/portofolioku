// src/domain/entities/skill-record.ts
// Domain entity representing a strictly typed persisted Skill in the CMS.

export interface SkillRecord {
  readonly id: string;
  readonly name: string;
  readonly categoryId: string;
  readonly order: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
