// src/infrastructure/mappers/prisma-engineering-node-record.mapper.ts
// Dedicated CMS persistence mapper for EngineeringNode records.
// STRICT: Preserves exact database IDs and nullable stack semantics.

import type { EngineeringNode as PrismaEngineeringNode, Prisma } from '@prisma/client';
import type { EngineeringNodeRecord } from '../../domain/entities/engineering-node-record';
import type {
  CreateEngineeringNodeData,
  UpdateEngineeringNodeData,
} from '../../domain/repositories/engineering-node.repository';

export class PrismaEngineeringNodeRecordMapper {
  /**
   * Maps a Prisma EngineeringNode record to strict Domain EngineeringNodeRecord.
   */
  static toDomain(n: PrismaEngineeringNode): EngineeringNodeRecord {
    return {
      id: n.id,
      tag: n.tag,
      title: n.title,
      description: n.description,
      stack: n.stack,
      highlighted: n.highlighted,
      order: n.order,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    };
  }

  /**
   * Maps Domain CreateEngineeringNodeData to Prisma EngineeringNodeCreateInput.
   */
  static toPrismaCreate(data: CreateEngineeringNodeData): Prisma.EngineeringNodeCreateInput {
    return {
      tag: data.tag,
      title: data.title,
      description: data.description,
      stack: data.stack ?? null,
      highlighted: data.highlighted ?? false,
      order: data.order ?? 0,
    };
  }

  /**
   * Maps Domain UpdateEngineeringNodeData to Prisma EngineeringNodeUpdateInput.
   */
  static toPrismaUpdate(data: UpdateEngineeringNodeData): Prisma.EngineeringNodeUpdateInput {
    const update: Prisma.EngineeringNodeUpdateInput = {};

    if (data.tag !== undefined) update.tag = data.tag;
    if (data.title !== undefined) update.title = data.title;
    if (data.description !== undefined) update.description = data.description;
    if (data.stack !== undefined) update.stack = data.stack;
    if (data.highlighted !== undefined) update.highlighted = data.highlighted;
    if (data.order !== undefined) update.order = data.order;

    return update;
  }
}
