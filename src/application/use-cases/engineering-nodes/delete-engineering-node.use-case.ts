// src/application/use-cases/engineering-nodes/delete-engineering-node.use-case.ts
// Use Case: Verify engineering node existence and delete engineering node by ID.

import type { IEngineeringNodeRepository } from '../../../domain/repositories/engineering-node.repository';

export interface DeleteEngineeringNodeResult {
  readonly success: boolean;
  readonly error?: string;
}

export class DeleteEngineeringNodeUseCase {
  constructor(private readonly engineeringNodeRepository: IEngineeringNodeRepository) {}

  async execute(id: string): Promise<DeleteEngineeringNodeResult> {
    if (!id || typeof id !== 'string') {
      return { success: false, error: 'Engineering node ID is required' };
    }

    const existing = await this.engineeringNodeRepository.getById(id);
    if (!existing) {
      return { success: false, error: 'Engineering node not found' };
    }

    try {
      await this.engineeringNodeRepository.delete(id);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete engineering node',
      };
    }
  }
}
