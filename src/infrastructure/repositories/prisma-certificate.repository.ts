// src/infrastructure/repositories/prisma-certificate.repository.ts
// Infrastructure repository: Prisma implementation for Certificate persistence.
// Uses transaction-scoped PostgreSQL advisory locks for atomic ordering.

import type { PrismaClient } from '@prisma/client';
import type {
  ICertificateRepository,
  CreateCertificateData,
  UpdateCertificateData,
} from '../../domain/repositories/certificate.repository';
import type { Certificate } from '../../domain/entities/certificate';
import { PrismaCertificateMapper } from '../mappers/prisma-certificate.mapper';
import { acquireAdvisoryLock, AdvisoryLockNamespace } from '../utils/advisory-lock';

/**
 * Checks whether an error indicates that the underlying certificates table
 * does not exist in the database (Prisma P2021 error code), traversing
 * down error cause chains if present.
 */
function isTableMissingError(err: unknown): boolean {
  let current: unknown = err;
  let depth = 0;
  while (current && depth <= 5) {
    if (typeof current === 'object' && current !== null) {
      const e = current as { code?: unknown; message?: unknown; cause?: unknown };
      if (e.code === 'P2021') {
        return true;
      }
      if (
        typeof e.message === 'string' &&
        (e.message.includes('P2021') ||
          e.message.includes('table `public`.`certificates` does not exist') ||
          e.message.includes('table `certificates` does not exist') ||
          e.message.includes('relation "certificates" does not exist'))
      ) {
        return true;
      }
      current = e.cause;
      depth++;
    } else {
      break;
    }
  }
  return false;
}

export class PrismaCertificateRepository implements ICertificateRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Retrieves all certificates ordered by ascending display order.
   * Defensively catches P2021 (table missing) and returns an empty array gracefully.
   */
  async findAll(): Promise<Certificate[]> {
    if (!this.prisma.certificate) {
      return [];
    }
    try {
      const records = await this.prisma.certificate.findMany({
        orderBy: { order: 'asc' },
      });
      return records.map(PrismaCertificateMapper.toDomain);
    } catch (err: unknown) {
      if (isTableMissingError(err)) {
        return [];
      }
      throw err;
    }
  }

  /**
   * Alias for findAll.
   * Defensively catches P2021 (table missing) and returns an empty array gracefully.
   */
  async getAll(): Promise<Certificate[]> {
    return this.findAll();
  }

  /**
   * Retrieves a single certificate by primary key ID.
   * Defensively catches P2021 (table missing) and returns null gracefully.
   */
  async findById(id: string): Promise<Certificate | null> {
    if (!this.prisma.certificate) {
      return null;
    }
    try {
      const record = await this.prisma.certificate.findUnique({
        where: { id },
      });
      if (!record) return null;
      return PrismaCertificateMapper.toDomain(record);
    } catch (err: unknown) {
      if (isTableMissingError(err)) {
        return null;
      }
      throw err;
    }
  }

  /**
   * Alias for findById.
   * Defensively catches P2021 (table missing) and returns null gracefully.
   */
  async getById(id: string): Promise<Certificate | null> {
    return this.findById(id);
  }

  /**
   * Persists a new certificate record.
   * If order is undefined, atomically calculates max(order) + 1 under an advisory lock.
   */
  async create(data: CreateCertificateData): Promise<Certificate> {
    if (data.order !== undefined) {
      const prismaData = PrismaCertificateMapper.toPrismaCreate(data);
      const created = await this.prisma.certificate.create({
        data: prismaData,
      });
      return PrismaCertificateMapper.toDomain(created);
    }

    return await this.prisma.$transaction(async (tx) => {
      await acquireAdvisoryLock(tx, AdvisoryLockNamespace.CERTIFICATE, 0);
      const maxOrder = await tx.certificate.aggregate({
        _max: { order: true },
      });
      const nextOrder = (maxOrder._max.order ?? 0) + 1;
      const prismaData = PrismaCertificateMapper.toPrismaCreate({
        ...data,
        order: nextOrder,
      });
      const created = await tx.certificate.create({
        data: prismaData,
      });
      return PrismaCertificateMapper.toDomain(created);
    });
  }

  /**
   * Updates an existing certificate record by ID.
   */
  async update(id: string, data: UpdateCertificateData): Promise<Certificate> {
    const existing = await this.prisma.certificate.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw new Error(`Certificate with ID "${id}" not found.`);
    }

    const prismaUpdate = PrismaCertificateMapper.toPrismaUpdate(data);
    const updated = await this.prisma.certificate.update({
      where: { id },
      data: prismaUpdate,
    });
    return PrismaCertificateMapper.toDomain(updated);
  }

  /**
   * Deletes an existing certificate record by ID.
   */
  async delete(id: string): Promise<void> {
    const existing = await this.prisma.certificate.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw new Error(`Certificate with ID "${id}" not found.`);
    }

    await this.prisma.certificate.delete({
      where: { id },
    });
  }

  /**
   * Atomically reorders certificates sequentially starting from order = 1.
   */
  async reorder(orderedIds: string[]): Promise<void> {
    if (new Set(orderedIds).size !== orderedIds.length) {
      throw new Error('Duplicate IDs found in reorder list.');
    }

    await this.prisma.$transaction(async (tx) => {
      await acquireAdvisoryLock(tx, AdvisoryLockNamespace.CERTIFICATE, 0);

      const existing = await tx.certificate.findMany({
        select: { id: true },
      });

      if (existing.length !== orderedIds.length) {
        throw new Error(
          `Reorder collection size mismatch. Expected ${existing.length} IDs, received ${orderedIds.length}.`
        );
      }

      const existingIdSet = new Set(existing.map((e) => e.id));
      for (const id of orderedIds) {
        if (!existingIdSet.has(id)) {
          throw new Error(`Unknown certificate ID in reorder list: "${id}".`);
        }
      }

      for (let i = 0; i < orderedIds.length; i++) {
        await tx.certificate.update({
          where: { id: orderedIds[i] },
          data: { order: i + 1 },
        });
      }
    });
  }
}
