// scripts/test-certificates-defensive-p2021.ts
// Verification script for defensive P2021 handling and live database queries on certificates

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { strict as assert } from 'node:assert';
import { prisma } from '../src/infrastructure/prisma/client';
import { PrismaCertificateRepository } from '../src/infrastructure/repositories/prisma-certificate.repository';
import type { PrismaClient } from '@prisma/client';

async function main(): Promise<void> {
  console.log('================================================================');
  console.log('   VERIFY DEFENSIVE P2021 CATCH & CERTIFICATES LIVE QUERIES     ');
  console.log('================================================================\n');

  // Test Suite 1: Live PostgreSQL DB Queries
  console.log('1. Testing Live Database Queries on porto_cms...');
  {
    const repo = new PrismaCertificateRepository(prisma);

    // 1.1: Verify table exists by direct raw query
    const tableCheck = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public' AND tablename = 'certificates';
    `;
    assert.strictEqual(tableCheck.length, 1, 'Table "certificates" must exist in postgresql database porto_cms');
    console.log('   ✓ Verified "certificates" table exists in postgresql porto_cms.');

    // 1.2: repo.findAll() live query
    const allCerts = await repo.findAll();
    assert.ok(Array.isArray(allCerts), 'findAll must return an array');
    console.log(`   ✓ repo.findAll() returned ${allCerts.length} certificates with zero errors.`);

    // 1.3: repo.getAll() live query
    const allCertsAlias = await repo.getAll();
    assert.ok(Array.isArray(allCertsAlias), 'getAll must return an array');
    assert.strictEqual(allCertsAlias.length, allCerts.length);
    console.log(`   ✓ repo.getAll() returned ${allCertsAlias.length} certificates with zero errors.`);

    // 1.4: repo.findById() live query with non-existent ID
    const notFound = await repo.findById('non-existent-cuid');
    assert.strictEqual(notFound, null, 'findById for non-existent record must return null');
    console.log('   ✓ repo.findById("non-existent-cuid") returned null with zero errors.');

    // 1.5: repo.getById() live query with non-existent ID
    const notFoundAlias = await repo.getById('non-existent-cuid');
    assert.strictEqual(notFoundAlias, null, 'getById for non-existent record must return null');
    console.log('   ✓ repo.getById("non-existent-cuid") returned null with zero errors.');
  }

  // Test Suite 2: Defensive P2021 Error Handling (Simulation)
  console.log('\n2. Testing Defensive P2021 (table missing) Handling...');
  {
    const p2021Error = Object.assign(new Error('The table `public`.`certificates` does not exist in the current database.'), {
      code: 'P2021',
      clientVersion: '7.10.1',
    });

    const mockPrismaMissingTable = {
      certificate: {
        findMany: async () => {
          throw p2021Error;
        },
        findUnique: async () => {
          throw p2021Error;
        },
      },
    } as unknown as PrismaClient;

    const defensiveRepo = new PrismaCertificateRepository(mockPrismaMissingTable);

    // 2.1: findAll returns empty array on P2021
    const findAllResult = await defensiveRepo.findAll();
    assert.deepStrictEqual(findAllResult, [], 'findAll must return empty array on P2021');
    console.log('   ✓ repo.findAll() gracefully caught P2021 and returned []');

    // 2.2: getAll returns empty array on P2021
    const getAllResult = await defensiveRepo.getAll();
    assert.deepStrictEqual(getAllResult, [], 'getAll must return empty array on P2021');
    console.log('   ✓ repo.getAll() gracefully caught P2021 and returned []');

    // 2.3: findById returns null on P2021
    const findByIdResult = await defensiveRepo.findById('any-id');
    assert.strictEqual(findByIdResult, null, 'findById must return null on P2021');
    console.log('   ✓ repo.findById() gracefully caught P2021 and returned null');

    // 2.4: getById returns null on P2021
    const getByIdResult = await defensiveRepo.getById('any-id');
    assert.strictEqual(getByIdResult, null, 'getById must return null on P2021');
    console.log('   ✓ repo.getById() gracefully caught P2021 and returned null');
  }

  // Test Suite 3: Nested Cause P2021 Error
  console.log('\n3. Testing Nested Cause P2021 Error Handling...');
  {
    const wrappedError = new Error('Database operation failed', {
      cause: { code: 'P2021', message: 'Table certificates missing' },
    });

    const mockPrismaWrapped = {
      certificate: {
        findMany: async () => {
          throw wrappedError;
        },
        findUnique: async () => {
          throw wrappedError;
        },
      },
    } as unknown as PrismaClient;

    const wrappedRepo = new PrismaCertificateRepository(mockPrismaWrapped);
    const resultAll = await wrappedRepo.findAll();
    assert.deepStrictEqual(resultAll, []);
    const resultSingle = await wrappedRepo.findById('id-1');
    assert.strictEqual(resultSingle, null);
    console.log('   ✓ Nested error cause with P2021 handled gracefully.');
  }

  // Test Suite 4: Missing prisma.certificate Delegate (Undefined)
  console.log('\n4. Testing Undefined prisma.certificate Delegate...');
  {
    const mockPrismaNoDelegate = {} as unknown as PrismaClient;
    const noDelegateRepo = new PrismaCertificateRepository(mockPrismaNoDelegate);

    const resultAll = await noDelegateRepo.findAll();
    assert.deepStrictEqual(resultAll, []);
    const resultSingle = await noDelegateRepo.findById('id-1');
    assert.strictEqual(resultSingle, null);
    console.log('   ✓ Undefined prisma.certificate delegate handled gracefully.');
  }

  // Test Suite 5: Non-P2021 Errors Are NOT Swallowed
  console.log('\n5. Testing That Non-P2021 Errors Are Propagated...');
  {
    const connectionError = Object.assign(new Error("Can't reach database server at localhost:5432"), {
      code: 'P1001',
    });

    const mockPrismaConnFail = {
      certificate: {
        findMany: async () => {
          throw connectionError;
        },
        findUnique: async () => {
          throw connectionError;
        },
      },
    } as unknown as PrismaClient;

    const connFailRepo = new PrismaCertificateRepository(mockPrismaConnFail);

    let threwFindAll = false;
    try {
      await connFailRepo.findAll();
    } catch (err: unknown) {
      threwFindAll = true;
      assert.strictEqual((err as { code: string }).code, 'P1001');
    }
    assert.ok(threwFindAll, 'Non-P2021 error in findAll must be re-thrown');

    let threwFindById = false;
    try {
      await connFailRepo.findById('any-id');
    } catch (err: unknown) {
      threwFindById = true;
      assert.strictEqual((err as { code: string }).code, 'P1001');
    }
    assert.ok(threwFindById, 'Non-P2021 error in findById must be re-thrown');

    console.log('   ✓ Non-P2021 errors (e.g. P1001 connection error) properly propagate.');
  }

  console.log('\n================================================================');
  console.log('   ✅ ALL VERIFICATION CHECKS PASSED WITH ZERO ERRORS           ');
  console.log('================================================================\n');
}

main()
  .catch((err) => {
    console.error('Test execution failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
