// src/infrastructure/composition-root.ts
// Composition Root / Dependency Injection for repositories, services, and use cases

import type { IPortfolioRepository } from '../domain/repositories/portfolio.repository';
import type { Portfolio } from '../domain/entities';
import type { IAdminRepository } from '../domain/repositories/admin.repository';
import type { IRateLimiter } from '../domain/repositories/rate-limiter.interface';
import { GetPortfolioUseCase } from '../application/use-cases/get-portfolio';
import { StaticPortfolioRepository } from './repositories/static-portfolio.repository';
import { PrismaPortfolioRepository } from './repositories/prisma-portfolio.repository';
import { ResilientPortfolioRepository } from './repositories/resilient-portfolio.repository';
import { PrismaAdminRepository } from './repositories/prisma-admin.repository';
import { PasswordService, type IPasswordService } from './auth/password.service';
import { MemoryRateLimiter } from './auth/memory-rate-limiter';
import { LoginAdminUseCase } from '../application/use-cases/auth/login-admin.use-case';
import { LogoutAdminUseCase } from '../application/use-cases/auth/logout-admin.use-case';
import { BootstrapAdminUseCase } from '../application/use-cases/auth/bootstrap-admin.use-case';
import type { IHeroProfileRepository } from '../domain/repositories/hero-profile.repository';
import type { IAboutProfileRepository } from '../domain/repositories/about-profile.repository';
import type { IContactProfileRepository } from '../domain/repositories/contact-profile.repository';
import { PrismaHeroProfileRepository } from './repositories/prisma-hero-profile.repository';
import { PrismaAboutProfileRepository } from './repositories/prisma-about-profile.repository';
import { PrismaContactProfileRepository } from './repositories/prisma-contact-profile.repository';
import { GetHeroProfileUseCase } from '../application/use-cases/hero/get-hero-profile.use-case';
import { UpdateHeroProfileUseCase } from '../application/use-cases/hero/update-hero-profile.use-case';
import { GetAboutProfileUseCase } from '../application/use-cases/about/get-about-profile.use-case';
import { UpdateAboutProfileUseCase } from '../application/use-cases/about/update-about-profile.use-case';
import { GetContactProfileUseCase } from '../application/use-cases/contact/get-contact-profile.use-case';
import { UpdateContactProfileUseCase } from '../application/use-cases/contact/update-contact-profile.use-case';
import type { IProjectRepository } from '../domain/repositories/project.repository';
import type { IExperienceRepository } from '../domain/repositories/experience.repository';
import { PrismaProjectRepository } from './repositories/prisma-project.repository';
import { PrismaExperienceRepository } from './repositories/prisma-experience.repository';
import { GetProjectsUseCase } from '../application/use-cases/projects/get-projects.use-case';
import { GetProjectByIdUseCase } from '../application/use-cases/projects/get-project-by-id.use-case';
import { CreateProjectUseCase } from '../application/use-cases/projects/create-project.use-case';
import { UpdateProjectUseCase } from '../application/use-cases/projects/update-project.use-case';
import { DeleteProjectUseCase } from '../application/use-cases/projects/delete-project.use-case';
import { ReorderProjectsUseCase } from '../application/use-cases/projects/reorder-projects.use-case';
import { GetExperiencesUseCase } from '../application/use-cases/experiences/get-experiences.use-case';
import { GetExperienceByIdUseCase } from '../application/use-cases/experiences/get-experience-by-id.use-case';
import { CreateExperienceUseCase } from '../application/use-cases/experiences/create-experience.use-case';
import { UpdateExperienceUseCase } from '../application/use-cases/experiences/update-experience.use-case';
import { DeleteExperienceUseCase } from '../application/use-cases/experiences/delete-experience.use-case';
import { ReorderExperiencesUseCase } from '../application/use-cases/experiences/reorder-experiences.use-case';

// Phase 5.3: 5 Additional CMS Modules
import type { IRoleRepository } from '../domain/repositories/role.repository';
import type { IEngineeringNodeRepository } from '../domain/repositories/engineering-node.repository';
import type { IDomainRepository } from '../domain/repositories/domain.repository';
import type { IPillarRepository } from '../domain/repositories/pillar.repository';
import type { ISkillCategoryRepository } from '../domain/repositories/skill-category.repository';
import type { ISkillRepository } from '../domain/repositories/skill.repository';

import { PrismaRoleRepository } from './repositories/prisma-role.repository';
import { PrismaEngineeringNodeRepository } from './repositories/prisma-engineering-node.repository';
import { PrismaDomainRepository } from './repositories/prisma-domain.repository';
import { PrismaPillarRepository } from './repositories/prisma-pillar.repository';
import { PrismaSkillCategoryRepository } from './repositories/prisma-skill-category.repository';
import { PrismaSkillRepository } from './repositories/prisma-skill.repository';

import { GetRolesUseCase } from '../application/use-cases/roles/get-roles.use-case';
import { GetRoleByIdUseCase } from '../application/use-cases/roles/get-role-by-id.use-case';
import { CreateRoleUseCase } from '../application/use-cases/roles/create-role.use-case';
import { UpdateRoleUseCase } from '../application/use-cases/roles/update-role.use-case';
import { DeleteRoleUseCase } from '../application/use-cases/roles/delete-role.use-case';
import { ReorderRolesUseCase } from '../application/use-cases/roles/reorder-roles.use-case';

import { GetEngineeringNodesUseCase } from '../application/use-cases/engineering-nodes/get-engineering-nodes.use-case';
import { GetEngineeringNodeByIdUseCase } from '../application/use-cases/engineering-nodes/get-engineering-node-by-id.use-case';
import { CreateEngineeringNodeUseCase } from '../application/use-cases/engineering-nodes/create-engineering-node.use-case';
import { UpdateEngineeringNodeUseCase } from '../application/use-cases/engineering-nodes/update-engineering-node.use-case';
import { DeleteEngineeringNodeUseCase } from '../application/use-cases/engineering-nodes/delete-engineering-node.use-case';
import { ReorderEngineeringNodesUseCase } from '../application/use-cases/engineering-nodes/reorder-engineering-nodes.use-case';

import { GetDomainsUseCase } from '../application/use-cases/domains/get-domains.use-case';
import { GetDomainByIdUseCase } from '../application/use-cases/domains/get-domain-by-id.use-case';
import { CreateDomainUseCase } from '../application/use-cases/domains/create-domain.use-case';
import { UpdateDomainUseCase } from '../application/use-cases/domains/update-domain.use-case';
import { DeleteDomainUseCase } from '../application/use-cases/domains/delete-domain.use-case';
import { ReorderDomainsUseCase } from '../application/use-cases/domains/reorder-domains.use-case';

import { GetPillarsUseCase } from '../application/use-cases/pillars/get-pillars.use-case';
import { GetPillarByIdUseCase } from '../application/use-cases/pillars/get-pillar-by-id.use-case';
import { CreatePillarUseCase } from '../application/use-cases/pillars/create-pillar.use-case';
import { UpdatePillarUseCase } from '../application/use-cases/pillars/update-pillar.use-case';
import { DeletePillarUseCase } from '../application/use-cases/pillars/delete-pillar.use-case';
import { ReorderPillarsUseCase } from '../application/use-cases/pillars/reorder-pillars.use-case';

import { GetSkillCategoriesUseCase } from '../application/use-cases/skills/get-skill-categories.use-case';
import { CreateSkillCategoryUseCase } from '../application/use-cases/skills/create-skill-category.use-case';
import { UpdateSkillCategoryUseCase } from '../application/use-cases/skills/update-skill-category.use-case';
import { DeleteSkillCategoryUseCase } from '../application/use-cases/skills/delete-skill-category.use-case';
import { ReorderSkillCategoriesUseCase } from '../application/use-cases/skills/reorder-skill-categories.use-case';

import { CreateSkillUseCase } from '../application/use-cases/skills/create-skill.use-case';
import { UpdateSkillUseCase } from '../application/use-cases/skills/update-skill.use-case';
import { DeleteSkillUseCase } from '../application/use-cases/skills/delete-skill.use-case';
import { ReorderSkillsUseCase } from '../application/use-cases/skills/reorder-skills.use-case';

// Phase 6: Contact Channels & Admin Account Settings
import type { IContactChannelRepository } from '../domain/repositories/contact-channel.repository';
import { PrismaContactChannelRepository } from './repositories/prisma-contact-channel.repository';
import { GetContactChannelsUseCase } from '../application/use-cases/contact-channels/get-contact-channels.use-case';
import { GetContactChannelByIdUseCase } from '../application/use-cases/contact-channels/get-contact-channel-by-id.use-case';
import { CreateContactChannelUseCase } from '../application/use-cases/contact-channels/create-contact-channel.use-case';
import { UpdateContactChannelUseCase } from '../application/use-cases/contact-channels/update-contact-channel.use-case';
import { DeleteContactChannelUseCase } from '../application/use-cases/contact-channels/delete-contact-channel.use-case';
import { ReorderContactChannelsUseCase } from '../application/use-cases/contact-channels/reorder-contact-channels.use-case';
import { GetAdminAccountUseCase } from '../application/use-cases/account/get-admin-account.use-case';
import { UpdateAdminProfileUseCase } from '../application/use-cases/account/update-admin-profile.use-case';
import { ChangeAdminPasswordUseCase } from '../application/use-cases/account/change-admin-password.use-case';

// Certificates Feature
import type { ICertificateRepository } from '../domain/repositories/certificate.repository';
import { PrismaCertificateRepository } from './repositories/prisma-certificate.repository';
import { GetCertificatesUseCase } from '../application/use-cases/certificates/get-certificates.use-case';
import { CreateCertificateUseCase } from '../application/use-cases/certificates/create-certificate.use-case';
import { UpdateCertificateUseCase } from '../application/use-cases/certificates/update-certificate.use-case';
import { DeleteCertificateUseCase } from '../application/use-cases/certificates/delete-certificate.use-case';
import { ReorderCertificatesUseCase } from '../application/use-cases/certificates/reorder-certificates.use-case';

// Section Config Feature
import type { ISectionConfigRepository } from '../domain/repositories/section-config.repository';
import { PrismaSectionConfigRepository } from './repositories/prisma-section-config.repository';
import { GetSectionConfigsUseCase } from '../application/use-cases/sections/get-sections.use-case';
import { ReorderSectionConfigsUseCase } from '../application/use-cases/sections/reorder-sections.use-case';

import { prisma } from './prisma/client';

export type RepositorySource = 'static' | 'prisma' | 'resilient';

export class CompositionRoot {
  private static staticRepoInstance: StaticPortfolioRepository | null = null;
  private static prismaRepoInstance: PrismaPortfolioRepository | null = null;
  private static resilientRepoInstance: ResilientPortfolioRepository | null = null;
  private static adminRepoInstance: IAdminRepository | null = null;
  private static passwordServiceInstance: IPasswordService | null = null;
  private static rateLimiterInstance: MemoryRateLimiter | null = null;
  private static heroRepoInstance: IHeroProfileRepository | null = null;
  private static aboutRepoInstance: IAboutProfileRepository | null = null;
  private static contactRepoInstance: IContactProfileRepository | null = null;
  private static projectRepoInstance: IProjectRepository | null = null;
  private static experienceRepoInstance: IExperienceRepository | null = null;

  // Phase 5.3 Repositories
  private static roleRepoInstance: IRoleRepository | null = null;
  private static engineeringNodeRepoInstance: IEngineeringNodeRepository | null = null;
  private static domainRepoInstance: IDomainRepository | null = null;
  private static pillarRepoInstance: IPillarRepository | null = null;
  private static skillCategoryRepoInstance: ISkillCategoryRepository | null = null;
  private static skillRepoInstance: ISkillRepository | null = null;

  // Phase 6 Repositories
  private static contactChannelRepoInstance: IContactChannelRepository | null = null;

  // Certificates Feature Repository
  private static certificateRepoInstance: ICertificateRepository | null = null;

  // Section Config Feature Repository
  private static sectionConfigRepoInstance: ISectionConfigRepository | null = null;

  static getResilientPortfolioRepository(): ResilientPortfolioRepository {
    if (!CompositionRoot.resilientRepoInstance) {
      const primary = CompositionRoot.getPortfolioRepository('prisma');
      const fallback = CompositionRoot.getPortfolioRepository('static');
      CompositionRoot.resilientRepoInstance = new ResilientPortfolioRepository(primary, fallback);
    }
    return CompositionRoot.resilientRepoInstance;
  }

  static getResilientPortfolioUseCase(): GetPortfolioUseCase<Promise<Portfolio>> {
    const repository = CompositionRoot.getResilientPortfolioRepository();
    return new GetPortfolioUseCase(repository);
  }

  static getPortfolioRepository(
    source: 'static'
  ): StaticPortfolioRepository;
  static getPortfolioRepository(
    source: 'prisma'
  ): PrismaPortfolioRepository;
  static getPortfolioRepository(
    source: 'resilient'
  ): ResilientPortfolioRepository;
  static getPortfolioRepository(
    source?: RepositorySource
  ): IPortfolioRepository<Portfolio | Promise<Portfolio>>;
  static getPortfolioRepository(
    source: RepositorySource = 'static'
  ): IPortfolioRepository<Portfolio | Promise<Portfolio>> {
    if (source === 'resilient') {
      return CompositionRoot.getResilientPortfolioRepository();
    }

    if (source === 'prisma') {
      if (!CompositionRoot.prismaRepoInstance) {
        CompositionRoot.prismaRepoInstance = new PrismaPortfolioRepository(prisma);
      }
      return CompositionRoot.prismaRepoInstance;
    }

    if (!CompositionRoot.staticRepoInstance) {
      CompositionRoot.staticRepoInstance = new StaticPortfolioRepository();
    }
    return CompositionRoot.staticRepoInstance;
  }

  static getPortfolioUseCase(
    source: 'static'
  ): GetPortfolioUseCase<Portfolio>;
  static getPortfolioUseCase(
    source: 'prisma'
  ): GetPortfolioUseCase<Promise<Portfolio>>;
  static getPortfolioUseCase(
    source: 'resilient'
  ): GetPortfolioUseCase<Promise<Portfolio>>;
  static getPortfolioUseCase(
    source?: RepositorySource
  ): GetPortfolioUseCase<Portfolio | Promise<Portfolio>>;
  static getPortfolioUseCase(
    source: RepositorySource = 'static'
  ): GetPortfolioUseCase<Portfolio | Promise<Portfolio>> {
    if (source === 'resilient') {
      return CompositionRoot.getResilientPortfolioUseCase();
    }
    const repository = CompositionRoot.getPortfolioRepository(source);
    return new GetPortfolioUseCase(repository);
  }

  /**
   * Retrieves singleton instance of IAdminRepository.
   */
  static getAdminRepository(): IAdminRepository {
    if (!CompositionRoot.adminRepoInstance) {
      CompositionRoot.adminRepoInstance = new PrismaAdminRepository(prisma);
    }
    return CompositionRoot.adminRepoInstance;
  }

  /**
   * Retrieves singleton instance of IPasswordService.
   */
  static getPasswordService(): IPasswordService {
    if (!CompositionRoot.passwordServiceInstance) {
      CompositionRoot.passwordServiceInstance = new PasswordService();
    }
    return CompositionRoot.passwordServiceInstance;
  }

  /**
   * Retrieves singleton instance of IRateLimiter (MemoryRateLimiter).
   */
  static getRateLimiter(): IRateLimiter {
    if (!CompositionRoot.rateLimiterInstance) {
      CompositionRoot.rateLimiterInstance = new MemoryRateLimiter();
    }
    return CompositionRoot.rateLimiterInstance;
  }

  /**
   * Factory for LoginAdminUseCase.
   */
  static getLoginAdminUseCase(): LoginAdminUseCase {
    return new LoginAdminUseCase(
      CompositionRoot.getAdminRepository(),
      CompositionRoot.getPasswordService(),
      CompositionRoot.getRateLimiter() as MemoryRateLimiter
    );
  }

  /**
   * Factory for LogoutAdminUseCase.
   */
  static getLogoutAdminUseCase(): LogoutAdminUseCase {
    return new LogoutAdminUseCase(CompositionRoot.getAdminRepository());
  }

  /**
   * Factory for BootstrapAdminUseCase.
   */
  static getBootstrapAdminUseCase(): BootstrapAdminUseCase {
    return new BootstrapAdminUseCase(
      CompositionRoot.getAdminRepository(),
      CompositionRoot.getPasswordService()
    );
  }

  static getHeroProfileRepository(): IHeroProfileRepository {
    if (!CompositionRoot.heroRepoInstance) {
      CompositionRoot.heroRepoInstance = new PrismaHeroProfileRepository(prisma);
    }
    return CompositionRoot.heroRepoInstance;
  }

  static getGetHeroProfileUseCase(): GetHeroProfileUseCase {
    return new GetHeroProfileUseCase(CompositionRoot.getHeroProfileRepository());
  }

  static getUpdateHeroProfileUseCase(): UpdateHeroProfileUseCase {
    return new UpdateHeroProfileUseCase(CompositionRoot.getHeroProfileRepository());
  }

  static getAboutProfileRepository(): IAboutProfileRepository {
    if (!CompositionRoot.aboutRepoInstance) {
      CompositionRoot.aboutRepoInstance = new PrismaAboutProfileRepository(prisma);
    }
    return CompositionRoot.aboutRepoInstance;
  }

  static getGetAboutProfileUseCase(): GetAboutProfileUseCase {
    return new GetAboutProfileUseCase(CompositionRoot.getAboutProfileRepository());
  }

  static getUpdateAboutProfileUseCase(): UpdateAboutProfileUseCase {
    return new UpdateAboutProfileUseCase(CompositionRoot.getAboutProfileRepository());
  }

  static getContactProfileRepository(): IContactProfileRepository {
    if (!CompositionRoot.contactRepoInstance) {
      CompositionRoot.contactRepoInstance = new PrismaContactProfileRepository(prisma);
    }
    return CompositionRoot.contactRepoInstance;
  }

  static getGetContactProfileUseCase(): GetContactProfileUseCase {
    return new GetContactProfileUseCase(CompositionRoot.getContactProfileRepository());
  }

  static getUpdateContactProfileUseCase(): UpdateContactProfileUseCase {
    return new UpdateContactProfileUseCase(CompositionRoot.getContactProfileRepository());
  }

  static getProjectRepository(): IProjectRepository {
    if (!CompositionRoot.projectRepoInstance) {
      CompositionRoot.projectRepoInstance = new PrismaProjectRepository(prisma);
    }
    return CompositionRoot.projectRepoInstance;
  }

  static getGetProjectsUseCase(): GetProjectsUseCase {
    return new GetProjectsUseCase(CompositionRoot.getProjectRepository());
  }

  static getGetProjectByIdUseCase(): GetProjectByIdUseCase {
    return new GetProjectByIdUseCase(CompositionRoot.getProjectRepository());
  }

  static getCreateProjectUseCase(): CreateProjectUseCase {
    return new CreateProjectUseCase(CompositionRoot.getProjectRepository());
  }

  static getUpdateProjectUseCase(): UpdateProjectUseCase {
    return new UpdateProjectUseCase(CompositionRoot.getProjectRepository());
  }

  static getDeleteProjectUseCase(): DeleteProjectUseCase {
    return new DeleteProjectUseCase(CompositionRoot.getProjectRepository());
  }

  static getReorderProjectsUseCase(): ReorderProjectsUseCase {
    return new ReorderProjectsUseCase(CompositionRoot.getProjectRepository());
  }

  static getExperienceRepository(): IExperienceRepository {
    if (!CompositionRoot.experienceRepoInstance) {
      CompositionRoot.experienceRepoInstance = new PrismaExperienceRepository(prisma);
    }
    return CompositionRoot.experienceRepoInstance;
  }

  static getGetExperiencesUseCase(): GetExperiencesUseCase {
    return new GetExperiencesUseCase(CompositionRoot.getExperienceRepository());
  }

  static getGetExperienceByIdUseCase(): GetExperienceByIdUseCase {
    return new GetExperienceByIdUseCase(CompositionRoot.getExperienceRepository());
  }

  static getCreateExperienceUseCase(): CreateExperienceUseCase {
    return new CreateExperienceUseCase(CompositionRoot.getExperienceRepository());
  }

  static getUpdateExperienceUseCase(): UpdateExperienceUseCase {
    return new UpdateExperienceUseCase(CompositionRoot.getExperienceRepository());
  }

  static getDeleteExperienceUseCase(): DeleteExperienceUseCase {
    return new DeleteExperienceUseCase(CompositionRoot.getExperienceRepository());
  }

  static getReorderExperiencesUseCase(): ReorderExperiencesUseCase {
    return new ReorderExperiencesUseCase(CompositionRoot.getExperienceRepository());
  }

  // ============================================================
  // PHASE 5.3: ROLES
  // ============================================================

  static getRoleRepository(): IRoleRepository {
    if (!CompositionRoot.roleRepoInstance) {
      CompositionRoot.roleRepoInstance = new PrismaRoleRepository(prisma);
    }
    return CompositionRoot.roleRepoInstance;
  }

  static getGetRolesUseCase(): GetRolesUseCase {
    return new GetRolesUseCase(CompositionRoot.getRoleRepository());
  }

  static getGetRoleByIdUseCase(): GetRoleByIdUseCase {
    return new GetRoleByIdUseCase(CompositionRoot.getRoleRepository());
  }

  static getCreateRoleUseCase(): CreateRoleUseCase {
    return new CreateRoleUseCase(CompositionRoot.getRoleRepository());
  }

  static getUpdateRoleUseCase(): UpdateRoleUseCase {
    return new UpdateRoleUseCase(CompositionRoot.getRoleRepository());
  }

  static getDeleteRoleUseCase(): DeleteRoleUseCase {
    return new DeleteRoleUseCase(CompositionRoot.getRoleRepository());
  }

  static getReorderRolesUseCase(): ReorderRolesUseCase {
    return new ReorderRolesUseCase(CompositionRoot.getRoleRepository());
  }

  // ============================================================
  // PHASE 5.3: ENGINEERING NODES
  // ============================================================

  static getEngineeringNodeRepository(): IEngineeringNodeRepository {
    if (!CompositionRoot.engineeringNodeRepoInstance) {
      CompositionRoot.engineeringNodeRepoInstance = new PrismaEngineeringNodeRepository(prisma);
    }
    return CompositionRoot.engineeringNodeRepoInstance;
  }

  static getGetEngineeringNodesUseCase(): GetEngineeringNodesUseCase {
    return new GetEngineeringNodesUseCase(CompositionRoot.getEngineeringNodeRepository());
  }

  static getGetEngineeringNodeByIdUseCase(): GetEngineeringNodeByIdUseCase {
    return new GetEngineeringNodeByIdUseCase(CompositionRoot.getEngineeringNodeRepository());
  }

  static getCreateEngineeringNodeUseCase(): CreateEngineeringNodeUseCase {
    return new CreateEngineeringNodeUseCase(CompositionRoot.getEngineeringNodeRepository());
  }

  static getUpdateEngineeringNodeUseCase(): UpdateEngineeringNodeUseCase {
    return new UpdateEngineeringNodeUseCase(CompositionRoot.getEngineeringNodeRepository());
  }

  static getDeleteEngineeringNodeUseCase(): DeleteEngineeringNodeUseCase {
    return new DeleteEngineeringNodeUseCase(CompositionRoot.getEngineeringNodeRepository());
  }

  static getReorderEngineeringNodesUseCase(): ReorderEngineeringNodesUseCase {
    return new ReorderEngineeringNodesUseCase(CompositionRoot.getEngineeringNodeRepository());
  }

  // ============================================================
  // PHASE 5.3: DOMAINS
  // ============================================================

  static getDomainRepository(): IDomainRepository {
    if (!CompositionRoot.domainRepoInstance) {
      CompositionRoot.domainRepoInstance = new PrismaDomainRepository(prisma);
    }
    return CompositionRoot.domainRepoInstance;
  }

  static getGetDomainsUseCase(): GetDomainsUseCase {
    return new GetDomainsUseCase(CompositionRoot.getDomainRepository());
  }

  static getGetDomainByIdUseCase(): GetDomainByIdUseCase {
    return new GetDomainByIdUseCase(CompositionRoot.getDomainRepository());
  }

  static getCreateDomainUseCase(): CreateDomainUseCase {
    return new CreateDomainUseCase(CompositionRoot.getDomainRepository());
  }

  static getUpdateDomainUseCase(): UpdateDomainUseCase {
    return new UpdateDomainUseCase(CompositionRoot.getDomainRepository());
  }

  static getDeleteDomainUseCase(): DeleteDomainUseCase {
    return new DeleteDomainUseCase(CompositionRoot.getDomainRepository());
  }

  static getReorderDomainsUseCase(): ReorderDomainsUseCase {
    return new ReorderDomainsUseCase(CompositionRoot.getDomainRepository());
  }

  // ============================================================
  // PHASE 5.3: PILLARS
  // ============================================================

  static getPillarRepository(): IPillarRepository {
    if (!CompositionRoot.pillarRepoInstance) {
      CompositionRoot.pillarRepoInstance = new PrismaPillarRepository(prisma);
    }
    return CompositionRoot.pillarRepoInstance;
  }

  static getGetPillarsUseCase(): GetPillarsUseCase {
    return new GetPillarsUseCase(CompositionRoot.getPillarRepository());
  }

  static getGetPillarByIdUseCase(): GetPillarByIdUseCase {
    return new GetPillarByIdUseCase(CompositionRoot.getPillarRepository());
  }

  static getCreatePillarUseCase(): CreatePillarUseCase {
    return new CreatePillarUseCase(CompositionRoot.getPillarRepository());
  }

  static getUpdatePillarUseCase(): UpdatePillarUseCase {
    return new UpdatePillarUseCase(CompositionRoot.getPillarRepository());
  }

  static getDeletePillarUseCase(): DeletePillarUseCase {
    return new DeletePillarUseCase(CompositionRoot.getPillarRepository());
  }

  static getReorderPillarsUseCase(): ReorderPillarsUseCase {
    return new ReorderPillarsUseCase(CompositionRoot.getPillarRepository());
  }

  // ============================================================
  // PHASE 5.3: SKILL CATEGORIES
  // ============================================================

  static getSkillCategoryRepository(): ISkillCategoryRepository {
    if (!CompositionRoot.skillCategoryRepoInstance) {
      CompositionRoot.skillCategoryRepoInstance = new PrismaSkillCategoryRepository(prisma);
    }
    return CompositionRoot.skillCategoryRepoInstance;
  }

  static getGetSkillCategoriesUseCase(): GetSkillCategoriesUseCase {
    return new GetSkillCategoriesUseCase(CompositionRoot.getSkillCategoryRepository());
  }

  static getCreateSkillCategoryUseCase(): CreateSkillCategoryUseCase {
    return new CreateSkillCategoryUseCase(CompositionRoot.getSkillCategoryRepository());
  }

  static getUpdateSkillCategoryUseCase(): UpdateSkillCategoryUseCase {
    return new UpdateSkillCategoryUseCase(CompositionRoot.getSkillCategoryRepository());
  }

  static getDeleteSkillCategoryUseCase(): DeleteSkillCategoryUseCase {
    return new DeleteSkillCategoryUseCase(
      CompositionRoot.getSkillCategoryRepository(),
      CompositionRoot.getSkillRepository()
    );
  }

  static getReorderSkillCategoriesUseCase(): ReorderSkillCategoriesUseCase {
    return new ReorderSkillCategoriesUseCase(CompositionRoot.getSkillCategoryRepository());
  }

  // ============================================================
  // PHASE 5.3: SKILLS
  // ============================================================

  static getSkillRepository(): ISkillRepository {
    if (!CompositionRoot.skillRepoInstance) {
      CompositionRoot.skillRepoInstance = new PrismaSkillRepository(prisma);
    }
    return CompositionRoot.skillRepoInstance;
  }

  static getCreateSkillUseCase(): CreateSkillUseCase {
    return new CreateSkillUseCase(
      CompositionRoot.getSkillRepository(),
      CompositionRoot.getSkillCategoryRepository()
    );
  }

  static getUpdateSkillUseCase(): UpdateSkillUseCase {
    return new UpdateSkillUseCase(
      CompositionRoot.getSkillRepository(),
      CompositionRoot.getSkillCategoryRepository()
    );
  }

  static getDeleteSkillUseCase(): DeleteSkillUseCase {
    return new DeleteSkillUseCase(CompositionRoot.getSkillRepository());
  }

  static getReorderSkillsUseCase(): ReorderSkillsUseCase {
    return new ReorderSkillsUseCase(
      CompositionRoot.getSkillRepository(),
      CompositionRoot.getSkillCategoryRepository()
    );
  }

  // ============================================================
  // PHASE 6: CONTACT CHANNELS
  // ============================================================

  static getContactChannelRepository(): IContactChannelRepository {
    if (!CompositionRoot.contactChannelRepoInstance) {
      CompositionRoot.contactChannelRepoInstance = new PrismaContactChannelRepository(prisma);
    }
    return CompositionRoot.contactChannelRepoInstance;
  }

  static getGetContactChannelsUseCase(): GetContactChannelsUseCase {
    return new GetContactChannelsUseCase(CompositionRoot.getContactChannelRepository());
  }

  static getGetContactChannelByIdUseCase(): GetContactChannelByIdUseCase {
    return new GetContactChannelByIdUseCase(CompositionRoot.getContactChannelRepository());
  }

  static getCreateContactChannelUseCase(): CreateContactChannelUseCase {
    return new CreateContactChannelUseCase(CompositionRoot.getContactChannelRepository());
  }

  static getUpdateContactChannelUseCase(): UpdateContactChannelUseCase {
    return new UpdateContactChannelUseCase(CompositionRoot.getContactChannelRepository());
  }

  static getDeleteContactChannelUseCase(): DeleteContactChannelUseCase {
    return new DeleteContactChannelUseCase(CompositionRoot.getContactChannelRepository());
  }

  static getReorderContactChannelsUseCase(): ReorderContactChannelsUseCase {
    return new ReorderContactChannelsUseCase(CompositionRoot.getContactChannelRepository());
  }

  // ============================================================
  // PHASE 6: ADMIN ACCOUNT SETTINGS
  // ============================================================

  static getGetAdminAccountUseCase(): GetAdminAccountUseCase {
    return new GetAdminAccountUseCase(CompositionRoot.getAdminRepository());
  }

  static getUpdateAdminProfileUseCase(): UpdateAdminProfileUseCase {
    return new UpdateAdminProfileUseCase(
      CompositionRoot.getAdminRepository(),
      CompositionRoot.getPasswordService()
    );
  }

  static getChangeAdminPasswordUseCase(): ChangeAdminPasswordUseCase {
    return new ChangeAdminPasswordUseCase(
      CompositionRoot.getAdminRepository(),
      CompositionRoot.getPasswordService()
    );
  }

  // ============================================================
  // CERTIFICATES FEATURE
  // ============================================================

  static getCertificateRepository(): ICertificateRepository {
    if (!CompositionRoot.certificateRepoInstance) {
      CompositionRoot.certificateRepoInstance = new PrismaCertificateRepository(prisma);
    }
    return CompositionRoot.certificateRepoInstance;
  }

  static getGetCertificatesUseCase(): GetCertificatesUseCase {
    return new GetCertificatesUseCase(CompositionRoot.getCertificateRepository());
  }

  static getCertificatesUseCase(): GetCertificatesUseCase {
    return CompositionRoot.getGetCertificatesUseCase();
  }

  static getCreateCertificateUseCase(): CreateCertificateUseCase {
    return new CreateCertificateUseCase(CompositionRoot.getCertificateRepository());
  }

  static getUpdateCertificateUseCase(): UpdateCertificateUseCase {
    return new UpdateCertificateUseCase(CompositionRoot.getCertificateRepository());
  }

  static getDeleteCertificateUseCase(): DeleteCertificateUseCase {
    return new DeleteCertificateUseCase(CompositionRoot.getCertificateRepository());
  }

  static getReorderCertificatesUseCase(): ReorderCertificatesUseCase {
    return new ReorderCertificatesUseCase(CompositionRoot.getCertificateRepository());
  }

  static getSectionConfigRepository(): ISectionConfigRepository {
    if (!CompositionRoot.sectionConfigRepoInstance) {
      CompositionRoot.sectionConfigRepoInstance = new PrismaSectionConfigRepository(prisma);
    }
    return CompositionRoot.sectionConfigRepoInstance;
  }

  static getGetSectionConfigsUseCase(): GetSectionConfigsUseCase {
    return new GetSectionConfigsUseCase(CompositionRoot.getSectionConfigRepository());
  }

  static getSectionConfigsUseCase(): GetSectionConfigsUseCase {
    return CompositionRoot.getGetSectionConfigsUseCase();
  }

  static getReorderSectionConfigsUseCase(): ReorderSectionConfigsUseCase {
    return new ReorderSectionConfigsUseCase(CompositionRoot.getSectionConfigRepository());
  }

  /**
   * Reset all singletons (for isolated testing).
   */
  static resetForTesting(): void {
    CompositionRoot.staticRepoInstance = null;
    CompositionRoot.prismaRepoInstance = null;
    CompositionRoot.resilientRepoInstance = null;
    CompositionRoot.adminRepoInstance = null;
    CompositionRoot.passwordServiceInstance = null;
    CompositionRoot.rateLimiterInstance = null;
    CompositionRoot.heroRepoInstance = null;
    CompositionRoot.aboutRepoInstance = null;
    CompositionRoot.contactRepoInstance = null;
    CompositionRoot.projectRepoInstance = null;
    CompositionRoot.experienceRepoInstance = null;

    // Phase 5.3 singletons
    CompositionRoot.roleRepoInstance = null;
    CompositionRoot.engineeringNodeRepoInstance = null;
    CompositionRoot.domainRepoInstance = null;
    CompositionRoot.pillarRepoInstance = null;
    CompositionRoot.skillCategoryRepoInstance = null;
    CompositionRoot.skillRepoInstance = null;

    // Phase 6 singletons
    CompositionRoot.contactChannelRepoInstance = null;

    // Certificates singleton
    CompositionRoot.certificateRepoInstance = null;

    // Section Config singleton
    CompositionRoot.sectionConfigRepoInstance = null;
  }
}
