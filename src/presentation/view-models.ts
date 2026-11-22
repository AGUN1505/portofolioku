// Presentation types: View models with presentation config

export type { AboutDomainViewModel, AboutPillarViewModel } from "./view-models/about";

// Project view model with presentation-specific fields
export interface ProjectViewModel {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly description: string;
  readonly technologies: ReadonlyArray<string>;
  readonly thumbnailUrl?: string | null;
  readonly projectUrl?: string | null;
  readonly githubUrl?: string | null;
  // Presentation config (not domain)
  readonly desktopCategory: string;
  readonly tabletTag: string;
  readonly mobileTag: string;
  readonly desktopTitleSize: string;
  readonly mobileTitleSize: string;
  readonly mobileDescription: string;
  readonly tags: ReadonlyArray<{
    readonly label: string;
    readonly widthClass: string;
    readonly accent: boolean;
  }>;
  readonly previewHeaderLeft: string;
  readonly previewSpecTitle: string;
  readonly previewSpecSub: string;
  readonly tabletPreviewLine2: string;
  readonly mobilePreviewLine2: string;
}

// Experience view model with presentation config
export interface ExperienceViewModel {
  readonly id: string;
  readonly role: string;
  readonly institution: string;
  readonly track: string;
  // Presentation config
  readonly widthClass: string;
  readonly ruleWidthClass: string;
  readonly accentRule: boolean;
  readonly mobileInstitution?: string;
}

// Contact channel view model with presentation config
export interface ContactChannelViewModel {
  readonly label: string;
  readonly value: string;
  // Presentation config
  readonly index: string;
  readonly desktopWidth: string;
  readonly tabletWidth: string;
  readonly mobileHeight: string;
}

// Navigation link (presentation-only)
export interface NavLink {
  readonly index: string;
  readonly label: string;
  readonly href: string;
  readonly active: boolean;
}

// Hero role (domain + presentation)
export interface HeroRoleViewModel {
  readonly index: string;
  readonly title: string;
  readonly primary: boolean;
}

// Hero engineering node (domain + presentation)
export interface EngineeringNodeViewModel {
  readonly tag: string;
  readonly title: string;
  readonly description: string;
  readonly stack?: string;
  readonly highlighted: boolean;
}

// Certificate view model with presentation formatting
export interface CertificateViewModel {
  readonly id: string;
  readonly title: string;
  readonly issuer: string;
  readonly issueDate: string | null;
  readonly credentialId: string | null;
  readonly credentialUrl: string | null;
  readonly fileUrl: string;
  readonly order: number;
  readonly formattedDate?: string;
  readonly isPdf: boolean;
}
