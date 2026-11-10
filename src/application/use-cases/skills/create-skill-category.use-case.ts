// src/application/use-cases/skills/create-skill-category.use-case.ts
// Use Case: Validate input DTO, compute next order if omitted, and persist new SkillCategory.

import type { ISkillCategoryRepository } from '../../../domain/repositories/skill-category.repository';
import type { SkillCategoryRecord } from '../../../domain/entities/skill-category-record';
import { validateCreateSkillCategoryInput } from '../../dtos/skill-category.dto';

export interface CreateSkillCategoryResult {
  readonly success: boolean;
  readonly data?: SkillCategoryRecord;
  readonly errors?: Record<string, string>;
  readonly error?: string;
}

export class CreateSkillCategoryUseCase {
  constructor(private readonly skillCategoryRepository: ISkillCategoryRepository) {}

  async execute(rawInput: Record<string, unknown>): Promise<CreateSkillCategoryResult> {
    const validation = validateCreateSkillCategoryInput(rawInput);
    if (validation.success === false) {
      return { success: false, errors: validation.errors };
    }

    const { data } = validation;

    try {
      const created = await this.skillCategoryRepository.create({
        title: data.title,
        order: data.order,
      });

      return { success: true, data: created };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create skill category',
      };
    }
  }
}
