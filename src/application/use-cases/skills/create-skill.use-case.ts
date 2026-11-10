// src/application/use-cases/skills/create-skill.use-case.ts
// Use Case: Validate input DTO, verify target category existence, compute next order scoped to category, and persist Skill.

import type { ISkillRepository } from '../../../domain/repositories/skill.repository';
import type { ISkillCategoryRepository } from '../../../domain/repositories/skill-category.repository';
import type { SkillRecord } from '../../../domain/entities/skill-record';
import { validateCreateSkillInput } from '../../dtos/skill.dto';

export interface CreateSkillResult {
  readonly success: boolean;
  readonly data?: SkillRecord;
  readonly errors?: Record<string, string>;
  readonly error?: string;
}

export class CreateSkillUseCase {
  constructor(
    private readonly skillRepository: ISkillRepository,
    private readonly skillCategoryRepository: ISkillCategoryRepository
  ) {}

  async execute(rawInput: Record<string, unknown>): Promise<CreateSkillResult> {
    const validation = validateCreateSkillInput(rawInput);
    if (validation.success === false) {
      return { success: false, errors: validation.errors };
    }

    const { data } = validation;

    // Verify target category exists
    const category = await this.skillCategoryRepository.getById(data.categoryId);
    if (!category) {
      return {
        success: false,
        error: `Skill category with ID '${data.categoryId}' not found`,
      };
    }

    try {
      const created = await this.skillRepository.create({
        name: data.name,
        categoryId: data.categoryId,
        order: data.order,
      });

      return { success: true, data: created };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create skill',
      };
    }
  }
}
