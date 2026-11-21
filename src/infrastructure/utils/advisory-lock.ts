// src/infrastructure/utils/advisory-lock.ts
// Centralized transaction-scoped PostgreSQL advisory locking utility.
// Guarantees concurrency isolation and deadlock-free operation across ordered collections
// and relational parent-child boundaries.

export const AdvisoryLockNamespace = {
  ROLE: 1001,
  ENGINEERING_NODE: 1002,
  DOMAIN: 1003,
  PILLAR: 1004,
  SKILL_CATEGORY: 1005,
  PROJECT: 1006,
  EXPERIENCE: 1007,
  SKILL: 1008,
  CONTACT_CHANNEL: 1009,
  CERTIFICATE: 1010,
  SECTION_CONFIG: 1011,
  CATEGORY_CHILDREN: 2001,
} as const;

export type AdvisoryLockNamespace =
  (typeof AdvisoryLockNamespace)[keyof typeof AdvisoryLockNamespace];

/**
 * Computes a stable, non-negative 31-bit integer hash from a string key.
 * Used to derive objid for pg_advisory_xact_lock(int4, int4).
 */
export function hashStringToPositiveInt32(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i);
    hash = hash & 0x7fffffff;
  }
  return hash;
}

/**
 * Acquires a transaction-scoped PostgreSQL advisory lock (pg_advisory_xact_lock).
 * The lock is automatically released by PostgreSQL when the enclosing transaction commits or rolls back.
 * If running in a mock/test environment without $executeRawUnsafe, gracefully acts as a no-op.
 *
 * @param tx The active transaction client (Prisma TransactionClient or mock).
 * @param namespace The 32-bit namespace integer.
 * @param key Either a 32-bit integer or a string key that will be deterministically hashed.
 */
export async function acquireAdvisoryLock(
  tx: { $executeRawUnsafe?: (query: string, ...values: unknown[]) => Promise<unknown> },
  namespace: AdvisoryLockNamespace,
  key: number | string = 0
): Promise<void> {
  if (typeof tx.$executeRawUnsafe !== 'function') {
    return;
  }
  const keyInt = typeof key === 'number' ? key & 0x7fffffff : hashStringToPositiveInt32(key);
  await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${namespace}, ${keyInt})`);
}

/**
 * Acquires transaction-scoped category locks for one or more category IDs in deterministic
 * (lexicographical) order to mathematically prevent concurrent deadlocks.
 *
 * @param tx The active transaction client.
 * @param categoryIds Single category ID or array of category IDs.
 */
export async function acquireCategoryAdvisoryLocks(
  tx: { $executeRawUnsafe?: (query: string, ...values: unknown[]) => Promise<unknown> },
  categoryIds: string | string[]
): Promise<void> {
  const ids = Array.isArray(categoryIds) ? categoryIds : [categoryIds];
  const uniqueSorted = Array.from(new Set(ids.filter((id) => Boolean(id)))).sort();
  for (const catId of uniqueSorted) {
    await acquireAdvisoryLock(tx, AdvisoryLockNamespace.CATEGORY_CHILDREN, catId);
  }
}
