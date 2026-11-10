// Infrastructure repository: Prisma implementation for About Profile Singleton

import type { PrismaClient } from '@prisma/client';
import type {
  IAboutProfileRepository,
  UpdateAboutProfileData,
} from '../../domain/repositories/about-profile.repository';
import type { AboutProfileRecord } from '../../domain/entities/about-profile-record';

export class PrismaAboutProfileRepository implements IAboutProfileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getProfile(): Promise<AboutProfileRecord | null> {
    const record = await this.prisma.aboutProfile.findUnique({
      where: { id: 'singleton' },
    });
    if (!record) return null;

    return {
      id: record.id,
      heading: record.heading,
      quote: record.quote,
      primaryNarrative: record.primaryNarrative,
      secondaryNarrative: record.secondaryNarrative,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async updateProfile(data: UpdateAboutProfileData): Promise<AboutProfileRecord> {
    const record = await this.prisma.aboutProfile.update({
      where: { id: 'singleton' },
      data: {
        heading: data.heading,
        quote: data.quote,
        primaryNarrative: data.primaryNarrative,
        secondaryNarrative: data.secondaryNarrative,
      },
    });

    return {
      id: record.id,
      heading: record.heading,
      quote: record.quote,
      primaryNarrative: record.primaryNarrative,
      secondaryNarrative: record.secondaryNarrative,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
