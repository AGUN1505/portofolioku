// src/infrastructure/repositories/prisma-engineering-node.repository.ts
// Infrastructure repository: Prisma implementation for EngineeringNode persistence.
// Preserves exact database IDs, handles nullable stack, and implements atomic reordering.

import type { PrismaClient } from '@prisma/client';
import type {
  IEngineeringNodeRepository,
  CreateEngineeringNodeData,
  UpdateEngineeringNodeData,
} from '../../domain/repositories/engineering-node.repository';
import type { EngineeringNodeRecord } from '../../domain/entities/engineering-node-record';
import { PrismaEngineeringNodeRecordMapper } from '../mappers/prisma-engineering-node-record.mapper';
import { acquireAdvisoryLock, AdvisoryLockNamespace } from '../utils/advisory-lock';

export class PrismaEngineeringNodeRepository implements IEngineeringNodeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Retrieves all engineering nodes ordered by ascending display order.
   */
  async getAll(): Promise<EngineeringNodeRecord[]> {
    const records = await this.prisma.engineeringNode.findMany({
      orderBy: { order: 'asc' },
    });
    return records.map(PrismaEngineeringNodeRecordMapper.toDomain);
  }

  /**
   * Retrieves a single engineering node by primary key ID.
   * Returns null if no record matches.
   */
  async getById(id: string): Promise<EngineeringNodeRecord | null> {
    const record = await this.prisma.engineeringNode.findUnique({
      where: { id },
    });
    if (!record) return null;
    return PrismaEngineeringNodeRecordMapper.toDomain(record);
  }

  /**
   * Persists a new engineering node record.
   * If order is undefined, atomically calculates max(order) + 1 under an advisory lock.
   */
  async create(data: CreateEngineeringNodeData): Promise<EngineeringNodeRecord> {
    if (data.order !== undefined) {
      const prismaData = PrismaEngineeringNodeRecordMapper.toPrismaCreate(data);
      const created = await this.prisma.engineeringNode.create({
        data: prismaData,
      });
      return PrismaEngineeringNodeRecordMapper.toDomain(created);
    }

    return await this.prisma.$transaction(async (tx) => {
      await acquireAdvisoryLock(tx, AdvisoryLockNamespace.ENGINEERING_NODE, 0);
      const maxOrder = await tx.engineeringNode.aggregate({
        _max: { order: true },
      });
      const nextOrder = (maxOrder._max.order ?? 0) + 1;
      const prismaData = PrismaEngineeringNodeRecordMapper.toPrismaCreate({
        ...data,
        order: nextOrder,
      });
      const created = await tx.engineeringNode.create({
        data: prismaData,
      });
      return PrismaEngineeringNodeRecordMapper.toDomain(created);
    });
  }

  /**
   * Updates an existing engineering node record by ID.
   * Throws an Error if the node does not exist.
   */
  async update(id: string, data: UpdateEngineeringNodeData): Promise<EngineeringNodeRecord> {
    const existing = await this.prisma.engineeringNode.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw new Error(`Engineering node with ID "${id}" not found.`);
    }

    const prismaUpdate = PrismaEngineeringNodeRecordMapper.toPrismaUpdate(data);
    const updated = await this.prisma.engineeringNode.update({
      where: { id },
      data: prismaUpdate,
    });
    return PrismaEngineeringNodeRecordMapper.toDomain(updated);
  }

  /**
   * Deletes an existing engineering node record by ID.
   * Throws an Error if the node does not exist.
   */
  async delete(id: string): Promise<void> {
    const existing = await this.prisma.engineeringNode.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw new Error(`Engineering node with ID "${id}" not found.`);
    }

    await this.prisma.engineeringNode.delete({
      where: { id },
    });
  }

  /**
   * Atomically reorders engineering nodes sequentially starting from order = 1.
   * Validates duplicate, missing, and foreign IDs inside the transaction.
   */
  async reorder(orderedIds: string[]): Promise<void> {
    if (new Set(orderedIds).size !== orderedIds.length) {
      throw new Error('Duplicate IDs found in reorder list.');
    }

    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.engineeringNode.findMany({
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
          throw new Error(`Unknown engineering node ID in reorder list: "${id}".`);
        }
      }

      for (let i = 0; i < orderedIds.length; i++) {
        await tx.engineeringNode.update({
          where: { id: orderedIds[i] },
          data: { order: i + 1 },
        });
      }
    });
  }
}
