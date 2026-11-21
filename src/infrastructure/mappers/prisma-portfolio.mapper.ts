// src/infrastructure/mappers/prisma-portfolio.mapper.ts
import type {
  HeroProfile as PrismaHero,
  Role as PrismaRole,
  EngineeringNode as PrismaNode,
  AboutProfile as PrismaAbout,
  Domain as PrismaDomain,
  Pillar as PrismaPillar,
  Project as PrismaProject,
  Experience as PrismaExperience,
  SkillCategory as PrismaCategory,
  Skill as PrismaSkill,
  ContactProfile as PrismaContact,
  ContactChannel as PrismaChannel,
  Certificate as PrismaCertificate,
  SectionConfig as PrismaSectionConfig,
} from '@prisma/client';

import type {
  Portfolio,
  HeroProfile as DomainHero,
  AboutProfile as DomainAbout,
  Project as DomainProject,
  Experience as DomainExperience,
  SkillTaxonomy as DomainSkills,
  ContactProfile as DomainContact,
  Certificate as DomainCertificate,
  SectionConfig as DomainSectionConfig,
} from '../../domain/entities';

export class PrismaPortfolioMapper {
  static toHeroProfile(
    hero: PrismaHero | null,
    roles: PrismaRole[],
    nodes: PrismaNode[]
  ): DomainHero {
    if (!hero) {
      return {
        name: '',
        tagline: '',
        bio: '',
        location: { country: '', timezone: '', code: '' },
        roles: [],
        engineeringNodes: [],
        discipline: '',
      };
    }

    return {
      id: hero.id,
      name: hero.name,
      tagline: hero.tagline,
      bio: hero.bio,
      location: {
        country: hero.country,
        timezone: hero.timezone,
        code: hero.code,
      },
      roles: roles.map((r) => ({
        title: r.title,
        primary: r.primary,
      })),
      engineeringNodes: nodes.map((n) => ({
        tag: n.tag,
        title: n.title,
        description: n.description,
        stack: n.stack ?? undefined,
        highlighted: n.highlighted,
      })),
      discipline: hero.discipline,
      createdAt: hero.createdAt,
      updatedAt: hero.updatedAt,
    };
  }

  static toAboutProfile(
    about: PrismaAbout | null,
    domains: PrismaDomain[],
    pillars: PrismaPillar[]
  ): DomainAbout {
    if (!about) {
      return {
        heading: '',
        quote: '',
        narratives: { primary: '', secondary: '' },
        domains: [],
        pillars: [],
      };
    }

    return {
      id: about.id,
      heading: about.heading,
      quote: about.quote,
      narratives: {
        primary: about.primaryNarrative,
        secondary: about.secondaryNarrative,
      },
      domains: domains.map((d) => ({
        index: d.index,
        title: d.title,
      })),
      pillars: pillars.map((p) => ({
        index: p.index,
        title: p.title,
        description: p.description,
      })),
      createdAt: about.createdAt,
      updatedAt: about.updatedAt,
    };
  }

  static toProject(p: PrismaProject): DomainProject {
    const rawTech = p.technologies;
    const technologies: string[] = Array.isArray(rawTech)
      ? (rawTech as string[])
      : typeof rawTech === 'string'
      ? JSON.parse(rawTech)
      : [];

    // Normalize project_01 -> 01 for presentation config compatibility
    const normalizedId = p.id.startsWith('project_')
      ? p.id.replace('project_', '')
      : p.id;

    return {
      id: normalizedId,
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

  static toExperience(e: PrismaExperience): DomainExperience {
    // Normalize exp_01 -> 01 for presentation config compatibility
    const normalizedId = e.id.startsWith('exp_')
      ? e.id.replace('exp_', '')
      : e.id;

    return {
      id: normalizedId,
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

  static toSkillTaxonomy(
    categories: (PrismaCategory & { skills: PrismaSkill[] })[]
  ): DomainSkills {
    return {
      categories: categories.map((cat) => ({
        title: cat.title,
        skills: cat.skills.map((s) => s.name),
      })),
    };
  }

  static toContactProfile(
    contact: PrismaContact | null,
    channels: PrismaChannel[]
  ): DomainContact {
    if (!contact) {
      return {
        heading: '',
        ctaLabel: '',
        description: '',
        channels: [],
      };
    }

    return {
      id: contact.id,
      heading: contact.heading,
      ctaLabel: contact.ctaLabel,
      description: contact.description,
      channels: channels.map((c) => ({
        label: c.label,
        value: c.value,
      })),
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt,
    };
  }

  static toCertificate(c: PrismaCertificate): DomainCertificate {
    return {
      id: c.id,
      title: c.title,
      issuer: c.issuer,
      issueDate: c.issueDate,
      credentialId: c.credentialId,
      credentialUrl: c.credentialUrl,
      fileUrl: c.fileUrl,
      order: c.order,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }

  static toSectionConfig(s: PrismaSectionConfig): DomainSectionConfig {
    return {
      id: s.id,
      key: s.key,
      label: s.label,
      order: s.order,
      enabled: s.enabled,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  }

  static toPortfolioAggregate(data: {
    hero: PrismaHero | null;
    roles: PrismaRole[];
    nodes: PrismaNode[];
    about: PrismaAbout | null;
    domains: PrismaDomain[];
    pillars: PrismaPillar[];
    projects: PrismaProject[];
    experiences: PrismaExperience[];
    skillCategories: (PrismaCategory & { skills: PrismaSkill[] })[];
    contact: PrismaContact | null;
    channels: PrismaChannel[];
    certificates: PrismaCertificate[];
    sections?: PrismaSectionConfig[];
  }): Portfolio {
    return {
      hero: PrismaPortfolioMapper.toHeroProfile(data.hero, data.roles, data.nodes),
      about: PrismaPortfolioMapper.toAboutProfile(data.about, data.domains, data.pillars),
      projects: data.projects.map(PrismaPortfolioMapper.toProject),
      experiences: data.experiences.map(PrismaPortfolioMapper.toExperience),
      skills: PrismaPortfolioMapper.toSkillTaxonomy(data.skillCategories),
      contact: PrismaPortfolioMapper.toContactProfile(data.contact, data.channels),
      certificates: Array.isArray(data.certificates)
        ? data.certificates.map(PrismaPortfolioMapper.toCertificate)
        : [],
      sections: Array.isArray(data.sections)
        ? [...data.sections]
            .sort((a, b) => a.order - b.order)
            .map(PrismaPortfolioMapper.toSectionConfig)
        : [],
    };
  }
}
