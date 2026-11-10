// src/domain/repositories/admin.repository.ts
// Domain contract for Admin repository operations (Clean Architecture)

import type { Admin } from '../entities/admin';

/**
 * Internal auth record returned ONLY for password verification during login.
 * Never exposed via public Domain Entity or presentation DTO.
 */
export interface AdminAuthRecord {
  readonly admin: Admin;
  readonly passwordHash: string;
  readonly sessionVersion: number;
}

export interface CreateAdminInput {
  readonly username: string;
  readonly passwordHash: string;
  readonly email?: string | null;
}

export interface IAdminRepository {
  /**
   * Look up admin by ID. Returns pure domain entity without credentials.
   */
  findById(id: string): Promise<Admin | null>;

  /**
   * Look up admin by normalized username. Returns pure domain entity without credentials.
   */
  findByUsername(normalizedUsername: string): Promise<Admin | null>;

  /**
   * Internal auth query: retrieves credentials strictly for authentication verification.
   * Handled with care at infrastructure/application boundary.
   */
  findAuthByUsername(normalizedUsername: string): Promise<AdminAuthRecord | null>;

  /**
   * Retrieves current session version for fast DAL verification.
   */
  getSessionVersion(id: string): Promise<number | null>;

  /**
   * Increments session version to invalidate all active sessions.
   */
  incrementSessionVersion(id: string): Promise<number>;

  /**
   * Returns count of admin accounts to enforce single-admin policy.
   */
  count(): Promise<number>;

  /**
   * Creates the initial administrator. Enforces single-admin constraint.
   */
  create(data: CreateAdminInput): Promise<Admin>;
}
