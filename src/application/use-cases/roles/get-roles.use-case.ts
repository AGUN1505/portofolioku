// src/application/use-cases/roles/get-roles.use-case.ts
// Use Case: Retrieve all roles ordered by ascending display order.

import type { IRoleRepository } from '../../../domain/repositories/role.repository';
import type { RoleRecord } from '../../../domain/entities/role-record';

export class GetRolesUseCase {
  constructor(private readonly roleRepository: IRoleRepository) {}

  async execute(): Promise<RoleRecord[]> {
    return this.roleRepository.getAll();
  }
}
