// src/application/use-cases/auth/logout-admin.use-case.ts
// Use case for administrator logout with atomic database session version increment

import type { IAdminRepository } from '../../../domain/repositories/admin.repository';

export interface LogoutAdminInput {
  readonly userId?: string;
}

export interface LogoutAdminOutput {
  readonly success: boolean;
  readonly revoked: boolean;
  readonly newSessionVersion?: number;
}

export class LogoutAdminUseCase {
  private readonly adminRepository: IAdminRepository;

  constructor(adminRepository: IAdminRepository) {
    this.adminRepository = adminRepository;
  }

  public async execute(input: LogoutAdminInput): Promise<LogoutAdminOutput> {
    const userId = input?.userId;

    // Anonymous or already invalid session: safe no-op on DB
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return {
        success: true,
        revoked: false,
      };
    }

    try {
      // Atomically increment sessionVersion in PostgreSQL
      const newVersion = await this.adminRepository.incrementSessionVersion(userId);
      return {
        success: true,
        revoked: true,
        newSessionVersion: newVersion,
      };
    } catch {
      // If admin was deleted or not found, logout succeeds locally without crashing
      return {
        success: true,
        revoked: false,
      };
    }
  }
}
