// src/infrastructure/auth/password.service.ts
// Bcrypt password hashing & timing-safe verification service

import * as bcrypt from 'bcryptjs';

export interface IPasswordService {
  hash(password: string): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
  performDummyCompare(password: string): Promise<boolean>;
  getDummyHash(): Promise<string>;
}

export class PasswordService implements IPasswordService {
  public static readonly SALT_ROUNDS = 12;

  // Cached valid 12-round dummy hash to prevent timing attacks when user does not exist
  private dummyHashPromise: Promise<string> | null = null;

  /**
   * Generates or retrieves a valid 12-round bcrypt dummy hash.
   * Guaranteed to be a real bcrypt hash generated via bcrypt.hash().
   */
  public async getDummyHash(): Promise<string> {
    if (!this.dummyHashPromise) {
      this.dummyHashPromise = bcrypt.hash(
        '__porto_timing_safe_dummy_auth_target_mitigation__',
        PasswordService.SALT_ROUNDS
      );
    }
    return this.dummyHashPromise;
  }

  /**
   * Hashes plaintext password with bcrypt cost factor 12.
   */
  public async hash(password: string): Promise<string> {
    return bcrypt.hash(password, PasswordService.SALT_ROUNDS);
  }

  /**
   * Verifies plaintext password against stored bcrypt hash.
   */
  public async compare(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) return false;
    return bcrypt.compare(password, hash);
  }

  /**
   * Performs timing-safe comparison against a valid dummy hash when user is not found.
   * Always resolves to false, but takes approximately the same time (~100-400ms) as a real verification.
   */
  public async performDummyCompare(password: string): Promise<boolean> {
    const dummy = await this.getDummyHash();
    await bcrypt.compare(password, dummy);
    return false;
  }
}
