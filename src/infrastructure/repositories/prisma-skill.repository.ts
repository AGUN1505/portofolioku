// src/infrastructure/repositories/prisma-skill.repository.ts
// Infrastructure repository: Prisma implementation for Skill persistence.
// Preserves exact database IDs, enforces category scoping, and implements atomic reordering.

import type { PrismaClient } from '@prisma/client';
import type {
  ISkillRepository,
  CreateSkillData,
  UpdateSkillData,
} from '../../domain/repositories/skill.repository';
import type { SkillRecord } from '../../domain/entities/skill-record';
import { PrismaSkillRecordMapper } from '../mappers/prisma-skill-record.mapper';
import { acquireCategoryAdvisoryLocks } from '../utils/advisory-lock';

export class PrismaSkillRepository implements ISkillRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Retrieves all skills ordered by ascending display order.
   */
  async getAll(): Promise<SkillRecord[]> {
    const records = await this.prisma.skill.findMany({
      orderBy: { order: 'asc' },
    });
    return records.map(PrismaSkillRecordMapper.toDomain);
  }

  /**
   * Retrieves a single skill by primary key ID.
   * Returns null if no record matches.
   */
  async getById(id: string): Promise<SkillRecord | null> {
    const record = await this.prisma.skill.findUnique({
      where: { id },
    });
    if (!record) return null;
    return PrismaSkillRecordMapper.toDomain(record);
  }

  /**
   * Retrieves all skills belonging to a specific category ordered by ascending display order.
   */
  async getByCategoryId(categoryId: string): Promise<SkillRecord[]> {
    const records = await this.prisma.skill.findMany({
      where: { categoryId },
      orderBy: { order: 'asc' },
    });
    return records.map(PrismaSkillRecordMapper.toDomain);
  }

  /**
   * Counts the number of skills belonging to a specific category.
   */
  async countByCategoryId(categoryId: string): Promise<number> {
    return await this.prisma.skill.count({
      where: { categoryId },
    });
  }

  /**
   * Persists a new skill record within a transaction.
   * Concurrency-safe: acquires category advisory lock, and atomically calculates max(order) + 1 if order is omitted.
   */
  async create(data: CreateSkillData): Promise<SkillRecord> {
    return await this.prisma.$transaction(async (tx) => {
      await acquireCategoryAdvisoryLocks(tx, data.categoryId);

      let order = data.order;
      if (order === undefined) {
        const maxOrderResult = await tx.skill.aggregate({
          where: { categoryId: data.categoryId },
          _max: { order: true },
        });
        order = (maxOrderResult._max.order ?? 0) + 1;
      }

      const prismaData = PrismaSkillRecordMapper.toPrismaCreate({
        ...data,
        order,
      });
      const created = await tx.skill.create({
        data: prismaData,
      });
      return PrismaSkillRecordMapper.toDomain(created);
    });
  }

  /**
   * Updates an existing skill record by ID.
   * Concurrency-safe: detects relocation across categories.
   * For relocation: acquires locks for both source and destination in deterministic order,
   * compacts source category order to 1..N, and assigns valid order in destination.
   */
  async update(id: string, data: UpdateSkillData): Promise<SkillRecord> {
    return await this.prisma.$transaction(async (tx) => {
      const existing = await tx.skill.findUnique({
        where: { id },
        select: { id: true, categoryId: true, order: true },
      });
      if (!existing) {
        throw new Error(`Skill with ID "${id}" not found.`);
      }

      const isRelocation =
        data.categoryId !== undefined && data.categoryId !== existing.categoryId;

      if (!isRelocation) {
        await acquireCategoryAdvisoryLocks(tx, existing.categoryId);
        const prismaUpdate = PrismaSkillRecordMapper.toPrismaUpdate(data);
        const updated = await tx.skill.update({
          where: { id },
          data: prismaUpdate,
        });
        return PrismaSkillRecordMapper.toDomain(updated);
      }

      const sourceCatId = existing.categoryId;
      const destCatId = data.categoryId!;

      // 1. Acquire advisory locks deterministically
      await acquireCategoryAdvisoryLocks(tx, [sourceCatId, destCatId]);

      // 2. Verify destination category exists
      const destCat = await tx.skillCategory.findUnique({
        where: { id: destCatId },
        select: { id: true },
      });
      if (!destCat) {
        throw new Error(`Target skill category with ID "${destCatId}" not found.`);
      }

      // 3. Determine order in destination category
      let destOrder = data.order;
      if (destOrder === undefined) {
        const maxDestOrder = await tx.skill.aggregate({
          where: { categoryId: destCatId },
          _max: { order: true },
        });
        destOrder = (maxDestOrder._max.order ?? 0) + 1;
      }

      // 4. Update skill to new category and new order
      const prismaUpdate = PrismaSkillRecordMapper.toPrismaUpdate({
        ...data,
        order: destOrder,
      });
      const updated = await tx.skill.update({
        where: { id },
        data: prismaUpdate,
      });

      // 5. Compact remaining skills in source category to contiguous 1..N
      const remainingSourceSkills = await tx.skill.findMany({
        where: { categoryId: sourceCatId },
        orderBy: { order: 'asc' },
        select: { id: true },
      });
      for (let i = 0; i < remainingSourceSkills.length; i++) {
        await tx.skill.update({
          where: { id: remainingSourceSkills[i].id },
          data: { order: i + 1 },
        });
      }

      return PrismaSkillRecordMapper.toDomain(updated);
    });
  }

  /**
   * Deletes an existing skill record by ID within a transaction.
   * Compacts remaining skills in the category to maintain contiguous ordering.
   */
  async delete(id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.skill.findUnique({
        where: { id },
        select: { id: true, categoryId: true },
      });
      if (!existing) {
        throw new Error(`Skill with ID "${id}" not found.`);
      }

      await acquireCategoryAdvisoryLocks(tx, existing.categoryId);

      await tx.skill.delete({
        where: { id },
      });

      const remaining = await tx.skill.findMany({
        where: { categoryId: existing.categoryId },
        orderBy: { order: 'asc' },
        select: { id: true },
      });
      for (let i = 0; i < remaining.length; i++) {
        await tx.skill.update({
          where: { id: remaining[i].id },
          data: { order: i + 1 },
        });
      }
    });
  }

  /**
   * Atomically reorders skills belonging strictly to the specified category.
   * Validates duplicate, missing, foreign, and category membership inside the transaction.
   */
  async reorder(categoryId: string, orderedIds: string[]): Promise<void> {
    if (new Set(orderedIds).size !== orderedIds.length) {
      throw new Error('Duplicate IDs found in reorder list.');
    }

    await this.prisma.$transaction(async (tx) => {
      await acquireCategoryAdvisoryLocks(tx, categoryId);

      // 1. Verify category exists
      const category = await tx.skillCategory.findUnique({
        where: { id: categoryId },
        select: { id: true },
      });
      if (!category) {
        throw new Error(`Skill category with ID "${categoryId}" not found.`);
      }

      // 2. Fetch all skills belonging to this category
      const existing = await tx.skill.findMany({
        where: { categoryId },
        select: { id: true },
      });

      if (existing.length !== orderedIds.length) {
        throw new Error(
          `Reorder collection size mismatch for category "${categoryId}". Expected ${existing.length} IDs, received ${orderedIds.length}.`
        );
      }

      const existingIdSet = new Set(existing.map((s) => s.id));
      for (const id of orderedIds) {
        if (!existingIdSet.has(id)) {
          throw new Error(`Skill ID "${id}" does not belong to category "${categoryId}".`);
        }
      }

      // 3. Atomically update sequential order values from 1
      for (let i = 0; i < orderedIds.length; i++) {
        await tx.skill.update({
          where: { id: orderedIds[i] },
          data: { order: i + 1 },
        });
      }
    });
  }
}
