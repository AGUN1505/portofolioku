// src/infrastructure/repositories/prisma-experience.repository.ts
// Infrastructure repository: Prisma implementation for Experience persistence.
// Preserves exact database IDs and implements atomic reordering.

import type { PrismaClient } from '@prisma/client';
import type {
  IExperienceRepository,
  CreateExperienceData,
  UpdateExperienceData,
} from '../../domain/repositories/experience.repository';
import type { ExperienceRecord } from '../../domain/entities/experience-record';
import { PrismaExperienceRecordMapper } from '../mappers/prisma-experience-record.mapper';
import { acquireAdvisoryLock, AdvisoryLockNamespace } from '../utils/advisory-lock';

export class PrismaExperienceRepository implements IExperienceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Retrieves all experiences ordered by ascending display order.
   * Exact primary key IDs (e.g. 'exp_01') are preserved.
   */
  async getAll(): Promise<ExperienceRecord[]> {
    const records = await this.prisma.experience.findMany({
      orderBy: { order: 'asc' },
    });
    return records.map(PrismaExperienceRecordMapper.toDomain);
  }

  /**
   * Retrieves a single experience by primary key ID.
   * Returns null if no record matches.
   */
  async getById(id: string): Promise<ExperienceRecord | null> {
    const record = await this.prisma.experience.findUnique({
      where: { id },
    });
    if (!record) return null;
    return PrismaExperienceRecordMapper.toDomain(record);
  }

  /**
   * Persists a new experience record.
   * If order is undefined, atomically calculates max(order) + 1 under an advisory lock.
   */
  async create(data: CreateExperienceData): Promise<ExperienceRecord> {
    if (data.order !== undefined) {
      const prismaData = PrismaExperienceRecordMapper.toPrismaCreate(data);
      const created = await this.prisma.experience.create({
        data: prismaData,
      });
      return PrismaExperienceRecordMapper.toDomain(created);
    }

    return await this.prisma.$transaction(async (tx) => {
      await acquireAdvisoryLock(tx, AdvisoryLockNamespace.EXPERIENCE, 0);
      const maxOrder = await tx.experience.aggregate({
        _max: { order: true },
      });
      const nextOrder = (maxOrder._max.order ?? 0) + 1;
      const prismaData = PrismaExperienceRecordMapper.toPrismaCreate({
        ...data,
        order: nextOrder,
      });
      const created = await tx.experience.create({
        data: prismaData,
      });
      return PrismaExperienceRecordMapper.toDomain(created);
    });
  }

  /**
   * Updates an existing experience record by ID.
   * Throws an Error if the experience does not exist.
   */
  async update(id: string, data: UpdateExperienceData): Promise<ExperienceRecord> {
    const existing = await this.prisma.experience.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw new Error(`Experience with ID "${id}" not found.`);
    }

    const prismaUpdate = PrismaExperienceRecordMapper.toPrismaUpdate(data);
    const updated = await this.prisma.experience.update({
      where: { id },
      data: prismaUpdate,
    });
    return PrismaExperienceRecordMapper.toDomain(updated);
  }

  /**
   * Deletes an existing experience record by ID.
   * Throws an Error if the experience does not exist.
   */
  async delete(id: string): Promise<void> {
    const existing = await this.prisma.experience.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw new Error(`Experience with ID "${id}" not found.`);
    }

    await this.prisma.experience.delete({
      where: { id },
    });
  }

  /**
   * Atomically reorders experiences sequentially starting from order = 1.
   * Validates duplicate, missing, and foreign IDs inside the transaction.
   */
  async reorder(orderedIds: string[]): Promise<void> {
    // 1. Check for duplicates in input
    if (new Set(orderedIds).size !== orderedIds.length) {
      throw new Error('Duplicate IDs found in reorder list.');
    }

    await this.prisma.$transaction(async (tx) => {
      // 2. Fetch current IDs in target collection
      const existing = await tx.experience.findMany({
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
          throw new Error(`Unknown experience ID in reorder list: "${id}".`);
        }
      }

      // 3. Atomically update sequential order values from 1
      for (let i = 0; i < orderedIds.length; i++) {
        await tx.experience.update({
          where: { id: orderedIds[i] },
          data: { order: i + 1 },
        });
      }
    });
  }
}
