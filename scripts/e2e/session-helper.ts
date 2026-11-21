// scripts/e2e/session-helper.ts
// Helper for creating and testing encrypted Iron Session tokens.

import { sealSession, unsealSession, type SessionPayload } from '../../src/infrastructure/auth/session';

export async function createTestSessionToken(
  userId: string,
  username: string,
  sessionVersion = 1,
  ttlSeconds = 604800
): Promise<string> {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  const payload: SessionPayload = {
    userId,
    username,
    sessionVersion,
    expiresAt,
  };
  return sealSession(payload);
}

export async function createExpiredSessionToken(
  userId: string,
  username: string,
  sessionVersion = 1
): Promise<string> {
  const expiresAt = new Date(Date.now() - 3600000).toISOString(); // Expired 1 hour ago
  const payload: SessionPayload = {
    userId,
    username,
    sessionVersion,
    expiresAt,
  };
  return sealSession(payload);
}

export function createTamperedSessionToken(): string {
  // Invalid ciphertext that fails Iron Session decryption
  return 'fe26.2*tampered_data*invalid_iv*invalid_tag*corrupted_signature';
}

export { unsealSession };
