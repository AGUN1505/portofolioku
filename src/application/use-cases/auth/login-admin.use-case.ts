// src/application/use-cases/auth/login-admin.use-case.ts
// Use case for administrator login with timing-safe checks and multi-dimensional rate limiting

import type { Admin } from '../../../domain/entities/admin';
import type { IAdminRepository } from '../../../domain/repositories/admin.repository';
import type { IPasswordService } from '../../../infrastructure/auth/password.service';
import type { MemoryRateLimiter } from '../../../infrastructure/auth/memory-rate-limiter';

export interface LoginAdminInput {
  readonly username: string;
  readonly password: string;
  readonly clientIP?: string;
}

export interface LoginAdminOutput {
  readonly success: boolean;
  readonly error?: string;
  readonly statusCode?: number;
  readonly retryAfterMs?: number;
  readonly admin?: Admin;
  readonly sessionVersion?: number;
}

export class LoginAdminUseCase {
  private readonly adminRepository: IAdminRepository;
  private readonly passwordService: IPasswordService;
  private readonly rateLimiter: MemoryRateLimiter;

  constructor(
    adminRepository: IAdminRepository,
    passwordService: IPasswordService,
    rateLimiter: MemoryRateLimiter
  ) {
    this.adminRepository = adminRepository;
    this.passwordService = passwordService;
    this.rateLimiter = rateLimiter;
  }

  public async execute(input: LoginAdminInput): Promise<LoginAdminOutput> {
    const rawUsername = input?.username;
    const rawPassword = input?.password;
    const clientIP = input?.clientIP;

    // 1. Input validation & sanitization
    if (!rawUsername || typeof rawUsername !== 'string' || rawUsername.trim().length === 0) {
      return {
        success: false,
        error: 'Invalid username or password',
        statusCode: 400,
      };
    }

    if (!rawPassword || typeof rawPassword !== 'string' || rawPassword.length === 0) {
      return {
        success: false,
        error: 'Invalid username or password',
        statusCode: 400,
      };
    }

    const normalizedUsername = rawUsername.toLowerCase().trim();

    // 2. Rate limit gatekeeper (PRE-BCRYPT to avoid CPU exhaustion)
    const rateLimitCheck = await this.rateLimiter.checkMultiDimension(normalizedUsername, clientIP);
    if (!rateLimitCheck.allowed) {
      return {
        success: false,
        error: 'Too many failed login attempts. Please try again later.',
        statusCode: 429,
        retryAfterMs: rateLimitCheck.retryAfterMs,
      };
    }

    // 3. Admin lookup
    const authRecord = await this.adminRepository.findAuthByUsername(normalizedUsername);

    if (!authRecord) {
      // Record failure across dimensions
      await this.rateLimiter.recordMultiDimensionFailure(normalizedUsername, clientIP);
      // Execute timing-safe dummy compare to mitigate username enumeration
      await this.passwordService.performDummyCompare(rawPassword);
      return {
        success: false,
        error: 'Invalid username or password',
        statusCode: 401,
      };
    }

    // 4. Verify password against authentic hash
    const isValidPassword = await this.passwordService.compare(
      rawPassword,
      authRecord.passwordHash
    );

    if (!isValidPassword) {
      // Record failure across dimensions
      await this.rateLimiter.recordMultiDimensionFailure(normalizedUsername, clientIP);
      return {
        success: false,
        error: 'Invalid username or password',
        statusCode: 401,
      };
    }

    // 5. Successful authentication: reset rate limiter for this identity
    await this.rateLimiter.resetMultiDimension(normalizedUsername, clientIP);

    return {
      success: true,
      admin: authRecord.admin,
      sessionVersion: authRecord.sessionVersion,
    };
  }
}
