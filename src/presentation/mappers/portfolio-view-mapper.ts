// Presentation mapper: combines domain data + presentation config → view models
import type { Project, Experience, ContactProfile, Certificate } from "../../domain/entities";
import type {
  ProjectViewModel,
  ExperienceViewModel,
  ContactChannelViewModel,
  HeroRoleViewModel,
  EngineeringNodeViewModel,
  CertificateViewModel,
} from "../view-models";
import {
  PROJECT_PRESENTATION_CONFIG,
  EXPERIENCE_PRESENTATION_CONFIG,
  CONTACT_PRESENTATION_CONFIG,
} from "../data/presentation-config";
import {
  HERO_ROLES,
  SCHEMATIC_NODES,
  DEFAULT_CONTACT_CHANNELS,
} from "../data/constants";

function isAuthenticContactChannel(channel?: {
  readonly label?: string;
  readonly value?: string;
}): boolean {
  if (!channel || !channel.value || typeof channel.value !== "string") {
    return false;
  }
  const val = channel.value.trim();
  if (val.length === 0) {
    return false;
  }
  const lower = val.toLowerCase();
  return !(
    lower.includes("placeholder") ||
    val.includes("[") ||
    val.includes("]") ||
    lower.includes("ready for official")
  );
}

export class PortfolioViewMapper {
  static toHeroRoleViewModels(
    roles?: ReadonlyArray<{ readonly title: string; readonly primary: boolean }>
  ): ReadonlyArray<HeroRoleViewModel> {
    if (!roles || roles.length === 0) {
      return HERO_ROLES;
    }
    return roles.map((role, idx) => ({
      index: String(idx + 1).padStart(2, "0"),
      title: role.title,
      primary: role.primary,
    }));
  }

  static toEngineeringNodeViewModels(
    nodes?: ReadonlyArray<{
      readonly tag: string;
      readonly title: string;
      readonly description: string;
      readonly stack?: string;
      readonly highlighted: boolean;
    }>
  ): ReadonlyArray<EngineeringNodeViewModel> {
    if (!nodes || nodes.length === 0) {
      return SCHEMATIC_NODES;
    }
    return nodes.map((node) => ({
      tag: node.tag,
      title: node.title,
      description: node.description,
      stack: node.stack,
      highlighted: node.highlighted,
    }));
  }

  static toContactChannelViewModels(
    channels?: ReadonlyArray<{ readonly label: string; readonly value: string }>
  ): ReadonlyArray<ContactChannelViewModel> {
    const rawChannels =
      channels && channels.length > 0 ? channels : DEFAULT_CONTACT_CHANNELS;
    const authenticChannels = rawChannels.filter(isAuthenticContactChannel);

    return authenticChannels.map((channel, idx) =>
      PortfolioViewMapper.toContactChannelViewModel(channel, idx)
    );
  }

  static toProjectViewModel(project: Project): ProjectViewModel {
    const config = PROJECT_PRESENTATION_CONFIG.find((c) => c.id === project.id);

    return {
      // Domain content
      id: project.id,
      title: project.title,
      category: project.category,
      description: project.description,
      technologies: project.technologies,
      thumbnailUrl: project.thumbnailUrl ?? null,
      projectUrl: project.projectUrl ?? null,
      githubUrl: project.githubUrl ?? null,
      // Presentation config
      desktopCategory: `// ${project.category.toUpperCase()}`,
      tabletTag: PortfolioViewMapper.buildProjectTabletTag(project),
      mobileTag: PortfolioViewMapper.buildProjectMobileTag(project),
      desktopTitleSize: config?.desktopTitleSize ?? "text-[32px] leading-[39px]",
      mobileTitleSize: config?.mobileTitleSize ?? "text-[22px] leading-[27px]",
      mobileDescription: PortfolioViewMapper.buildProjectMobileDescription(project),
      tags: project.technologies.map((tech, idx) => ({
        label: tech.toUpperCase(),
        widthClass: config?.tagWidths[idx]?.widthClass ?? "w-[100px]",
        accent: config?.tagWidths[idx]?.accent ?? false,
      })),
      previewHeaderLeft: `PREVIEW PLACEHOLDER // PRJ-${project.id} (${PortfolioViewMapper.buildProjectPreviewCode(project)})`,
      previewSpecTitle: PortfolioViewMapper.buildProjectPreviewTitle(project),
      previewSpecSub: "Reserved for authentic project screenshot.",
      tabletPreviewLine2: `${project.title} — Proportional 16:7 Preview Area`,
      mobilePreviewLine2: `${project.title} (16:7 Preview)`,
    };
  }

  static toExperienceViewModel(experience: Experience): ExperienceViewModel {
    const config = EXPERIENCE_PRESENTATION_CONFIG.find((c) => c.id === experience.id);

    return {
      // Domain content
      id: experience.id,
      role: experience.role,
      institution: experience.institution,
      track: experience.track,
      // Presentation config
      widthClass: config?.widthClass ?? "w-[220px]",
      ruleWidthClass: config?.ruleWidthClass ?? "w-[260px]",
      accentRule: config?.accentRule ?? false,
      mobileInstitution: config?.mobileInstitutionShort ?? experience.institution,
    };
  }

  static toContactChannelViewModel(
    channel: ContactProfile["channels"][number],
    index: number
  ): ContactChannelViewModel {
    const config = CONTACT_PRESENTATION_CONFIG[index];

    return {
      // Domain content
      label: channel.label,
      value: channel.value,
      // Presentation config
      index: config?.index ?? String(index + 1).padStart(2, "0"),
      desktopWidth: config?.desktopWidth ?? "w-[580px]",
      tabletWidth: config?.tabletWidth ?? "w-[688px]",
      mobileHeight: config?.mobileHeight ?? "min-h-[68px]",
    };
  }

  static toCertificateViewModel(certificate: Certificate): CertificateViewModel {
    let formattedDate = '';
    if (certificate.issueDate) {
      const d = new Date(certificate.issueDate);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
        });
      }
    }

    const isPdf =
      typeof certificate.fileUrl === 'string' &&
      certificate.fileUrl.toLowerCase().endsWith('.pdf');

    return {
      id: certificate.id,
      title: certificate.title,
      issuer: certificate.issuer,
      issueDate: certificate.issueDate
        ? certificate.issueDate instanceof Date
          ? certificate.issueDate.toISOString()
          : String(certificate.issueDate)
        : null,
      credentialId: certificate.credentialId ?? null,
      credentialUrl: certificate.credentialUrl ?? null,
      fileUrl: certificate.fileUrl,
      order: certificate.order,
      formattedDate: formattedDate || undefined,
      isPdf,
    };
  }

  // Helper: Build project tablet tag
  private static buildProjectTabletTag(project: Project): string {
    const stack = project.technologies.map((t) => t.toUpperCase()).join(" • ");
    return stack.length > 0
      ? `${project.id} // ${project.category.toUpperCase()}   |   STACK: ${stack}`
      : `${project.id} // ${project.category.toUpperCase()}`;
  }

  // Helper: Build project mobile tag
  private static buildProjectMobileTag(project: Project): string {
    const stack = project.technologies.map((t) => t.toUpperCase()).join(" • ");
    return stack.length > 0 ? `${project.id} // ${stack}` : `${project.id}`;
  }

  // Helper: Build mobile description (shortened)
  private static buildProjectMobileDescription(project: Project): string {
    // Shorten long descriptions for mobile
    if (project.description.length > 100) {
      const sentences = project.description.split(".");
      return sentences[0] + ".";
    }
    return project.description;
  }

  // Helper: Build project preview code
  private static buildProjectPreviewCode(project: Project): string {
    return project.title
      .toUpperCase()
      .replace(/\s+/g, " ")
      .substring(0, 30);
  }

  // Helper: Build project preview title
  private static buildProjectPreviewTitle(project: Project): string {
    return `${project.title} — ${project.category}`;
  }
}
