// src/infrastructure/prisma/client.ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
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

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('[PrismaClient] DATABASE_URL is not set in environment.');
  }

  const isSsl =
    connectionString.includes('sslmode=require') ||
    connectionString.includes('supabase') ||
    connectionString.includes('pooler.supabase.com');

  const adapter = new PrismaPg({
    connectionString,
    ssl: isSsl ? { rejectUnauthorized: false } : undefined,
  });
  const client = new PrismaClient({
    adapter,
    log: process.env.DEBUG_PRISMA === 'true' ? ['query', 'error', 'warn'] : ['error'],
  });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
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
