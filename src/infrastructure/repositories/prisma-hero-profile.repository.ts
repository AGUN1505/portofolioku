// Infrastructure repository: Prisma implementation for Hero Profile Singleton

import type { PrismaClient } from '@prisma/client';
import type {
  IHeroProfileRepository,
  UpdateHeroProfileData,
} from '../../domain/repositories/hero-profile.repository';
import type { HeroProfileRecord } from '../../domain/entities/hero-profile-record';

export class PrismaHeroProfileRepository implements IHeroProfileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getProfile(): Promise<HeroProfileRecord | null> {
    const record = await this.prisma.heroProfile.findUnique({
      where: { id: 'singleton' },
    });
    if (!record) return null;

    return {
      id: record.id,
      name: record.name,
      tagline: record.tagline,
      bio: record.bio,
      country: record.country,
      code: record.code,
      timezone: record.timezone,
      discipline: record.discipline,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async updateProfile(data: UpdateHeroProfileData): Promise<HeroProfileRecord> {
    const record = await this.prisma.heroProfile.update({
      where: { id: 'singleton' },
      data: {
        name: data.name,
        tagline: data.tagline,
        bio: data.bio,
        country: data.country,
        code: data.code,
        timezone: data.timezone,
        discipline: data.discipline,
      },
    });

    return {
      id: record.id,
      name: record.name,
      tagline: record.tagline,
      bio: record.bio,
      country: record.country,
      code: record.code,
      timezone: record.timezone,
      discipline: record.discipline,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
