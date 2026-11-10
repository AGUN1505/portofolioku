// src/application/use-cases/roles/update-role.use-case.ts
// Use Case: Validate update DTO, verify role existence, and update Role.

import type { IRoleRepository } from '../../../domain/repositories/role.repository';
import type { RoleRecord } from '../../../domain/entities/role-record';
import { validateUpdateRoleInput } from '../../dtos/role.dto';

export interface UpdateRoleResult {
  readonly success: boolean;
  readonly data?: RoleRecord;
  readonly errors?: Record<string, string>;
  readonly error?: string;
}

export class UpdateRoleUseCase {
  constructor(private readonly roleRepository: IRoleRepository) {}

  async execute(id: string, rawInput: Record<string, unknown>): Promise<UpdateRoleResult> {
    if (!id || typeof id !== 'string') {
      return { success: false, error: 'Role ID is required' };
    }

    const existing = await this.roleRepository.getById(id);
    if (!existing) {
      return { success: false, error: 'Role not found' };
    }

    const validation = validateUpdateRoleInput(rawInput);
    if (validation.success === false) {
      return { success: false, errors: validation.errors };
    }

    try {
      const updated = await this.roleRepository.update(id, validation.data);
      return { success: true, data: updated };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update role',
      };
    }
  }
}
