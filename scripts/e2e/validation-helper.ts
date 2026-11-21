// scripts/e2e/validation-helper.ts
// Authoritative DAL session validation against database admin record.

import { unsealSession } from '../../src/infrastructure/auth/session';
import { validateSessionPayload, type VerifiedSession } from '../../src/infrastructure/auth/dal';
import type { PrismaClient } from '@prisma/client';

/**
 * Validates a sealed Iron Session cookie payload against the database admin table.
 * Tests real cryptographic unsealing + real database sessionVersion verification.
 */
export async function validateSessionAuthoritatively(
  sealedToken: string | null,
  prisma: PrismaClient
): Promise<VerifiedSession> {
  const payload = sealedToken ? await unsealSession(sealedToken) : null;

  return validateSessionPayload(payload, async (userId: string) => {
    return prisma.admin.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        sessionVersion: true,
      },
    });
  });
}
