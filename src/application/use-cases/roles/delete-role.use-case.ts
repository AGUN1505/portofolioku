// src/application/use-cases/roles/delete-role.use-case.ts
// Use Case: Verify role existence and delete role by ID.

import type { IRoleRepository } from '../../../domain/repositories/role.repository';

export interface DeleteRoleResult {
  readonly success: boolean;
  readonly error?: string;
}

export class DeleteRoleUseCase {
  constructor(private readonly roleRepository: IRoleRepository) {}

  async execute(id: string): Promise<DeleteRoleResult> {
    if (!id || typeof id !== 'string') {
      return { success: false, error: 'Role ID is required' };
    }

    const existing = await this.roleRepository.getById(id);
    if (!existing) {
      return { success: false, error: 'Role not found' };
    }

    try {
      await this.roleRepository.delete(id);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete role',
      };
    }
  }
}
