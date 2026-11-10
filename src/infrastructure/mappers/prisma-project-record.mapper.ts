// src/infrastructure/mappers/prisma-project-record.mapper.ts
// Dedicated CMS persistence mapper for Project records.
// STRICT: Preserves exact database IDs (e.g. 'project_01') and guarantees type-safe JSON conversion.

import type { Project as PrismaProject, Prisma } from '@prisma/client';
import type { ProjectRecord } from '../../domain/entities/project-record';
import type {
  CreateProjectData,
  UpdateProjectData,
} from '../../domain/repositories/project.repository';

export class PrismaProjectRecordMapper {
  /**
   * Maps a Prisma Project record to strict Domain ProjectRecord.
   * Exact primary key ID is preserved without normalization.
   */
  static toDomain(p: PrismaProject): ProjectRecord {
    const rawTech = p.technologies;
    const technologies: string[] = Array.isArray(rawTech)
      ? (rawTech as string[]).map((t) => String(t))
      : typeof rawTech === 'string'
      ? (() => {
          try {
            const parsed = JSON.parse(rawTech);
            return Array.isArray(parsed) ? parsed.map((t) => String(t)) : [];
          } catch {
            return [];
          }
        })()
      : [];

    return {
      id: p.id,
      title: p.title,
      category: p.category,
      description: p.description,
      technologies,
      thumbnailUrl: p.thumbnailUrl,
      projectUrl: p.projectUrl,
      githubUrl: p.githubUrl,
      published: p.published,
      publishedAt: p.publishedAt,
      order: p.order,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  /**
   * Maps Domain CreateProjectData to Prisma ProjectCreateInput.
   * System-controlled keys (id, createdAt, updatedAt) are excluded.
   */
  static toPrismaCreate(data: CreateProjectData): Prisma.ProjectCreateInput {
    return {
      title: data.title,
      category: data.category,
      description: data.description,
      technologies: data.technologies as Prisma.InputJsonValue,
      thumbnailUrl: data.thumbnailUrl ?? null,
      projectUrl: data.projectUrl ?? null,
      githubUrl: data.githubUrl ?? null,
      published: data.published,
      publishedAt: data.publishedAt ?? null,
      order: data.order ?? 0,
    };
  }

  /**
   * Maps Domain UpdateProjectData to Prisma ProjectUpdateInput.
   * Preserves omitted fields (undefined) and supports explicit null for nullable columns.
   */
  static toPrismaUpdate(data: UpdateProjectData): Prisma.ProjectUpdateInput {
    const update: Prisma.ProjectUpdateInput = {};

    if (data.title !== undefined) update.title = data.title;
    if (data.category !== undefined) update.category = data.category;
    if (data.description !== undefined) update.description = data.description;
    if (data.technologies !== undefined) {
      update.technologies = data.technologies as Prisma.InputJsonValue;
    }
    if (data.thumbnailUrl !== undefined) update.thumbnailUrl = data.thumbnailUrl;
    if (data.projectUrl !== undefined) update.projectUrl = data.projectUrl;
    if (data.githubUrl !== undefined) update.githubUrl = data.githubUrl;
    if (data.published !== undefined) update.published = data.published;
    if (data.publishedAt !== undefined) update.publishedAt = data.publishedAt;
    if (data.order !== undefined) update.order = data.order;

    return update;
  }
}
