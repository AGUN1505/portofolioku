// Presentation data constants (navigation, hero roles, schematic nodes)
import type {
  NavLink,
  HeroRoleViewModel,
  EngineeringNodeViewModel,
} from "../view-models";

// Re-export presentation configs
export {
  SKILL_CATEGORY_PRESENTATION_CONFIG,
  ABOUT_DOMAIN_PRESENTATION_CONFIG,
  ABOUT_PILLAR_PRESENTATION_CONFIG,
  type SkillCategoryPresentationConfig,
  type AboutDomainPresentationConfig,
  type AboutPillarPresentationConfig,
} from "./presentation-config";

export const NAV_LINKS: ReadonlyArray<NavLink> = [
  { index: "01", label: "About", href: "#about", active: true },
  { index: "02", label: "Projects", href: "#projects", active: false },
  { index: "03", label: "Experience", href: "#experience", active: false },
  { index: "04", label: "Contact", href: "#contact", active: false },
];

export const HERO_ROLES: ReadonlyArray<HeroRoleViewModel> = [
  { index: "01", title: "Software Developer", primary: true },
  { index: "02", title: "Backend Engineer", primary: true },
  { index: "03", title: "Informatics Engineering Student", primary: false },
  { index: "04", title: "Programming Instructor", primary: false },
];

export const SCHEMATIC_NODES: ReadonlyArray<EngineeringNodeViewModel> = [
  {
    tag: "01 / DECONSTRUCT",
    title: "Understand How Systems Work",
    description:
      "Analyze domain requirements, data relationships, and core problem constraints.",
    highlighted: false,
  },
  {
    tag: "02 / ARCHITECT & BUILD",
    title: "Backend & Practical Solutions",
    description:
      "Design clean REST APIs, relational schemas, and reliable application logic.",
    stack: "GO • LARAVEL • EXPRESS • POSTGRESQL",
    highlighted: true,
  },
  {
    tag: "03 / SHARE & EDUCATE",
    title: "Programming Instruction",
    description:
      "Distill complex technical systems into clear, structured learning for students.",
    highlighted: false,
  },
];

export const DEFAULT_CONTACT_CHANNELS: ReadonlyArray<{
  readonly label: string;
  readonly value: string;
}> = [];
