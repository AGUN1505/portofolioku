// src/infrastructure/repositories/prisma-portfolio.repository.ts
import type { PrismaClient } from '@prisma/client';
import type { IPortfolioRepository } from '../../domain/repositories/portfolio.repository';
import type { Portfolio } from '../../domain/entities';
import { PrismaPortfolioMapper } from '../mappers/prisma-portfolio.mapper';

export class PrismaPortfolioRepository implements IPortfolioRepository<Promise<Portfolio>> {
  constructor(private readonly prisma: PrismaClient) {}

  async getPortfolioData(): Promise<Portfolio> {
    try {
      const [
        hero,
        roles,
        nodes,
        about,
        domains,
        pillars,
        projects,
        experiences,
        skillCategories,
        contact,
        channels,
      ] = await Promise.all([
        this.prisma.heroProfile.findUnique({ where: { id: 'singleton' } }),
        this.prisma.role.findMany({ orderBy: { order: 'asc' } }),
        this.prisma.engineeringNode.findMany({ orderBy: { order: 'asc' } }),
        this.prisma.aboutProfile.findUnique({ where: { id: 'singleton' } }),
        this.prisma.domain.findMany({ orderBy: { order: 'asc' } }),
        this.prisma.pillar.findMany({ orderBy: { order: 'asc' } }),
        this.prisma.project.findMany({
          where: { published: true },
          orderBy: { order: 'asc' },
        }),
        this.prisma.experience.findMany({ orderBy: { order: 'asc' } }),
        this.prisma.skillCategory.findMany({
          include: { skills: { orderBy: { order: 'asc' } } },
          orderBy: { order: 'asc' },
        }),
        this.prisma.contactProfile.findUnique({ where: { id: 'singleton' } }),
        this.prisma.contactChannel.findMany({ orderBy: { order: 'asc' } }),
      ]);

      return PrismaPortfolioMapper.toPortfolioAggregate({
        hero,
        roles,
        nodes,
        about,
        domains,
        pillars,
        projects,
        experiences,
        skillCategories,
        contact,
        channels,
      });
    } catch (error) {
      console.error('[PrismaPortfolioRepository] Failed to fetch portfolio data:', error);
      const wrappedError = new Error(
        `Database query failed in PrismaPortfolioRepository: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      (wrappedError as { cause?: unknown }).cause = error;
      throw wrappedError;
    }
  }
}
