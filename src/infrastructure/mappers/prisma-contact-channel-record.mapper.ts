// src/infrastructure/mappers/prisma-contact-channel-record.mapper.ts
// Dedicated CMS persistence mapper for ContactChannel records.

import type { ContactChannel as PrismaContactChannel, Prisma } from '@prisma/client';
import type { ContactChannelRecord } from '../../domain/entities/contact-channel-record';
import type {
  CreateContactChannelData,
  UpdateContactChannelData,
} from '../../domain/repositories/contact-channel.repository';

export class PrismaContactChannelRecordMapper {
  /**
   * Maps a Prisma ContactChannel record to strict Domain ContactChannelRecord.
   */
  static toDomain(c: PrismaContactChannel): ContactChannelRecord {
    return {
      id: c.id,
      label: c.label,
      value: c.value,
      order: c.order,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }

  /**
   * Maps ContactChannel CreateContactChannelData to Prisma ContactChannelCreateInput.
   */
  static toPrismaCreate(data: CreateContactChannelData): Prisma.ContactChannelCreateInput {
    return {
      label: data.label,
      value: data.value,
      order: data.order ?? 0,
    };
  }

  /**
   * Maps ContactChannel UpdateContactChannelData to Prisma ContactChannelUpdateInput.
   */
  static toPrismaUpdate(data: UpdateContactChannelData): Prisma.ContactChannelUpdateInput {
    const update: Prisma.ContactChannelUpdateInput = {};

    if (data.label !== undefined) update.label = data.label;
    if (data.value !== undefined) update.value = data.value;
    if (data.order !== undefined) update.order = data.order;

    return update;
  }
}
