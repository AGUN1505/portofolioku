// src/infrastructure/mappers/prisma-section-config.mapper.ts
// Dedicated CMS persistence mapper for SectionConfig records.
// STRICT: Preserves exact database IDs and guarantees type-safe mapping.

import type { SectionConfig as PrismaSectionConfig, Prisma } from '@prisma/client';
import type { SectionConfig } from '../../domain/entities/section-config';
import type {
  CreateSectionConfigData,
  UpdateSectionConfigData,
} from '../../domain/repositories/section-config.repository';

export class PrismaSectionConfigMapper {
  /**
   * Maps a Prisma SectionConfig record to strict Domain SectionConfig.
   */
  static toDomain(record: PrismaSectionConfig): SectionConfig {
    return {
      id: record.id,
      key: record.key,
      label: record.label,
      order: record.order,
      enabled: record.enabled,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  /**
   * Maps Domain CreateSectionConfigData to Prisma SectionConfigCreateInput.
   */
  static toPrismaCreate(data: CreateSectionConfigData): Prisma.SectionConfigCreateInput {
    return {
      key: data.key,
      label: data.label,
      order: data.order ?? 0,
      enabled: data.enabled ?? true,
    };
  }

  /**
   * Maps Domain UpdateSectionConfigData to Prisma SectionConfigUpdateInput.
   */
  static toPrismaUpdate(data: UpdateSectionConfigData): Prisma.SectionConfigUpdateInput {
    const update: Prisma.SectionConfigUpdateInput = {};

    if (data.key !== undefined) update.key = data.key;
    if (data.label !== undefined) update.label = data.label;
    if (data.order !== undefined) update.order = data.order;
    if (data.enabled !== undefined) update.enabled = data.enabled;

    return update;
  }
}

export const PrismaSectionConfigRecordMapper = PrismaSectionConfigMapper;
