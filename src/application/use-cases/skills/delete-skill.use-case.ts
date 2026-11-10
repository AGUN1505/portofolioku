// src/application/use-cases/skills/delete-skill.use-case.ts
// Use Case: Verify skill existence and delete skill by ID.
// Safe deletion: does not delete or alter parent category.

import type { ISkillRepository } from '../../../domain/repositories/skill.repository';

export interface DeleteSkillResult {
  readonly success: boolean;
  readonly error?: string;
}

export class DeleteSkillUseCase {
  constructor(private readonly skillRepository: ISkillRepository) {}

  async execute(id: string): Promise<DeleteSkillResult> {
    if (!id || typeof id !== 'string') {
      return { success: false, error: 'Skill ID is required' };
    }

    const existing = await this.skillRepository.getById(id);
    if (!existing) {
      return { success: false, error: 'Skill not found' };
    }

    try {
      await this.skillRepository.delete(id);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete skill',
      };
    }
  }
}
