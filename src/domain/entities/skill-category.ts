// src/domain/entities/skill-category.ts
export interface SkillCategory {
  readonly id: string;
  readonly title: string;
  readonly order: number;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}
