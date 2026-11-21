// src/application/use-cases/auth/login-admin.use-case.ts
// Use case for administrator login with email validation, timing-safe checks and multi-dimensional rate limiting

import type { Admin } from '../../../domain/entities/admin';
import type { IAdminRepository } from '../../../domain/repositories/admin.repository';
import type { IPasswordService } from '../../../infrastructure/auth/password.service';
import type { MemoryRateLimiter } from '../../../infrastructure/auth/memory-rate-limiter';

export interface LoginAdminInput {
  readonly email?: string;
  readonly username?: string;
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    const rawEmail = input?.email ?? input?.username;
    const rawPassword = input?.password;
    const clientIP = input?.clientIP;

    // 1. Input validation & sanitization
    if (!rawEmail || typeof rawEmail !== 'string' || rawEmail.trim().length === 0) {
      return {
        success: false,
        error: 'Invalid email or password',
        statusCode: 400,
      };
    }

    if (!rawPassword || typeof rawPassword !== 'string' || rawPassword.length === 0) {
      return {
        success: false,
        error: 'Invalid email or password',
        statusCode: 400,
      };
    }

    const normalizedEmail = rawEmail.toLowerCase().trim();

    if (normalizedEmail.length > 254 || !EMAIL_REGEX.test(normalizedEmail)) {
      return {
        success: false,
        error: 'Invalid email format',
        statusCode: 400,
      };
    }

    // 2. Rate limit gatekeeper (PRE-BCRYPT to avoid CPU exhaustion)
    const rateLimitCheck = await this.rateLimiter.checkMultiDimension(normalizedEmail, clientIP);
    if (!rateLimitCheck.allowed) {
      return {
        success: false,
        error: 'Too many failed login attempts. Please try again later.',
        statusCode: 429,
        retryAfterMs: rateLimitCheck.retryAfterMs,
      };
    }

    // 3. Admin lookup by normalized email
    const authRecord = await this.adminRepository.findAuthByEmail(normalizedEmail);

    if (!authRecord) {
      // Record failure across dimensions
      await this.rateLimiter.recordMultiDimensionFailure(normalizedEmail, clientIP);
      // Execute timing-safe dummy compare to mitigate email enumeration
      await this.passwordService.performDummyCompare(rawPassword);
      return {
        success: false,
        error: 'Invalid email or password',
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
      await this.rateLimiter.recordMultiDimensionFailure(normalizedEmail, clientIP);
      return {
        success: false,
        error: 'Invalid email or password',
        statusCode: 401,
      };
    }

    // 5. Successful authentication: reset rate limiter for this identity
    await this.rateLimiter.resetMultiDimension(normalizedEmail, clientIP);

    return {
      success: true,
      admin: authRecord.admin,
      sessionVersion: authRecord.sessionVersion,
    };
  }
}
