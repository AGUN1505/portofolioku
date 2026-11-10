// src/infrastructure/repositories/prisma-role.repository.ts
// Infrastructure repository: Prisma implementation for Role persistence.
// Preserves exact database IDs and implements atomic reordering.

import type { PrismaClient } from '@prisma/client';
import type {
  IRoleRepository,
  CreateRoleData,
  UpdateRoleData,
} from '../../domain/repositories/role.repository';
import type { RoleRecord } from '../../domain/entities/role-record';
import { PrismaRoleRecordMapper } from '../mappers/prisma-role-record.mapper';
import { acquireAdvisoryLock, AdvisoryLockNamespace } from '../utils/advisory-lock';

export class PrismaRoleRepository implements IRoleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Retrieves all roles ordered by ascending display order.
   */
  async getAll(): Promise<RoleRecord[]> {
    const records = await this.prisma.role.findMany({
      orderBy: { order: 'asc' },
    });
    return records.map(PrismaRoleRecordMapper.toDomain);
  }

  /**
   * Retrieves a single role by primary key ID.
   * Returns null if no record matches.
   */
  async getById(id: string): Promise<RoleRecord | null> {
    const record = await this.prisma.role.findUnique({
      where: { id },
    });
    if (!record) return null;
    return PrismaRoleRecordMapper.toDomain(record);
  }

  /**
   * Persists a new role record.
   * If order is undefined, atomically calculates max(order) + 1 under an advisory lock.
   */
  async create(data: CreateRoleData): Promise<RoleRecord> {
    if (data.order !== undefined) {
      const prismaData = PrismaRoleRecordMapper.toPrismaCreate(data);
      const created = await this.prisma.role.create({
        data: prismaData,
      });
      return PrismaRoleRecordMapper.toDomain(created);
    }

    return await this.prisma.$transaction(async (tx) => {
      await acquireAdvisoryLock(tx, AdvisoryLockNamespace.ROLE, 0);
      const maxOrder = await tx.role.aggregate({
        _max: { order: true },
      });
      const nextOrder = (maxOrder._max.order ?? 0) + 1;
      const prismaData = PrismaRoleRecordMapper.toPrismaCreate({
        ...data,
        order: nextOrder,
      });
      const created = await tx.role.create({
        data: prismaData,
      });
      return PrismaRoleRecordMapper.toDomain(created);
    });
  }

  /**
   * Updates an existing role record by ID.
   * Throws an Error if the role does not exist.
   */
  async update(id: string, data: UpdateRoleData): Promise<RoleRecord> {
    const existing = await this.prisma.role.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw new Error(`Role with ID "${id}" not found.`);
    }

    const prismaUpdate = PrismaRoleRecordMapper.toPrismaUpdate(data);
    const updated = await this.prisma.role.update({
      where: { id },
      data: prismaUpdate,
    });
    return PrismaRoleRecordMapper.toDomain(updated);
  }

  /**
   * Deletes an existing role record by ID.
   * Throws an Error if the role does not exist.
   */
  async delete(id: string): Promise<void> {
    const existing = await this.prisma.role.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw new Error(`Role with ID "${id}" not found.`);
    }

    await this.prisma.role.delete({
      where: { id },
    });
  }

  /**
   * Atomically reorders roles sequentially starting from order = 1.
   * Validates duplicate, missing, and foreign IDs inside the transaction.
   */
  async reorder(orderedIds: string[]): Promise<void> {
    if (new Set(orderedIds).size !== orderedIds.length) {
      throw new Error('Duplicate IDs found in reorder list.');
    }

    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.role.findMany({
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
          throw new Error(`Unknown role ID in reorder list: "${id}".`);
        }
      }

      for (let i = 0; i < orderedIds.length; i++) {
        await tx.role.update({
          where: { id: orderedIds[i] },
          data: { order: i + 1 },
        });
      }
    });
  }
}
