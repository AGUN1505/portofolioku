// src/application/use-cases/pillars/delete-pillar.use-case.ts
// Use Case: Verify pillar existence and delete pillar by ID.

import type { IPillarRepository } from '../../../domain/repositories/pillar.repository';

export interface DeletePillarResult {
  readonly success: boolean;
  readonly error?: string;
}

export class DeletePillarUseCase {
  constructor(private readonly pillarRepository: IPillarRepository) {}

  async execute(id: string): Promise<DeletePillarResult> {
    if (!id || typeof id !== 'string') {
      return { success: false, error: 'Pillar ID is required' };
    }

    const existing = await this.pillarRepository.getById(id);
    if (!existing) {
      return { success: false, error: 'Pillar not found' };
    }

    try {
      await this.pillarRepository.delete(id);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete pillar',
      };
    }
  }
}
