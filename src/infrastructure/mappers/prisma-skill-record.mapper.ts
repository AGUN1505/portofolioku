// src/infrastructure/mappers/prisma-skill-record.mapper.ts
// Dedicated CMS persistence mapper for Skill records.
// STRICT: Preserves exact database IDs, foreign key relations, and category connection.

import type { Skill as PrismaSkill, Prisma } from '@prisma/client';
import type { SkillRecord } from '../../domain/entities/skill-record';
import type {
  CreateSkillData,
  UpdateSkillData,
} from '../../domain/repositories/skill.repository';

export class PrismaSkillRecordMapper {
  /**
   * Maps a Prisma Skill record to strict Domain SkillRecord.
   */
  static toDomain(s: PrismaSkill): SkillRecord {
    return {
      id: s.id,
      name: s.name,
      categoryId: s.categoryId,
      order: s.order,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  }

  /**
   * Maps Domain CreateSkillData to Prisma SkillCreateInput.
   */
  static toPrismaCreate(data: CreateSkillData): Prisma.SkillCreateInput {
    return {
      name: data.name,
      order: data.order ?? 0,
      category: {
        connect: { id: data.categoryId },
      },
    };
  }

  /**
   * Maps Domain UpdateSkillData to Prisma SkillUpdateInput.
   */
  static toPrismaUpdate(data: UpdateSkillData): Prisma.SkillUpdateInput {
    const update: Prisma.SkillUpdateInput = {};

    if (data.name !== undefined) update.name = data.name;
    if (data.order !== undefined) update.order = data.order;
    if (data.categoryId !== undefined) {
      update.category = {
        connect: { id: data.categoryId },
      };
    }

    return update;
  }
}
