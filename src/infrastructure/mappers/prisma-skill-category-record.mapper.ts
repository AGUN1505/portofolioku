// src/infrastructure/mappers/prisma-skill-category-record.mapper.ts
// Dedicated CMS persistence mapper for SkillCategory records.
// STRICT: Preserves exact database IDs and guarantees type-safe mapping.

import type { SkillCategory as PrismaSkillCategory, Prisma } from '@prisma/client';
import type { SkillCategoryRecord } from '../../domain/entities/skill-category-record';
import type {
  CreateSkillCategoryData,
  UpdateSkillCategoryData,
} from '../../domain/repositories/skill-category.repository';

export class PrismaSkillCategoryRecordMapper {
  /**
   * Maps a Prisma SkillCategory record to strict Domain SkillCategoryRecord.
   */
  static toDomain(c: PrismaSkillCategory): SkillCategoryRecord {
    return {
      id: c.id,
      title: c.title,
      order: c.order,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }

  /**
   * Maps Domain CreateSkillCategoryData to Prisma SkillCategoryCreateInput.
   */
  static toPrismaCreate(data: CreateSkillCategoryData): Prisma.SkillCategoryCreateInput {
    return {
      title: data.title,
      order: data.order ?? 0,
    };
  }

  /**
   * Maps Domain UpdateSkillCategoryData to Prisma SkillCategoryUpdateInput.
   */
  static toPrismaUpdate(data: UpdateSkillCategoryData): Prisma.SkillCategoryUpdateInput {
    const update: Prisma.SkillCategoryUpdateInput = {};

    if (data.title !== undefined) update.title = data.title;
    if (data.order !== undefined) update.order = data.order;

    return update;
  }
}
