// src/infrastructure/mappers/prisma-domain-record.mapper.ts
// Dedicated CMS persistence mapper for Domain records.
// STRICT: Preserves exact database IDs and string index semantics.

import type { Domain as PrismaDomain, Prisma } from '@prisma/client';
import type { DomainRecord } from '../../domain/entities/domain-record';
import type {
  CreateDomainData,
  UpdateDomainData,
} from '../../domain/repositories/domain.repository';

export class PrismaDomainRecordMapper {
  /**
   * Maps a Prisma Domain record to strict Domain DomainRecord.
   */
  static toDomain(d: PrismaDomain): DomainRecord {
    return {
      id: d.id,
      index: d.index,
      title: d.title,
      order: d.order,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };
  }

  /**
   * Maps Domain CreateDomainData to Prisma DomainCreateInput.
   */
  static toPrismaCreate(data: CreateDomainData): Prisma.DomainCreateInput {
    return {
      index: data.index,
      title: data.title,
      order: data.order ?? 0,
    };
  }

  /**
   * Maps Domain UpdateDomainData to Prisma DomainUpdateInput.
   */
  static toPrismaUpdate(data: UpdateDomainData): Prisma.DomainUpdateInput {
    const update: Prisma.DomainUpdateInput = {};

    if (data.index !== undefined) update.index = data.index;
    if (data.title !== undefined) update.title = data.title;
    if (data.order !== undefined) update.order = data.order;

    return update;
  }
}
