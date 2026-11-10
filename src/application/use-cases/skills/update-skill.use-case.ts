// src/application/use-cases/skills/update-skill.use-case.ts
// Use Case: Validate update DTO, verify skill and target category existence, manage cross-category ordering, and update Skill.

import type { ISkillRepository } from '../../../domain/repositories/skill.repository';
import type { ISkillCategoryRepository } from '../../../domain/repositories/skill-category.repository';
import type { SkillRecord } from '../../../domain/entities/skill-record';
import { validateUpdateSkillInput } from '../../dtos/skill.dto';

export interface UpdateSkillResult {
  readonly success: boolean;
  readonly data?: SkillRecord;
  readonly errors?: Record<string, string>;
  readonly error?: string;
}

export class UpdateSkillUseCase {
  constructor(
    private readonly skillRepository: ISkillRepository,
    private readonly skillCategoryRepository: ISkillCategoryRepository
  ) {}

  async execute(id: string, rawInput: Record<string, unknown>): Promise<UpdateSkillResult> {
    if (!id || typeof id !== 'string') {
      return { success: false, error: 'Skill ID is required' };
    }

    const existing = await this.skillRepository.getById(id);
    if (!existing) {
      return { success: false, error: 'Skill not found' };
    }

    const validation = validateUpdateSkillInput(rawInput);
    if (validation.success === false) {
      return { success: false, errors: validation.errors };
    }

    const updateData = { ...validation.data };

    // If categoryId is changing, verify target category existence
    if (updateData.categoryId !== undefined && updateData.categoryId !== existing.categoryId) {
      const targetCategory = await this.skillCategoryRepository.getById(updateData.categoryId);
      if (!targetCategory) {
        return {
          success: false,
          error: `Target skill category with ID '${updateData.categoryId}' not found`,
        };
      }
    }

    try {
      const updated = await this.skillRepository.update(id, updateData);
      return { success: true, data: updated };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update skill',
      };
    }
  }
}
