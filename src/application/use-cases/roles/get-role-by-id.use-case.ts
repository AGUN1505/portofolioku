// src/application/use-cases/roles/get-role-by-id.use-case.ts
// Use Case: Retrieve a single role by primary key ID.

import type { IRoleRepository } from '../../../domain/repositories/role.repository';
import type { RoleRecord } from '../../../domain/entities/role-record';

export class GetRoleByIdUseCase {
  constructor(private readonly roleRepository: IRoleRepository) {}

  async execute(id: string): Promise<RoleRecord | null> {
    if (!id || typeof id !== 'string') {
      return null;
    }
    return this.roleRepository.getById(id);
  }
}
