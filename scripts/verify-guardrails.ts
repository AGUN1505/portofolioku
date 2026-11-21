/**
 * @deprecated Legacy Stage 10.2.2 staging verification script (FINDING-5.5.6-02).
 *
 * WARNING — PRODUCTION DATABASE ACCESS:
 * This script explicitly loads `.env.local` and connects to the live PostgreSQL
 * database (`porto_cms`). It asserts `admins === 0` and `contact_channels === 0`
 * from the initial Stage 10.2.2 seed baseline and MUST NEVER be executed during
 * isolated E2E test runs or without explicit written user authorization.
 */
// scripts/verify-guardrails.ts
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import * as assert from 'node:assert';
import { prisma } from '../src/infrastructure/prisma/client';

async function check() {
  console.log('--- GUARDRAILS AUDIT ---');
  // 1. Admin count
  const adminCount = await prisma.admin.count();
  console.log(`admins row count: ${adminCount}`);
  assert.equal(adminCount, 0, 'Admin table must have 0 rows in Stage 10.2.2');

  // 2. ContactChannel count
  const channelCount = await prisma.contactChannel.count();
  console.log(`contact_channels row count: ${channelCount}`);
  assert.equal(channelCount, 0, 'ContactChannel table must have 0 rows in Stage 10.2.2');

  // 3. Current connected DB
  const [currentDb] = await prisma.$queryRaw<Array<{ current_database: string }>>`
    SELECT current_database();
  `;
  console.log(`connected database: ${currentDb.current_database}`);
  assert.equal(currentDb.current_database, 'porto_cms', 'Connected DB must be porto_cms');

  // 4. Verify 8 other Laragon databases exist and untouched
  const otherDbs = await prisma.$queryRaw<Array<{ datname: string }>>`
    SELECT datname FROM pg_database WHERE datname NOT IN ('postgres') AND datistemplate = false ORDER BY datname;
  `;
  const dbNames = otherDbs.map((d) => d.datname);
  console.log('databases present on cluster:', dbNames);
  const requiredDbs = [
    'db_unm',
    'fashiondb',
    'padekinapp',
    'pesantren',
    'porto_cms',
    'powerteam',
    'powerteamm',
    'tkunh_user_service',
  ];
  for (const name of requiredDbs) {
    assert.ok(dbNames.includes(name), `Database ${name} must remain present`);
  }

  console.log('--- ALL GUARDRAILS VERIFIED (ZERO VIOLATIONS) ---');
  await prisma.$disconnect();
}

check().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
