// src/application/use-cases/account/change-admin-password.use-case.ts
// Use Case: Verify current password, enforce policy, hash new password, and atomically rotate sessionVersion.

import type { Admin } from '../../../domain/entities/admin';
import type { IAdminRepository } from '../../../domain/repositories/admin.repository';
import type { IPasswordService } from '../../../infrastructure/auth/password.service';
import { validateChangeAdminPasswordInput } from '../../dtos/admin-account.dto';

export interface ChangeAdminPasswordResult {
  readonly success: boolean;
  readonly admin?: Admin;
  readonly sessionVersion?: number;
  readonly errors?: Record<string, string>;
  readonly error?: string;
}

export class ChangeAdminPasswordUseCase {
  constructor(
    private readonly adminRepository: IAdminRepository,
    private readonly passwordService: IPasswordService
  ) {}

  async execute(adminId: string, rawInput: Record<string, unknown>): Promise<ChangeAdminPasswordResult> {
    if (!adminId || typeof adminId !== 'string') {
      return { success: false, error: 'Admin ID is required' };
    }

    const authRecord = await this.adminRepository.findAuthById(adminId);
    if (!authRecord) {
      return { success: false, error: 'Administrator account not found' };
    }

    const validation = validateChangeAdminPasswordInput(rawInput, authRecord.admin.username);
    if (validation.success === false) {
      return { success: false, errors: validation.errors };
    }

    const passwordValid = await this.passwordService.compare(
      validation.data.currentPassword,
      authRecord.passwordHash
    );
    if (!passwordValid) {
      return {
        success: false,
        error: 'Incorrect current password',
        errors: { currentPassword: 'Incorrect current password' },
      };
    }

    try {
      const newPasswordHash = await this.passwordService.hash(validation.data.newPassword);
      const updated = await this.adminRepository.updatePassword(adminId, newPasswordHash);

      return {
        success: true,
        admin: updated.admin,
        sessionVersion: updated.sessionVersion,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to change administrator password',
      };
    }
  }
}
