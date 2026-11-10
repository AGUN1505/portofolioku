// src/infrastructure/mappers/prisma-role-record.mapper.ts
// Dedicated CMS persistence mapper for Role records.
// STRICT: Preserves exact database IDs and guarantees type-safe mapping.

import type { Role as PrismaRole, Prisma } from '@prisma/client';
import type { RoleRecord } from '../../domain/entities/role-record';
import type {
  CreateRoleData,
  UpdateRoleData,
} from '../../domain/repositories/role.repository';

export class PrismaRoleRecordMapper {
  /**
   * Maps a Prisma Role record to strict Domain RoleRecord.
   */
  static toDomain(r: PrismaRole): RoleRecord {
    return {
      id: r.id,
      title: r.title,
      primary: r.primary,
      order: r.order,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }

  /**
   * Maps Domain CreateRoleData to Prisma RoleCreateInput.
   */
  static toPrismaCreate(data: CreateRoleData): Prisma.RoleCreateInput {
    return {
      title: data.title,
      primary: data.primary ?? false,
      order: data.order ?? 0,
    };
  }

  /**
   * Maps Domain UpdateRoleData to Prisma RoleUpdateInput.
   */
  static toPrismaUpdate(data: UpdateRoleData): Prisma.RoleUpdateInput {
    const update: Prisma.RoleUpdateInput = {};

    if (data.title !== undefined) update.title = data.title;
    if (data.primary !== undefined) update.primary = data.primary;
    if (data.order !== undefined) update.order = data.order;

    return update;
  }
}
