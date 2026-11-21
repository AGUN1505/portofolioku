// src/infrastructure/prisma/client.ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

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

  let connectionString = rawConnectionString;
  let isSsl = false;

  try {
    const url = new URL(rawConnectionString);
    const sslmode = url.searchParams.get('sslmode');
    const isSupabase =
      url.hostname.includes('supabase.co') ||
      url.hostname.includes('supabase.com') ||
      url.hostname.includes('pooler.supabase.com');

    if (sslmode || isSupabase) {
      isSsl = true;
      // Using 'no-verify' ensures pg-connection-string configures { rejectUnauthorized: false },
      // preventing TLS self-signed cert chain verification rejection on Supabase pooler.
      url.searchParams.set('sslmode', 'no-verify');
      connectionString = url.toString();
    }
  } catch {
    isSsl =
      rawConnectionString.includes('sslmode=require') ||
      rawConnectionString.includes('supabase') ||
      rawConnectionString.includes('pooler.supabase.com');
  }

  const pool =
    globalForPrisma.pgPool ??
    new pg.Pool({
      connectionString,
      ssl: isSsl ? { rejectUnauthorized: false } : undefined,
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

