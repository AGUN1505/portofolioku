// src/application/use-cases/auth/bootstrap-admin.use-case.ts
// Use case for bootstrapping the initial administrator account (Single-Admin Architecture)

import type { Admin } from '../../../domain/entities/admin';
import type { IAdminRepository } from '../../../domain/repositories/admin.repository';
import type { IPasswordService } from '../../../infrastructure/auth/password.service';

export interface BootstrapAdminInput {
  readonly username: string;
  readonly password: string;
  readonly email?: string;
}

export interface BootstrapAdminOutput {
  readonly success: boolean;
  readonly error?: string;
  readonly admin?: Admin;
}

export class BootstrapAdminUseCase {
  private readonly adminRepository: IAdminRepository;
  private readonly passwordService: IPasswordService;

  constructor(
    adminRepository: IAdminRepository,
    passwordService: IPasswordService
  ) {
    this.adminRepository = adminRepository;
    this.passwordService = passwordService;
  }

  public async execute(input: BootstrapAdminInput): Promise<BootstrapAdminOutput> {
    // 1. Single-admin policy verification
    const existingCount = await this.adminRepository.count();
    if (existingCount > 0) {
      return {
        success: false,
        error: 'Single-admin policy violation: Admin account already exists. Bootstrap aborted.',
      };
    }

    const rawUsername = input?.username;
    const rawPassword = input?.password;
    const email = input?.email ? input.email.trim().toLowerCase() : undefined;

    // 2. Username validation & normalization
    if (!rawUsername || typeof rawUsername !== 'string' || rawUsername.trim().length === 0) {
      return {
        success: false,
        error: 'Username is required.',
      };
    }

    const normalizedUsername = rawUsername.toLowerCase().trim();
    if (normalizedUsername.length < 3 || normalizedUsername.length > 30) {
      return {
        success: false,
        error: 'Username must be between 3 and 30 characters.',
      };
    }

    const validUsernameRegex = /^[a-z0-9_-]+$/;
    if (!validUsernameRegex.test(normalizedUsername)) {
      return {
        success: false,
        error: 'Username can only contain alphanumeric characters, underscores, and hyphens.',
      };
    }

    // 3. Password policy verification
    const policyResult = BootstrapAdminUseCase.validatePasswordPolicy(rawPassword, normalizedUsername);
    if (!policyResult.valid) {
      return {
        success: false,
        error: policyResult.error,
      };
    }

    // 4. Hash password with bcrypt cost 12
    const passwordHash = await this.passwordService.hash(rawPassword);

    // 5. Persist admin via repository
    const admin = await this.adminRepository.create({
      username: normalizedUsername,
      passwordHash,
      email: email || null,
    });

    return {
      success: true,
      admin,
    };
  }

  /**
   * Password policy validator:
   * - Min 12 characters
   * - At least one uppercase letter
   * - At least one lowercase letter
   * - At least one numeric digit
   * - Must not contain username
   */
  public static validatePasswordPolicy(
    password: string,
    normalizedUsername?: string
  ): { valid: boolean; error?: string } {
    if (!password || typeof password !== 'string') {
      return { valid: false, error: 'Password is required.' };
    }

    if (password.length < 12) {
      return { valid: false, error: 'Password must be at least 12 characters long.' };
    }

    if (!/[A-Z]/.test(password)) {
      return { valid: false, error: 'Password must contain at least one uppercase letter.' };
    }

    if (!/[a-z]/.test(password)) {
      return { valid: false, error: 'Password must contain at least one lowercase letter.' };
    }

    if (!/[0-9]/.test(password)) {
      return { valid: false, error: 'Password must contain at least one digit.' };
    }

    if (normalizedUsername && password.toLowerCase().includes(normalizedUsername)) {
      return { valid: false, error: 'Password must not contain the username.' };
    }

    return { valid: true };
  }
}
