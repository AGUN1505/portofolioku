// src/application/use-cases/skills/get-skill-categories.use-case.ts
// Use Case: Retrieve all skill categories ordered by ascending display order.

import type { ISkillCategoryRepository } from '../../../domain/repositories/skill-category.repository';
import type { SkillCategoryRecord } from '../../../domain/entities/skill-category-record';

export class GetSkillCategoriesUseCase {
  constructor(private readonly skillCategoryRepository: ISkillCategoryRepository) {}

  async execute(): Promise<SkillCategoryRecord[]> {
    return this.skillCategoryRepository.getAll();
  }
}
