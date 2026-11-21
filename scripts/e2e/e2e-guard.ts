// scripts/e2e/e2e-guard.ts
// Strict fail-fast database target validation to guarantee 100% isolation.
// Zero connections or queries to the primary database (porto_cms) or external databases.

export const FORBIDDEN_DATABASES = new Set<string>([
  'porto_cms',
  'Owner',
  'db_unm',
  'fashiondb',
  'padekinapp',
  'pesantren',
  'postgres',
  'powerteam',
  'powerteamm',
  'tkunh_user_service',
]);

export const EXPECTED_E2E_DATABASE = 'porto_cms_e2e';

export interface ValidatedDatabaseTarget {
  readonly hostname: string;
  readonly port: string;
  readonly databaseName: string;
}

/**
 * Validates that DATABASE_URL strictly targets porto_cms_e2e on localhost:5432.
 * Throws immediately if targeting porto_cms, any external database, or remote hosts.
 * Never connects to or queries any database; performs purely configuration validation.
 */
export function assertE2EDatabase(connectionString?: string): ValidatedDatabaseTarget {
  const urlStr = connectionString || process.env.DATABASE_URL;
  if (!urlStr) {
    throw new Error('[E2E-GUARD-FATAL] DATABASE_URL environment variable is not set.');
  }

  let parsed: URL;
  try {
    parsed = new URL(urlStr);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`[E2E-GUARD-FATAL] Failed to parse DATABASE_URL: ${msg}`);
  }

  // 1. Host Isolation Check
  const hostname = parsed.hostname;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  if (!isLocal) {
    throw new Error(`[E2E-GUARD-FATAL] E2E tests must target localhost, got: ${hostname}`);
  }

  // 2. Port Isolation Check
  const port = parsed.port || '5432';
  if (port !== '5432') {
    throw new Error(`[E2E-GUARD-FATAL] E2E tests must target port 5432, got: ${port}`);
  }

  // 3. Database Target Isolation Check
  const dbName = parsed.pathname.replace(/^\//, '');
  if (FORBIDDEN_DATABASES.has(dbName)) {
    throw new Error(
      `[E2E-GUARD-FATAL] Attempted to target forbidden/primary database '${dbName}'! Process aborted.`
    );
  }

  if (dbName !== EXPECTED_E2E_DATABASE) {
    throw new Error(
      `[E2E-GUARD-FATAL] Target database must be '${EXPECTED_E2E_DATABASE}', got: '${dbName}'`
    );
  }

  return {
    hostname,
    port,
    databaseName: dbName,
  };
}
