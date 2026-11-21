// src/infrastructure/repositories/prisma-section-config.repository.ts
// Infrastructure repository: Prisma implementation for SectionConfig persistence.
// Preserves exact database IDs and implements atomic reordering under PostgreSQL advisory locking.

import type { PrismaClient } from '@prisma/client';
import type {
  ISectionConfigRepository,
  UpdateSectionConfigData,
} from '../../domain/repositories/section-config.repository';
import type { SectionConfig } from '../../domain/entities/section-config';
import { PrismaSectionConfigMapper } from '../mappers/prisma-section-config.mapper';
import { acquireAdvisoryLock, AdvisoryLockNamespace } from '../utils/advisory-lock';

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
          e.message.includes('table `public`.`section_configs` does not exist') ||
          e.message.includes('table `section_configs` does not exist') ||
          e.message.includes('relation "section_configs" does not exist'))
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

export class PrismaSectionConfigRepository implements ISectionConfigRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Retrieves all section configs ordered by ascending display order.
   */
  async getAll(): Promise<SectionConfig[]> {
    return this.findAll();
  }

  /**
   * Retrieves all section configs ordered by ascending display order.
   * Handles defensive P2021 error when table does not exist or client model is uninitialized.
   */
  async findAll(): Promise<SectionConfig[]> {
    if (!this.prisma.sectionConfig) {
      return [];
    }
    try {
      const records = await this.prisma.sectionConfig.findMany({
        orderBy: { order: 'asc' },
      });
      return records.map(PrismaSectionConfigMapper.toDomain);
    } catch (err) {
      if (isTableMissingError(err)) {
        return [];
      }
      throw err;
    }
  }

  /**
   * Retrieves a single section config by primary key ID.
   */
  async getById(id: string): Promise<SectionConfig | null> {
    return this.findById(id);
  }

  /**
   * Retrieves a single section config by primary key ID with defensive check.
   */
  async findById(id: string): Promise<SectionConfig | null> {
    if (!this.prisma.sectionConfig) {
      return null;
    }
    try {
      const record = await this.prisma.sectionConfig.findUnique({
        where: { id },
      });
      if (!record) return null;
      return PrismaSectionConfigMapper.toDomain(record);
    } catch (err) {
      if (isTableMissingError(err)) {
        return null;
      }
      throw err;
    }
  }

  /**
   * Retrieves a single section config by its unique key (e.g., 'hero', 'about').
   */
  async getByKey(key: string): Promise<SectionConfig | null> {
    return this.findByKey(key);
  }

  /**
   * Retrieves a single section config by its unique key with defensive check.
   */
  async findByKey(key: string): Promise<SectionConfig | null> {
    if (!this.prisma.sectionConfig) {
      return null;
    }
    try {
      const record = await this.prisma.sectionConfig.findUnique({
        where: { key },
      });
      if (!record) return null;
      return PrismaSectionConfigMapper.toDomain(record);
    } catch (err) {
      if (isTableMissingError(err)) {
        return null;
      }
      throw err;
    }
  }

  /**
   * Updates an existing section config by key or id.
   */
  async update(keyOrId: string, data: UpdateSectionConfigData): Promise<SectionConfig> {
    if (!this.prisma.sectionConfig) {
      throw new Error('Prisma sectionConfig client is not initialized.');
    }
    const existing = (await this.findByKey(keyOrId)) ?? (await this.findById(keyOrId));
    if (!existing) {
      throw new Error(`SectionConfig '${keyOrId}' not found.`);
    }

    const prismaUpdate = PrismaSectionConfigMapper.toPrismaUpdate(data);
    const updated = await this.prisma.sectionConfig.update({
      where: { id: existing.id },
      data: prismaUpdate,
    });
    return PrismaSectionConfigMapper.toDomain(updated);
  }

  /**
   * Atomically reorders section configs sequentially starting from order = 1.
   * Validates duplicate, missing, and foreign IDs inside the transaction.
   */
  async reorder(orderedIds: string[]): Promise<void> {
    if (!this.prisma.sectionConfig) {
      return;
    }
    if (new Set(orderedIds).size !== orderedIds.length) {
      throw new Error('Duplicate IDs found in reorder list.');
    }

    await this.prisma.$transaction(async (tx) => {
      await acquireAdvisoryLock(tx, AdvisoryLockNamespace.SECTION_CONFIG, 0);

      const existing = await tx.sectionConfig.findMany({
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
          throw new Error(`Unknown section config ID in reorder list: "${id}".`);
        }
      }

      for (let i = 0; i < orderedIds.length; i++) {
        await tx.sectionConfig.update({
          where: { id: orderedIds[i] },
          data: { order: i + 1 },
        });
      }
    });
  }
}
