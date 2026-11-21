// src/infrastructure/repositories/prisma-contact-channel.repository.ts
// Infrastructure repository: Prisma implementation for ContactChannel persistence.
// Uses transaction-scoped PostgreSQL advisory locks for atomic ordering.

import type { PrismaClient } from '@prisma/client';
import type {
  IContactChannelRepository,
  CreateContactChannelData,
  UpdateContactChannelData,
} from '../../domain/repositories/contact-channel.repository';
import type { ContactChannelRecord } from '../../domain/entities/contact-channel-record';
import { PrismaContactChannelRecordMapper } from '../mappers/prisma-contact-channel-record.mapper';
import { acquireAdvisoryLock, AdvisoryLockNamespace } from '../utils/advisory-lock';

export class PrismaContactChannelRepository implements IContactChannelRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Retrieves all contact channels ordered by ascending display order.
   */
  async getAll(): Promise<ContactChannelRecord[]> {
    const records = await this.prisma.contactChannel.findMany({
      orderBy: { order: 'asc' },
    });
    return records.map(PrismaContactChannelRecordMapper.toDomain);
  }

  /**
   * Retrieves a single contact channel by primary key ID.
   */
  async getById(id: string): Promise<ContactChannelRecord | null> {
    const record = await this.prisma.contactChannel.findUnique({
      where: { id },
    });
    if (!record) return null;
    return PrismaContactChannelRecordMapper.toDomain(record);
  }

  /**
   * Persists a new contact channel record.
   * If order is undefined, atomically calculates max(order) + 1 under an advisory lock.
   */
  async create(data: CreateContactChannelData): Promise<ContactChannelRecord> {
    if (data.order !== undefined) {
      const prismaData = PrismaContactChannelRecordMapper.toPrismaCreate(data);
      const created = await this.prisma.contactChannel.create({
        data: prismaData,
      });
      return PrismaContactChannelRecordMapper.toDomain(created);
    }

    return await this.prisma.$transaction(async (tx) => {
      await acquireAdvisoryLock(tx, AdvisoryLockNamespace.CONTACT_CHANNEL, 0);
      const maxOrder = await tx.contactChannel.aggregate({
        _max: { order: true },
      });
      const nextOrder = (maxOrder._max.order ?? 0) + 1;
      const prismaData = PrismaContactChannelRecordMapper.toPrismaCreate({
        ...data,
        order: nextOrder,
      });
      const created = await tx.contactChannel.create({
        data: prismaData,
      });
      return PrismaContactChannelRecordMapper.toDomain(created);
    });
  }

  /**
   * Updates an existing contact channel record by ID.
   */
  async update(id: string, data: UpdateContactChannelData): Promise<ContactChannelRecord> {
    const existing = await this.prisma.contactChannel.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw new Error(`Contact channel with ID "${id}" not found.`);
    }

    const prismaUpdate = PrismaContactChannelRecordMapper.toPrismaUpdate(data);
    const updated = await this.prisma.contactChannel.update({
      where: { id },
      data: prismaUpdate,
    });
    return PrismaContactChannelRecordMapper.toDomain(updated);
  }

  /**
   * Deletes an existing contact channel record by ID.
   */
  async delete(id: string): Promise<void> {
    const existing = await this.prisma.contactChannel.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw new Error(`Contact channel with ID "${id}" not found.`);
    }

    await this.prisma.contactChannel.delete({
      where: { id },
    });
  }

  /**
   * Atomically reorders contact channels sequentially starting from order = 1.
   */
  async reorder(orderedIds: string[]): Promise<void> {
    if (new Set(orderedIds).size !== orderedIds.length) {
      throw new Error('Duplicate IDs found in reorder list.');
    }

    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.contactChannel.findMany({
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
          throw new Error(`Unknown contact channel ID in reorder list: "${id}".`);
        }
      }

      for (let i = 0; i < orderedIds.length; i++) {
        await tx.contactChannel.update({
          where: { id: orderedIds[i] },
          data: { order: i + 1 },
        });
      }
    });
  }
}
