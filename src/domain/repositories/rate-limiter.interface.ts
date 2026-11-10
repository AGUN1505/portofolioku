// src/domain/repositories/rate-limiter.interface.ts
// Domain contract for rate limiting operations

export interface RateLimitCheckResult {
  readonly allowed: boolean;
  readonly remainingAttempts: number;
  readonly retryAfterMs: number;
}

export interface IRateLimiter {
  /**
   * Check if request for given key is allowed under rate limiting rules without recording an attempt.
   */
  check(key: string): Promise<RateLimitCheckResult>;

  /**
   * Record a failed attempt for given key and return updated status.
   */
  recordFailure(key: string): Promise<RateLimitCheckResult>;

  /**
   * Reset rate limiting records for given key (e.g. after successful login).
   */
  reset(key: string): Promise<void>;
}
