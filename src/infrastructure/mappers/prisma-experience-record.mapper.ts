// src/infrastructure/mappers/prisma-experience-record.mapper.ts
// Dedicated CMS persistence mapper for Experience records.
// STRICT: Preserves exact database IDs (e.g. 'exp_01') and handles ongoing dates (endDate === null).

import type { Experience as PrismaExperience, Prisma } from '@prisma/client';
import type { ExperienceRecord } from '../../domain/entities/experience-record';
import type {
  CreateExperienceData,
  UpdateExperienceData,
} from '../../domain/repositories/experience.repository';

export class PrismaExperienceRecordMapper {
  /**
   * Maps a Prisma Experience record to strict Domain ExperienceRecord.
   * Exact primary key ID is preserved without normalization.
   */
  static toDomain(e: PrismaExperience): ExperienceRecord {
    return {
      id: e.id,
      role: e.role,
      institution: e.institution,
      track: e.track,
      description: e.description,
      startDate: e.startDate,
      endDate: e.endDate,
      order: e.order,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    };
  }

  /**
   * Maps Domain CreateExperienceData to Prisma ExperienceCreateInput.
   * System-controlled keys (id, createdAt, updatedAt) are excluded.
   */
  static toPrismaCreate(data: CreateExperienceData): Prisma.ExperienceCreateInput {
    return {
      role: data.role,
      institution: data.institution,
      track: data.track,
      description: data.description ?? null,
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
      order: data.order ?? 0,
    };
  }

  /**
   * Maps Domain UpdateExperienceData to Prisma ExperienceUpdateInput.
   * Preserves omitted fields (undefined) and supports explicit null for nullable columns.
   */
  static toPrismaUpdate(data: UpdateExperienceData): Prisma.ExperienceUpdateInput {
    const update: Prisma.ExperienceUpdateInput = {};

    if (data.role !== undefined) update.role = data.role;
    if (data.institution !== undefined) update.institution = data.institution;
    if (data.track !== undefined) update.track = data.track;
    if (data.description !== undefined) update.description = data.description;
    if (data.startDate !== undefined) update.startDate = data.startDate;
    if (data.endDate !== undefined) update.endDate = data.endDate;
    if (data.order !== undefined) update.order = data.order;

    return update;
  }
}
