// src/infrastructure/repositories/prisma-domain.repository.ts
// Infrastructure repository: Prisma implementation for Domain persistence.
// Preserves exact database IDs, strictly preserves index strings, and implements atomic reordering.

import type { PrismaClient } from '@prisma/client';
import type {
  IDomainRepository,
  CreateDomainData,
  UpdateDomainData,
} from '../../domain/repositories/domain.repository';
import type { DomainRecord } from '../../domain/entities/domain-record';
import { PrismaDomainRecordMapper } from '../mappers/prisma-domain-record.mapper';
import { acquireAdvisoryLock, AdvisoryLockNamespace } from '../utils/advisory-lock';

export class PrismaDomainRepository implements IDomainRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Retrieves all domains ordered by ascending display order.
   */
  async getAll(): Promise<DomainRecord[]> {
    const records = await this.prisma.domain.findMany({
      orderBy: { order: 'asc' },
    });
    return records.map(PrismaDomainRecordMapper.toDomain);
  }

  /**
   * Retrieves a single domain by primary key ID.
   * Returns null if no record matches.
   */
  async getById(id: string): Promise<DomainRecord | null> {
    const record = await this.prisma.domain.findUnique({
      where: { id },
    });
    if (!record) return null;
    return PrismaDomainRecordMapper.toDomain(record);
  }

  /**
   * Persists a new domain record.
   * If order is undefined, atomically calculates max(order) + 1 under an advisory lock.
   */
  async create(data: CreateDomainData): Promise<DomainRecord> {
    if (data.order !== undefined) {
      const prismaData = PrismaDomainRecordMapper.toPrismaCreate(data);
      const created = await this.prisma.domain.create({
        data: prismaData,
      });
      return PrismaDomainRecordMapper.toDomain(created);
    }

    return await this.prisma.$transaction(async (tx) => {
      await acquireAdvisoryLock(tx, AdvisoryLockNamespace.DOMAIN, 0);
      const maxOrder = await tx.domain.aggregate({
        _max: { order: true },
      });
      const nextOrder = (maxOrder._max.order ?? 0) + 1;
      const prismaData = PrismaDomainRecordMapper.toPrismaCreate({
        ...data,
        order: nextOrder,
      });
      const created = await tx.domain.create({
        data: prismaData,
      });
      return PrismaDomainRecordMapper.toDomain(created);
    });
  }

  /**
   * Updates an existing domain record by ID.
   * Throws an Error if the domain does not exist.
   */
  async update(id: string, data: UpdateDomainData): Promise<DomainRecord> {
    const existing = await this.prisma.domain.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw new Error(`Domain with ID "${id}" not found.`);
    }

    const prismaUpdate = PrismaDomainRecordMapper.toPrismaUpdate(data);
    const updated = await this.prisma.domain.update({
      where: { id },
      data: prismaUpdate,
    });
    return PrismaDomainRecordMapper.toDomain(updated);
  }

  /**
   * Deletes an existing domain record by ID.
   * Throws an Error if the domain does not exist.
   */
  async delete(id: string): Promise<void> {
    const existing = await this.prisma.domain.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw new Error(`Domain with ID "${id}" not found.`);
    }

    await this.prisma.domain.delete({
      where: { id },
    });
  }

  /**
   * Atomically reorders domains sequentially starting from order = 1.
   * Strictly preserves index strings and validates ID completeness.
   */
  async reorder(orderedIds: string[]): Promise<void> {
    if (new Set(orderedIds).size !== orderedIds.length) {
      throw new Error('Duplicate IDs found in reorder list.');
    }

    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.domain.findMany({
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
          throw new Error(`Unknown domain ID in reorder list: "${id}".`);
        }
      }

      for (let i = 0; i < orderedIds.length; i++) {
        await tx.domain.update({
          where: { id: orderedIds[i] },
          data: { order: i + 1 },
        });
      }
    });
  }
}
