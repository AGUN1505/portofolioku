// src/infrastructure/mappers/prisma-pillar-record.mapper.ts
// Dedicated CMS persistence mapper for Pillar records.
// STRICT: Preserves exact database IDs, text description, and string index semantics.

import type { Pillar as PrismaPillar, Prisma } from '@prisma/client';
import type { PillarRecord } from '../../domain/entities/pillar-record';
import type {
  CreatePillarData,
  UpdatePillarData,
} from '../../domain/repositories/pillar.repository';

export class PrismaPillarRecordMapper {
  /**
   * Maps a Prisma Pillar record to strict Domain PillarRecord.
   */
  static toDomain(p: PrismaPillar): PillarRecord {
    return {
      id: p.id,
      index: p.index,
      title: p.title,
      description: p.description,
      order: p.order,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  /**
   * Maps Domain CreatePillarData to Prisma PillarCreateInput.
   */
  static toPrismaCreate(data: CreatePillarData): Prisma.PillarCreateInput {
    return {
      index: data.index,
      title: data.title,
      description: data.description,
      order: data.order ?? 0,
    };
  }

  /**
   * Maps Domain UpdatePillarData to Prisma PillarUpdateInput.
   */
  static toPrismaUpdate(data: UpdatePillarData): Prisma.PillarUpdateInput {
    const update: Prisma.PillarUpdateInput = {};

    if (data.index !== undefined) update.index = data.index;
    if (data.title !== undefined) update.title = data.title;
    if (data.description !== undefined) update.description = data.description;
    if (data.order !== undefined) update.order = data.order;

    return update;
  }
}
