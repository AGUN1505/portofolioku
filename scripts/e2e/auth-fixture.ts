// scripts/e2e/auth-fixture.ts
// Fixture for managing dedicated test admin on porto_cms_e2e.
// Uses runtime cryptographically generated passwords. Never hardcodes secrets.

import { randomBytes } from 'node:crypto';
import type { Client } from 'pg';
import { PasswordService } from '../../src/infrastructure/auth/password.service';

export const E2E_ADMIN_ID = 'e2e_test_admin_singleton';
export const E2E_ADMIN_USERNAME = 'e2e_test_admin';
export const E2E_ADMIN_EMAIL = 'e2e_test_admin@example.com';

export interface TestAdminRecord {
  readonly id: string;
  readonly username: string;
  readonly email?: string;
  readonly plainPassword: string;
  readonly passwordHash: string;
  readonly sessionVersion: number;
}

/**
 * Generates a high-entropy dynamic password satisfying the strict password policy:
 * - Minimum 12 characters
 * - Uppercase, lowercase, digit, and special character
 * - Excludes username
 */
export function generateSecureE2EPassword(): string {
  // 16 bytes base64url string + required character classes
  const entropy = randomBytes(16).toString('base64url');
  return `E2E!Aa9_${entropy}`;
}

/**
 * Inserts or updates the isolated test admin in porto_cms_e2e.
 * Generates an ephemeral runtime password and hashes it using production bcrypt PasswordService.
 * Never logs or writes the plain password or hash to files.
 */
export async function setupTestAdmin(client: Client): Promise<TestAdminRecord> {
  const plainPassword = generateSecureE2EPassword();
  const passwordService = new PasswordService();
  const passwordHash = await passwordService.hash(plainPassword);
  const sessionVersion = 1;

  const query = `
    INSERT INTO admins (id, username, email, "passwordHash", "sessionVersion", "createdAt", "updatedAt")
    VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        "passwordHash" = EXCLUDED."passwordHash",
        "sessionVersion" = EXCLUDED."sessionVersion",
        "updatedAt" = NOW()
    RETURNING id, username, email, "passwordHash", "sessionVersion";
  `;

  const res = await client.query(query, [
    E2E_ADMIN_ID,
    E2E_ADMIN_USERNAME,
    E2E_ADMIN_EMAIL,
    passwordHash,
    sessionVersion,
  ]);

  const row = res.rows[0];

  return {
    id: row.id,
    username: row.username,
    email: row.email,
    plainPassword,
    passwordHash: row.passwordHash,
    sessionVersion: row.sessionVersion,
  };
}

/**
 * Strictly deletes the test admin by its explicit primary key ID.
 * Never uses username matching or wildcard conditions to avoid deleting any other admin.
 */
export async function cleanupTestAdmin(client: Client, adminId = E2E_ADMIN_ID): Promise<void> {
  await client.query('DELETE FROM admins WHERE id = $1;', [adminId]);
}
