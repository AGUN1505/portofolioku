// src/domain/repositories/role.repository.ts
// Domain contract for Role persistence operations.
// STRICT: Must not import Application DTOs or external infrastructure libraries.

import type { RoleRecord } from '../entities/role-record';

export interface CreateRoleData {
  readonly title: string;
  readonly primary?: boolean;
  readonly order?: number;
}

export interface UpdateRoleData {
  readonly title?: string;
  readonly primary?: boolean;
  readonly order?: number;
}

export interface IRoleRepository {
  getAll(): Promise<RoleRecord[]>;
  getById(id: string): Promise<RoleRecord | null>;
  create(data: CreateRoleData): Promise<RoleRecord>;
  update(id: string, data: UpdateRoleData): Promise<RoleRecord>;
  delete(id: string): Promise<void>;
  reorder(orderedIds: string[]): Promise<void>;
}
