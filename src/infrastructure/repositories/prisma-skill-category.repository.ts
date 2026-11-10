// src/infrastructure/repositories/prisma-skill-category.repository.ts
// Infrastructure repository: Prisma implementation for SkillCategory persistence.
// Preserves exact database IDs and implements atomic reordering and transactional deletion.

import type { PrismaClient } from '@prisma/client';
import type {
  ISkillCategoryRepository,
  CreateSkillCategoryData,
  UpdateSkillCategoryData,
} from '../../domain/repositories/skill-category.repository';
import type { SkillCategoryRecord } from '../../domain/entities/skill-category-record';
import { PrismaSkillCategoryRecordMapper } from '../mappers/prisma-skill-category-record.mapper';

import {
  acquireAdvisoryLock,
  acquireCategoryAdvisoryLocks,
  AdvisoryLockNamespace,
} from '../utils/advisory-lock';

export class PrismaSkillCategoryRepository implements ISkillCategoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Retrieves all skill categories ordered by display order ascending.
   */
  async getAll(): Promise<SkillCategoryRecord[]> {
    const records = await this.prisma.skillCategory.findMany({
      orderBy: { order: 'asc' },
    });
    return records.map(PrismaSkillCategoryRecordMapper.toDomain);
  }

  /**
   * Retrieves a single skill category by primary key ID.
   * Returns null if no record matches.
   */
  async getById(id: string): Promise<SkillCategoryRecord | null> {
    const record = await this.prisma.skillCategory.findUnique({
      where: { id },
    });
    if (!record) return null;
    return PrismaSkillCategoryRecordMapper.toDomain(record);
  }

  /**
   * Persists a new skill category record.
   * If order is undefined, atomically calculates max(order) + 1 under an advisory lock.
   */
  async create(data: CreateSkillCategoryData): Promise<SkillCategoryRecord> {
    if (data.order !== undefined) {
      const prismaData = PrismaSkillCategoryRecordMapper.toPrismaCreate(data);
      const created = await this.prisma.skillCategory.create({
        data: prismaData,
      });
      return PrismaSkillCategoryRecordMapper.toDomain(created);
    }

    return await this.prisma.$transaction(async (tx) => {
      await acquireAdvisoryLock(tx, AdvisoryLockNamespace.SKILL_CATEGORY, 0);
      const maxOrder = await tx.skillCategory.aggregate({
        _max: { order: true },
      });
      const nextOrder = (maxOrder._max.order ?? 0) + 1;
      const prismaData = PrismaSkillCategoryRecordMapper.toPrismaCreate({
        ...data,
        order: nextOrder,
      });
      const created = await tx.skillCategory.create({
        data: prismaData,
      });
      return PrismaSkillCategoryRecordMapper.toDomain(created);
    });
  }

  /**
   * Updates an existing skill category record by ID.
   * Throws an Error if the category does not exist.
   */
  async update(id: string, data: UpdateSkillCategoryData): Promise<SkillCategoryRecord> {
    const existing = await this.prisma.skillCategory.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw new Error(`Skill category with ID "${id}" not found.`);
    }

    const prismaUpdate = PrismaSkillCategoryRecordMapper.toPrismaUpdate(data);
    const updated = await this.prisma.skillCategory.update({
      where: { id },
      data: prismaUpdate,
    });
    return PrismaSkillCategoryRecordMapper.toDomain(updated);
  }

  /**
   * Deletes an existing skill category record by ID within a transaction.
   * Concurrency-safe: acquires category advisory lock, re-verifies child count against expectedChildCount,
   * and aborts if any concurrent modification occurred before proceeding with cascade deletion.
   */
  async delete(id: string, expectedChildCount?: number): Promise<void> {
    if (
      expectedChildCount === undefined ||
      expectedChildCount === null ||
      typeof expectedChildCount !== 'number' ||
      !Number.isInteger(expectedChildCount) ||
      expectedChildCount < 0
    ) {
      throw new Error('Expected child skill count is required for category deletion.');
    }

    await this.prisma.$transaction(async (tx) => {
      await acquireCategoryAdvisoryLocks(tx, id);

      const existing = await tx.skillCategory.findUnique({
        where: { id },
        select: { id: true },
      });
      if (!existing) {
        throw new Error(`Skill category with ID "${id}" not found.`);
      }

      const currentSkillCount = await tx.skill.count({
        where: { categoryId: id },
      });

      if (currentSkillCount !== expectedChildCount) {
        throw new Error(
          `Child skill count mismatch. Expected ${expectedChildCount}, but found ${currentSkillCount}. Deletion aborted for safety.`
        );
      }

      await tx.skillCategory.delete({
        where: { id },
      });
    });
  }

  /**
   * Atomically reorders skill categories sequentially starting from order = 1.
   * Validates duplicate, missing, and foreign IDs inside the transaction.
   */
  async reorder(orderedIds: string[]): Promise<void> {
    if (new Set(orderedIds).size !== orderedIds.length) {
      throw new Error('Duplicate IDs found in reorder list.');
    }

    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.skillCategory.findMany({
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
          throw new Error(`Unknown skill category ID in reorder list: "${id}".`);
        }
      }

      for (let i = 0; i < orderedIds.length; i++) {
        await tx.skillCategory.update({
          where: { id: orderedIds[i] },
          data: { order: i + 1 },
        });
      }
    });
  }
}
