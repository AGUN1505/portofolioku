// Infrastructure repository: Prisma implementation for Contact Profile Singleton

import type { PrismaClient } from '@prisma/client';
import type {
  IContactProfileRepository,
  UpdateContactProfileData,
} from '../../domain/repositories/contact-profile.repository';
import type { ContactProfileRecord } from '../../domain/entities/contact-profile-record';

export class PrismaContactProfileRepository implements IContactProfileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getProfile(): Promise<ContactProfileRecord | null> {
    const record = await this.prisma.contactProfile.findUnique({
      where: { id: 'singleton' },
    });
    if (!record) return null;

    return {
      id: record.id,
      heading: record.heading,
      ctaLabel: record.ctaLabel,
      description: record.description,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async updateProfile(data: UpdateContactProfileData): Promise<ContactProfileRecord> {
    const record = await this.prisma.contactProfile.update({
      where: { id: 'singleton' },
      data: {
        heading: data.heading,
        ctaLabel: data.ctaLabel,
        description: data.description,
      },
    });

    return {
      id: record.id,
      heading: record.heading,
      ctaLabel: record.ctaLabel,
      description: record.description,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
