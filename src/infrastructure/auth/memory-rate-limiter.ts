// src/infrastructure/auth/memory-rate-limiter.ts
// In-memory sliding-window rate limiter for local single-instance development.
// Supports multi-dimensional rate limiting across username, email, IP, and composite keys.
// NOTE: Not suitable for multi-instance or serverless production where shared storage (e.g. Redis) is required.

import type { IRateLimiter, RateLimitCheckResult } from '../../domain/repositories/rate-limiter.interface';

export interface RateLimiterOptions {
  maxAttempts?: number;
  windowMs?: number;
}

export class MemoryRateLimiter implements IRateLimiter {
  public static readonly DEFAULT_MAX_ATTEMPTS = 5;
  public static readonly DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

  private readonly maxAttempts: number;
  private readonly windowMs: number;

  // Stores array of millisecond timestamps for each rate-limit key
  private readonly attempts = new Map<string, number[]>();

  constructor(options?: RateLimiterOptions) {
    this.maxAttempts = options?.maxAttempts ?? MemoryRateLimiter.DEFAULT_MAX_ATTEMPTS;
    this.windowMs = options?.windowMs ?? MemoryRateLimiter.DEFAULT_WINDOW_MS;
  }

  /**
   * Builds distinct normalized keys specifically for email dimensions.
   */
  public static buildEmailKeys(email: string, ip?: string): {
    emailKey: string;
    ipKey?: string;
    compositeKey?: string;
  } {
    const normalizedEmail = email.toLowerCase().trim();
    const result: { emailKey: string; ipKey?: string; compositeKey?: string } = {
      emailKey: `email:${normalizedEmail}`,
    };

    if (ip && ip.trim()) {
      const normalizedIp = ip.trim();
      result.ipKey = `ip:${normalizedIp}`;
      result.compositeKey = `email_ip:${normalizedEmail}#${normalizedIp}`;
    }

    return result;
  }

  /**
   * Builds distinct normalized keys for each dimension.
   * Dynamically formats keys for email (e.g. `email:...`, `email_ip:...`) or username (`usr:...`, `usr_ip:...`).
   */
  public static buildKeys(identifier: string, ip?: string): {
    usernameKey: string;
    emailKey?: string;
    ipKey?: string;
    compositeKey?: string;
  } {
    const normalized = identifier.toLowerCase().trim();
    const isEmail = normalized.includes('@');
    const primaryKey = isEmail ? `email:${normalized}` : `usr:${normalized}`;

    const result: {
      usernameKey: string;
      emailKey?: string;
      ipKey?: string;
      compositeKey?: string;
    } = {
      usernameKey: primaryKey,
      ...(isEmail ? { emailKey: primaryKey } : {}),
    };

    if (ip && ip.trim()) {
      const normalizedIp = ip.trim();
      result.ipKey = `ip:${normalizedIp}`;
      const prefix = isEmail ? 'email_ip' : 'usr_ip';
      result.compositeKey = `${prefix}:${normalized}#${normalizedIp}`;
    }

    return result;
  }

  /**
   * Cleans up expired timestamps for a given key and returns active timestamps.
   */
  private getActiveTimestamps(key: string, now: number): number[] {
    const timestamps = this.attempts.get(key);
    if (!timestamps || timestamps.length === 0) {
      return [];
    }

    const cutoff = now - this.windowMs;
    const active = timestamps.filter((t) => t > cutoff);

    if (active.length === 0) {
      this.attempts.delete(key);
    } else if (active.length !== timestamps.length) {
      this.attempts.set(key, active);
    }

    return active;
  }

  /**
   * Check status without recording an attempt.
   */
  public async check(key: string): Promise<RateLimitCheckResult> {
    const now = Date.now();
    const active = this.getActiveTimestamps(key, now);
    const count = active.length;

    const allowed = count < this.maxAttempts;
    const remainingAttempts = Math.max(0, this.maxAttempts - count);

    let retryAfterMs = 0;
    if (!allowed && active.length > 0) {
      const oldestActive = active[0];
      retryAfterMs = Math.max(0, oldestActive + this.windowMs - now);
    }

    return {
      allowed,
      remainingAttempts,
      retryAfterMs,
    };
  }

  /**
   * Record a failed attempt and return updated status.
   */
  public async recordFailure(key: string): Promise<RateLimitCheckResult> {
    const now = Date.now();
    const active = this.getActiveTimestamps(key, now);

    active.push(now);
    this.attempts.set(key, active);

    const count = active.length;
    const allowed = count <= this.maxAttempts;
    const remainingAttempts = Math.max(0, this.maxAttempts - count);

    let retryAfterMs = 0;
    if (!allowed && active.length > 0) {
      const oldestActive = active[0];
      retryAfterMs = Math.max(0, oldestActive + this.windowMs - now);
    }

    return {
      allowed,
      remainingAttempts,
      retryAfterMs,
    };
  }

  /**
   * Reset rate-limit history for a key.
   */
  public async reset(key: string): Promise<void> {
    this.attempts.delete(key);
  }

  /**
   * Helper to check all applicable dimensions (email/username, ip, composite).
   * If ANY dimension is blocked, access is denied.
   */
  public async checkMultiDimension(
    identifier: string,
    ip?: string
  ): Promise<{
    allowed: boolean;
    blockedDimension?: 'email' | 'username' | 'ip' | 'composite';
    retryAfterMs: number;
  }> {
    const keys = MemoryRateLimiter.buildKeys(identifier, ip);
    const isEmail = identifier.includes('@');
    const primaryDimension: 'email' | 'username' = isEmail ? 'email' : 'username';

    // 1. Check identity dimension (email or username)
    const primaryResult = await this.check(keys.emailKey ?? keys.usernameKey);
    if (!primaryResult.allowed) {
      return { allowed: false, blockedDimension: primaryDimension, retryAfterMs: primaryResult.retryAfterMs };
    }

    // 2. Check IP dimension (if IP present)
    if (keys.ipKey) {
      const ipResult = await this.check(keys.ipKey);
      if (!ipResult.allowed) {
        return { allowed: false, blockedDimension: 'ip', retryAfterMs: ipResult.retryAfterMs };
      }
    }

    // 3. Check composite dimension (if IP present)
    if (keys.compositeKey) {
      const compResult = await this.check(keys.compositeKey);
      if (!compResult.allowed) {
        return { allowed: false, blockedDimension: 'composite', retryAfterMs: compResult.retryAfterMs };
      }
    }

    return { allowed: true, retryAfterMs: 0 };
  }

  /**
   * Record failure across all dimensions for this attempt.
   */
  public async recordMultiDimensionFailure(identifier: string, ip?: string): Promise<void> {
    const keys = MemoryRateLimiter.buildKeys(identifier, ip);
    await this.recordFailure(keys.emailKey ?? keys.usernameKey);
    if (keys.ipKey) await this.recordFailure(keys.ipKey);
    if (keys.compositeKey) await this.recordFailure(keys.compositeKey);
  }

  /**
   * Reset all dimensions upon successful login.
   */
  public async resetMultiDimension(identifier: string, ip?: string): Promise<void> {
    const keys = MemoryRateLimiter.buildKeys(identifier, ip);
    await this.reset(keys.emailKey ?? keys.usernameKey);
    if (keys.ipKey) await this.reset(keys.ipKey);
    if (keys.compositeKey) await this.reset(keys.compositeKey);
  }

  /**
   * Dedicated email dimension check.
   */
  public async checkMultiDimensionEmail(
    email: string,
    ip?: string
  ): Promise<{ allowed: boolean; blockedDimension?: 'email' | 'ip' | 'composite'; retryAfterMs: number }> {
    const res = await this.checkMultiDimension(email, ip);
    return {
      allowed: res.allowed,
      blockedDimension: res.blockedDimension as 'email' | 'ip' | 'composite' | undefined,
      retryAfterMs: res.retryAfterMs,
    };
  }

  /**
   * Dedicated email dimension failure recording.
   */
  public async recordMultiDimensionEmailFailure(email: string, ip?: string): Promise<void> {
    return this.recordMultiDimensionFailure(email, ip);
  }

  /**
   * Dedicated email dimension reset.
   */
  public async resetMultiDimensionEmail(email: string, ip?: string): Promise<void> {
    return this.resetMultiDimension(email, ip);
  }

  /**
   * Clear all records in the limiter (useful for test isolation).
   */
  public clearAll(): void {
    this.attempts.clear();
  }
}
