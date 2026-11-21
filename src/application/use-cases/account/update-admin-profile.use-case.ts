// src/application/use-cases/account/update-admin-profile.use-case.ts
// Use Case: Verify current password and update administrator username & email.

import type { Admin } from '../../../domain/entities/admin';
import type { IAdminRepository } from '../../../domain/repositories/admin.repository';
import type { IPasswordService } from '../../../infrastructure/auth/password.service';
import { validateUpdateAdminProfileInput } from '../../dtos/admin-account.dto';

export interface UpdateAdminProfileResult {
  readonly success: boolean;
  readonly data?: Admin;
  readonly sessionVersion?: number;
  readonly errors?: Record<string, string>;
  readonly error?: string;
}

export class UpdateAdminProfileUseCase {
  constructor(
    private readonly adminRepository: IAdminRepository,
    private readonly passwordService: IPasswordService
  ) {}

  async execute(adminId: string, rawInput: Record<string, unknown>): Promise<UpdateAdminProfileResult> {
    if (!adminId || typeof adminId !== 'string') {
      return { success: false, error: 'Admin ID is required' };
    }

    const validation = validateUpdateAdminProfileInput(rawInput);
    if (validation.success === false) {
      return { success: false, errors: validation.errors };
    }

    const authRecord = await this.adminRepository.findAuthById(adminId);
    if (!authRecord) {
      return { success: false, error: 'Administrator account not found' };
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

    if (validation.data.username !== authRecord.admin.username) {
      const existingByUsername = await this.adminRepository.findByUsername(validation.data.username);
      if (existingByUsername && existingByUsername.id !== adminId) {
        return {
          success: false,
          error: 'Username is already taken',
          errors: { username: 'Username is already taken' },
        };
      }
    }

    if (validation.data.email && validation.data.email !== authRecord.admin.email) {
      const existingByEmail = await this.adminRepository.findByEmail(validation.data.email);
      if (existingByEmail && existingByEmail.id !== adminId) {
        return {
          success: false,
          error: 'Email is already in use',
          errors: { email: 'Email is already in use' },
        };
      }
    }

    try {
      const updated = await this.adminRepository.updateProfile(adminId, {
        username: validation.data.username,
        email: validation.data.email,
      });

      return {
        success: true,
        data: updated,
        sessionVersion: authRecord.sessionVersion,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update administrator profile',
      };
    }
  }
}
