// src/infrastructure/auth/memory-rate-limiter.ts
// In-memory sliding-window rate limiter for local single-instance development.
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
   * Builds distinct normalized keys for each dimension.
   */
  public static buildKeys(username: string, ip?: string): {
    usernameKey: string;
    ipKey?: string;
    compositeKey?: string;
  } {
    const normalizedUser = username.toLowerCase().trim();
    const result: { usernameKey: string; ipKey?: string; compositeKey?: string } = {
      usernameKey: `usr:${normalizedUser}`,
    };

    if (ip && ip.trim()) {
      const normalizedIp = ip.trim();
      result.ipKey = `ip:${normalizedIp}`;
      result.compositeKey = `usr_ip:${normalizedUser}#${normalizedIp}`;
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
   * Helper to check all applicable dimensions (username, ip, composite).
   * If ANY dimension is blocked, access is denied.
   */
  public async checkMultiDimension(
    username: string,
    ip?: string
  ): Promise<{ allowed: boolean; blockedDimension?: 'username' | 'ip' | 'composite'; retryAfterMs: number }> {
    const keys = MemoryRateLimiter.buildKeys(username, ip);

    // 1. Check username dimension
    const userResult = await this.check(keys.usernameKey);
    if (!userResult.allowed) {
      return { allowed: false, blockedDimension: 'username', retryAfterMs: userResult.retryAfterMs };
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
  public async recordMultiDimensionFailure(username: string, ip?: string): Promise<void> {
    const keys = MemoryRateLimiter.buildKeys(username, ip);
    await this.recordFailure(keys.usernameKey);
    if (keys.ipKey) await this.recordFailure(keys.ipKey);
    if (keys.compositeKey) await this.recordFailure(keys.compositeKey);
  }

  /**
   * Reset all dimensions upon successful login.
   */
  public async resetMultiDimension(username: string, ip?: string): Promise<void> {
    const keys = MemoryRateLimiter.buildKeys(username, ip);
    await this.reset(keys.usernameKey);
    if (keys.ipKey) await this.reset(keys.ipKey);
    if (keys.compositeKey) await this.reset(keys.compositeKey);
  }

  /**
   * Clear all records in the limiter (useful for test isolation).
   */
  public clearAll(): void {
    this.attempts.clear();
  }
}
