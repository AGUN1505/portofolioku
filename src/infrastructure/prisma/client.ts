// src/infrastructure/prisma/client.ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// Bypass TLS verification for cloud database poolers with self-signed certificate chains (Supabase pooler)
if (typeof process !== 'undefined' && process.env) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: pg.Pool | undefined;
};

export function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    if (
      !('certificate' in globalForPrisma.prisma) ||
      !('sectionConfig' in globalForPrisma.prisma)
    ) {
      globalForPrisma.prisma = undefined;
    } else {
      return globalForPrisma.prisma;
    }
  }

  const rawConnectionString = process.env.DATABASE_URL;
  if (!rawConnectionString) {
    throw new Error('[PrismaClient] DATABASE_URL is not set in environment.');
  }

  // Ensure Node TLS does not reject Supabase pooler certificate chain
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  // Replace any sslmode with 'no-verify' using regex to avoid URL parsing issues with special password characters
  let connectionString = rawConnectionString
    .replace(/sslmode=(require|prefer|verify-ca|verify-full)/gi, 'sslmode=no-verify')
    .replace(/&?uselibpqcompat=(true|false)/gi, '');

  if (!connectionString.includes('sslmode=')) {
    connectionString += (connectionString.includes('?') ? '&' : '?') + 'sslmode=no-verify';
  }

  const pool =
    globalForPrisma.pgPool ??
    new pg.Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });

  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({
    adapter,
    log: process.env.DEBUG_PRISMA === 'true' ? ['query', 'error', 'warn'] : ['error'],
  });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
    globalForPrisma.pgPool = pool;
  }

  return client;
}

// Transparent lazy Proxy singleton
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});


