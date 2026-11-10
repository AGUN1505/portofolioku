// src/infrastructure/repositories/prisma-project.repository.ts
// Infrastructure repository: Prisma implementation for Project persistence.
// Preserves exact database IDs and implements atomic reordering.

import type { PrismaClient } from '@prisma/client';
import type {
  IProjectRepository,
  CreateProjectData,
  UpdateProjectData,
} from '../../domain/repositories/project.repository';
import type { ProjectRecord } from '../../domain/entities/project-record';
import { PrismaProjectRecordMapper } from '../mappers/prisma-project-record.mapper';
import { acquireAdvisoryLock, AdvisoryLockNamespace } from '../utils/advisory-lock';

export class PrismaProjectRepository implements IProjectRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Retrieves all projects ordered by ascending display order.
   * Exact primary key IDs (e.g. 'project_01') are preserved.
   */
  async getAll(): Promise<ProjectRecord[]> {
    const records = await this.prisma.project.findMany({
      orderBy: { order: 'asc' },
    });
    return records.map(PrismaProjectRecordMapper.toDomain);
  }

  /**
   * Retrieves a single project by primary key ID.
   * Returns null if no record matches.
   */
  async getById(id: string): Promise<ProjectRecord | null> {
    const record = await this.prisma.project.findUnique({
      where: { id },
    });
    if (!record) return null;
    return PrismaProjectRecordMapper.toDomain(record);
  }

  /**
   * Persists a new project record.
   * If order is undefined, atomically calculates max(order) + 1 under an advisory lock.
   */
  async create(data: CreateProjectData): Promise<ProjectRecord> {
    if (data.order !== undefined) {
      const prismaData = PrismaProjectRecordMapper.toPrismaCreate(data);
      const created = await this.prisma.project.create({
        data: prismaData,
      });
      return PrismaProjectRecordMapper.toDomain(created);
    }

    return await this.prisma.$transaction(async (tx) => {
      await acquireAdvisoryLock(tx, AdvisoryLockNamespace.PROJECT, 0);
      const maxOrder = await tx.project.aggregate({
        _max: { order: true },
      });
      const nextOrder = (maxOrder._max.order ?? 0) + 1;
      const prismaData = PrismaProjectRecordMapper.toPrismaCreate({
        ...data,
        order: nextOrder,
      });
      const created = await tx.project.create({
        data: prismaData,
      });
      return PrismaProjectRecordMapper.toDomain(created);
    });
  }

  /**
   * Updates an existing project record by ID.
   * Throws an Error if the project does not exist.
   */
  async update(id: string, data: UpdateProjectData): Promise<ProjectRecord> {
    const existing = await this.prisma.project.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw new Error(`Project with ID "${id}" not found.`);
    }

    const prismaUpdate = PrismaProjectRecordMapper.toPrismaUpdate(data);
    const updated = await this.prisma.project.update({
      where: { id },
      data: prismaUpdate,
    });
    return PrismaProjectRecordMapper.toDomain(updated);
  }

  /**
   * Deletes an existing project record by ID.
   * Throws an Error if the project does not exist.
   */
  async delete(id: string): Promise<void> {
    const existing = await this.prisma.project.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw new Error(`Project with ID "${id}" not found.`);
    }

    await this.prisma.project.delete({
      where: { id },
    });
  }

  /**
   * Atomically reorders projects sequentially starting from order = 1.
   * Validates duplicate, missing, and foreign IDs inside the transaction.
   */
  async reorder(orderedIds: string[]): Promise<void> {
    // 1. Check for duplicates in input
    if (new Set(orderedIds).size !== orderedIds.length) {
      throw new Error('Duplicate IDs found in reorder list.');
    }

    await this.prisma.$transaction(async (tx) => {
      // 2. Fetch current IDs in target collection
      const existing = await tx.project.findMany({
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
          throw new Error(`Unknown project ID in reorder list: "${id}".`);
        }
      }

      // 3. Atomically update sequential order values from 1
      for (let i = 0; i < orderedIds.length; i++) {
        await tx.project.update({
          where: { id: orderedIds[i] },
          data: { order: i + 1 },
        });
      }
    });
  }
}
