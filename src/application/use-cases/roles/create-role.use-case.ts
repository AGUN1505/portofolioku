// src/application/use-cases/roles/create-role.use-case.ts
// Use Case: Validate input DTO, compute next order if omitted, and persist new Role.

import type { IRoleRepository } from '../../../domain/repositories/role.repository';
import type { RoleRecord } from '../../../domain/entities/role-record';
import { validateCreateRoleInput } from '../../dtos/role.dto';

export interface CreateRoleResult {
  readonly success: boolean;
  readonly data?: RoleRecord;
  readonly errors?: Record<string, string>;
  readonly error?: string;
}

export class CreateRoleUseCase {
  constructor(private readonly roleRepository: IRoleRepository) {}

  async execute(rawInput: Record<string, unknown>): Promise<CreateRoleResult> {
    const validation = validateCreateRoleInput(rawInput);
    if (validation.success === false) {
      return { success: false, errors: validation.errors };
    }

    const { data } = validation;

    try {
      const created = await this.roleRepository.create({
        title: data.title,
        primary: data.primary,
        order: data.order,
      });

      return { success: true, data: created };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create role',
      };
    }
  }
}
