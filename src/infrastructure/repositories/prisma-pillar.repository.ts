// src/infrastructure/repositories/prisma-pillar.repository.ts
// Infrastructure repository: Prisma implementation for Pillar persistence.
// Preserves exact database IDs, strictly preserves index strings, and implements atomic reordering.

import type { PrismaClient } from '@prisma/client';
import type {
  IPillarRepository,
  CreatePillarData,
  UpdatePillarData,
} from '../../domain/repositories/pillar.repository';
import type { PillarRecord } from '../../domain/entities/pillar-record';
import { PrismaPillarRecordMapper } from '../mappers/prisma-pillar-record.mapper';
import { acquireAdvisoryLock, AdvisoryLockNamespace } from '../utils/advisory-lock';

export class PrismaPillarRepository implements IPillarRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Retrieves all pillars ordered by ascending display order.
   */
  async getAll(): Promise<PillarRecord[]> {
    const records = await this.prisma.pillar.findMany({
      orderBy: { order: 'asc' },
    });
    return records.map(PrismaPillarRecordMapper.toDomain);
  }

  /**
   * Retrieves a single pillar by primary key ID.
   * Returns null if no record matches.
   */
  async getById(id: string): Promise<PillarRecord | null> {
    const record = await this.prisma.pillar.findUnique({
      where: { id },
    });
    if (!record) return null;
    return PrismaPillarRecordMapper.toDomain(record);
  }

  /**
   * Persists a new pillar record.
   * If order is undefined, atomically calculates max(order) + 1 under an advisory lock.
   */
  async create(data: CreatePillarData): Promise<PillarRecord> {
    if (data.order !== undefined) {
      const prismaData = PrismaPillarRecordMapper.toPrismaCreate(data);
      const created = await this.prisma.pillar.create({
        data: prismaData,
      });
      return PrismaPillarRecordMapper.toDomain(created);
    }

    return await this.prisma.$transaction(async (tx) => {
      await acquireAdvisoryLock(tx, AdvisoryLockNamespace.PILLAR, 0);
      const maxOrder = await tx.pillar.aggregate({
        _max: { order: true },
      });
      const nextOrder = (maxOrder._max.order ?? 0) + 1;
      const prismaData = PrismaPillarRecordMapper.toPrismaCreate({
        ...data,
        order: nextOrder,
      });
      const created = await tx.pillar.create({
        data: prismaData,
      });
      return PrismaPillarRecordMapper.toDomain(created);
    });
  }

  /**
   * Updates an existing pillar record by ID.
   * Throws an Error if the pillar does not exist.
   */
  async update(id: string, data: UpdatePillarData): Promise<PillarRecord> {
    const existing = await this.prisma.pillar.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw new Error(`Pillar with ID "${id}" not found.`);
    }

    const prismaUpdate = PrismaPillarRecordMapper.toPrismaUpdate(data);
    const updated = await this.prisma.pillar.update({
      where: { id },
      data: prismaUpdate,
    });
    return PrismaPillarRecordMapper.toDomain(updated);
  }

  /**
   * Deletes an existing pillar record by ID.
   * Throws an Error if the pillar does not exist.
   */
  async delete(id: string): Promise<void> {
    const existing = await this.prisma.pillar.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw new Error(`Pillar with ID "${id}" not found.`);
    }

    await this.prisma.pillar.delete({
      where: { id },
    });
  }

  /**
   * Atomically reorders pillars sequentially starting from order = 1.
   * Strictly preserves index strings and validates ID completeness.
   */
  async reorder(orderedIds: string[]): Promise<void> {
    if (new Set(orderedIds).size !== orderedIds.length) {
      throw new Error('Duplicate IDs found in reorder list.');
    }

    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.pillar.findMany({
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
          throw new Error(`Unknown pillar ID in reorder list: "${id}".`);
        }
      }

      for (let i = 0; i < orderedIds.length; i++) {
        await tx.pillar.update({
          where: { id: orderedIds[i] },
          data: { order: i + 1 },
        });
      }
    });
  }
}
