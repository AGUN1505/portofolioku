// src/infrastructure/auth/session.ts
// Iron Session helper for encrypted HTTP-only session cookies

import { sealData, unsealData } from 'iron-session';

export interface SessionPayload {
  readonly userId: string;
  readonly username: string;
  readonly sessionVersion: number;
  readonly expiresAt: string; // ISO 8601 string
}

export const SESSION_COOKIE_NAME = 'porto_admin_session';
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET environment variable is missing or shorter than 32 characters');
  }
  return secret;
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_TTL_SECONDS,
};

/**
 * Seals payload into an encrypted AES-256 string using Iron Session.
 */
export async function sealSession(payload: SessionPayload): Promise<string> {
  const secret = getSessionSecret();
  return sealData(payload, {
    password: secret,
    ttl: SESSION_TTL_SECONDS,
  });
}

/**
 * Unseals encrypted string into SessionPayload.
 * Returns null if seal is corrupted, tampered, expired, or invalid.
 */
export async function unsealSession(seal: string): Promise<SessionPayload | null> {
  if (!seal || typeof seal !== 'string') {
    return null;
  }

  const secret = getSessionSecret();
  let failureOccurred = false;

  const result = await unsealData<Partial<SessionPayload>>(seal, {
    password: secret,
    ttl: SESSION_TTL_SECONDS,
    onUnsealError: () => {
      failureOccurred = true;
    },
  });

  if (failureOccurred || !result || !result.userId || typeof result.sessionVersion !== 'number') {
    return null;
  }

  // Double-check expiration timestamp inside payload
  if (result.expiresAt && new Date(result.expiresAt).getTime() <= Date.now()) {
    return null;
  }

  return {
    userId: result.userId,
    username: result.username ?? '',
    sessionVersion: result.sessionVersion,
    expiresAt: result.expiresAt ?? new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString(),
  };
}

/**
 * Sets encrypted session cookie in Next.js response/action context.
 */
export async function createSessionCookie(payload: SessionPayload): Promise<void> {
  const { cookies } = await import('next/headers');
  const sealed = await sealSession(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sealed, SESSION_COOKIE_OPTIONS);
}

/**
 * Reads and decrypts session cookie from Next.js request context.
 */
export async function readSessionCookie(): Promise<SessionPayload | null> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!cookieValue) return null;
  return unsealSession(cookieValue);
}

/**
 * Deletes session cookie to complete logout.
 */
export async function clearSessionCookie(): Promise<void> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, '', {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: 0,
  });
}
