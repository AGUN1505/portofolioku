// src/application/use-cases/account/get-admin-account.use-case.ts
// Use Case: Retrieve sanitized administrator account metadata and current session version.

import type { Admin } from '../../../domain/entities/admin';
import type { IAdminRepository } from '../../../domain/repositories/admin.repository';

export interface AdminAccountSnapshot {
  readonly admin: Admin;
  readonly sessionVersion: number;
}

export class GetAdminAccountUseCase {
  constructor(private readonly adminRepository: IAdminRepository) {}

  async execute(adminId: string): Promise<AdminAccountSnapshot | null> {
    if (!adminId || typeof adminId !== 'string') {
      return null;
    }

    const record = await this.adminRepository.findAuthById(adminId);
    if (!record) {
      return null;
    }

    return {
      admin: record.admin,
      sessionVersion: record.sessionVersion,
    };
  }
}
