// src/infrastructure/auth/dal.ts
// Data Access Layer: Authoritative server-side session authorization guard

if (typeof window !== 'undefined') {
  throw new Error('Security violation: DAL verifySession can only be executed on the server');
}

import { cache } from 'react';
import { readSessionCookie, type SessionPayload } from './session';
import { prisma as defaultPrisma } from '../prisma/client';

export interface VerifiedSession {
  readonly userId: string;
  readonly username: string;
  readonly sessionVersion: number;
}

export class UnauthorizedException extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedException';
  }
}

export class SessionRevokedException extends UnauthorizedException {
  constructor(message = 'Session has been revoked or invalidated') {
    super(message);
    this.name = 'SessionRevokedException';
  }
}

export class SessionExpiredException extends UnauthorizedException {
  constructor(message = 'Session has expired') {
    super(message);
    this.name = 'SessionExpiredException';
  }
}

/**
 * Pure validation logic decoupled from Next.js cookie context.
 * Enables deterministic unit and integration testing.
 */
export async function validateSessionPayload(
  payload: SessionPayload | null,
  getDbVersion: (userId: string) => Promise<{ id: string; username: string; sessionVersion: number } | null>
): Promise<VerifiedSession> {
  if (!payload || !payload.userId) {
    throw new UnauthorizedException('No valid session payload found');
  }

  // Check expiration if present
  if (payload.expiresAt && new Date(payload.expiresAt).getTime() <= Date.now()) {
    throw new SessionExpiredException('Session timestamp is expired');
  }

  const dbAdmin = await getDbVersion(payload.userId);
  if (!dbAdmin) {
    throw new UnauthorizedException('Admin account associated with session does not exist');
  }

  if (dbAdmin.sessionVersion !== payload.sessionVersion) {
    throw new SessionRevokedException(
      `Session version mismatch: session is version ${payload.sessionVersion}, current database version is ${dbAdmin.sessionVersion}`
    );
  }

  return {
    userId: dbAdmin.id,
    username: dbAdmin.username,
    sessionVersion: dbAdmin.sessionVersion,
  };
}

/**
 * Authoritative session verification at the Data Access Layer.
 * Wrapped in React cache() so multiple invocations within the same request lifecycle
 * share the single database verification lookup.
 */
export const verifySession = cache(async (): Promise<VerifiedSession> => {
  const session = await readSessionCookie();

  return validateSessionPayload(session, async (userId: string) => {
    return defaultPrisma.admin.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        sessionVersion: true,
      },
    });
  });
});
