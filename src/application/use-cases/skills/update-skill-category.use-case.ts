// src/application/use-cases/skills/update-skill-category.use-case.ts
// Use Case: Validate update DTO, verify skill category existence, and update SkillCategory.

import type { ISkillCategoryRepository } from '../../../domain/repositories/skill-category.repository';
import type { SkillCategoryRecord } from '../../../domain/entities/skill-category-record';
import { validateUpdateSkillCategoryInput } from '../../dtos/skill-category.dto';

export interface UpdateSkillCategoryResult {
  readonly success: boolean;
  readonly data?: SkillCategoryRecord;
  readonly errors?: Record<string, string>;
  readonly error?: string;
}

export class UpdateSkillCategoryUseCase {
  constructor(private readonly skillCategoryRepository: ISkillCategoryRepository) {}

  async execute(id: string, rawInput: Record<string, unknown>): Promise<UpdateSkillCategoryResult> {
    if (!id || typeof id !== 'string') {
      return { success: false, error: 'Skill category ID is required' };
    }

    const existing = await this.skillCategoryRepository.getById(id);
    if (!existing) {
      return { success: false, error: 'Skill category not found' };
    }

    const validation = validateUpdateSkillCategoryInput(rawInput);
    if (validation.success === false) {
      return { success: false, errors: validation.errors };
    }

    try {
      const updated = await this.skillCategoryRepository.update(id, validation.data);
      return { success: true, data: updated };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update skill category',
      };
    }
  }
}
