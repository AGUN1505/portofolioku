// src/domain/entities/skill.ts
export interface Skill {
  readonly id: string;
  readonly name: string;
  readonly categoryId: string;
  readonly order: number;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}
