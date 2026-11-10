// Pure presentation configuration (Tailwind classes, responsive variants, visual rules)
// NO portfolio content - all content comes from domain repository

export interface ProjectPresentationConfig {
  readonly id: string;
  readonly desktopTitleSize: string;
  readonly mobileTitleSize: string;
  readonly tagWidths: ReadonlyArray<{ readonly widthClass: string; readonly accent: boolean }>;
}

export interface ExperiencePresentationConfig {
  readonly id: string;
  readonly widthClass: string;
  readonly ruleWidthClass: string;
  readonly accentRule: boolean;
  readonly mobileInstitutionShort?: string;
}

export interface ContactPresentationConfig {
  readonly index: string;
  readonly desktopWidth: string;
  readonly tabletWidth: string;
  readonly mobileHeight: string;
}

export interface SkillCategoryPresentationConfig {
  readonly desktopIndex: string;
  readonly tabletTitle: string;
  readonly mobileTitle: string;
  readonly ruleWidthClass: string;
  readonly accentRule: boolean;
}

export interface AboutDomainPresentationConfig {
  readonly index: string;
  readonly tabletTitleShort?: string;
}

export interface AboutPillarPresentationConfig {
  readonly index: string;
  readonly compactDescShort?: string;
  readonly accent: boolean;
}

export const PROJECT_PRESENTATION_CONFIG: ReadonlyArray<ProjectPresentationConfig> = [
  {
    id: "01",
    desktopTitleSize: "text-[32px] leading-[39px]",
    mobileTitleSize: "text-[22px] leading-[27px]",
    tagWidths: [
      { widthClass: "w-[92px]", accent: false },
      { widthClass: "w-[92px]", accent: false },
      { widthClass: "w-[100px]", accent: false },
    ],
  },
  {
    id: "02",
    desktopTitleSize: "text-[32px] leading-[39px]",
    mobileTitleSize: "text-[22px] leading-[27px]",
    tagWidths: [{ widthClass: "w-[184px]", accent: false }],
  },
  {
    id: "03",
    desktopTitleSize: "text-[30px] leading-[36px]",
    mobileTitleSize: "text-[21px] leading-[25px]",
    tagWidths: [
      { widthClass: "w-[80px]", accent: false },
      { widthClass: "w-[112px]", accent: false },
      { widthClass: "w-[112px]", accent: false },
      { widthClass: "w-[132px]", accent: true },
    ],
  },
];

export const EXPERIENCE_PRESENTATION_CONFIG: ReadonlyArray<ExperiencePresentationConfig> = [
  {
    id: "01",
    widthClass: "w-[195px]",
    ruleWidthClass: "w-[280px]",
    accentRule: true,
  },
  {
    id: "02",
    widthClass: "w-[228px]",
    ruleWidthClass: "w-[260px]",
    accentRule: false,
    mobileInstitutionShort: "SMK Negeri 2 Jambi",
  },
  {
    id: "03",
    widthClass: "w-[186px]",
    ruleWidthClass: "w-[260px]",
    accentRule: false,
  },
  {
    id: "04",
    widthClass: "w-[264px]",
    ruleWidthClass: "w-[280px]",
    accentRule: true,
    mobileInstitutionShort: "Tech Systems",
  },
  {
    id: "05",
    widthClass: "w-[256px]",
    ruleWidthClass: "w-[260px]",
    accentRule: false,
    mobileInstitutionShort: "Independent Web",
  },
];

export const CONTACT_PRESENTATION_CONFIG: ReadonlyArray<ContactPresentationConfig> = [
  {
    index: "01",
    desktopWidth: "w-[580px]",
    tabletWidth: "w-[688px]",
    mobileHeight: "min-h-[68px]",
  },
  {
    index: "02",
    desktopWidth: "w-[580px]",
    tabletWidth: "w-[688px]",
    mobileHeight: "min-h-[68px]",
  },
  {
    index: "03",
    desktopWidth: "w-[580px]",
    tabletWidth: "w-[688px]",
    mobileHeight: "min-h-[68px]",
  },
];

export const SKILL_CATEGORY_PRESENTATION_CONFIG: ReadonlyArray<SkillCategoryPresentationConfig> = [
  {
    desktopIndex: "01 // BACKEND",
    tabletTitle: "01 // BACKEND ENGINEERING",
    mobileTitle: "01 // BACKEND ENGINEERING",
    ruleWidthClass: "w-[280px]",
    accentRule: true,
  },
  {
    desktopIndex: "02 // FRONTEND",
    tabletTitle: "02 // FRONTEND & MOBILE",
    mobileTitle: "02 // FRONTEND & MOBILE",
    ruleWidthClass: "w-[260px]",
    accentRule: false,
  },
  {
    desktopIndex: "03 // DATABASE",
    tabletTitle: "03 // DATABASE ENGINE",
    mobileTitle: "03 // RELATIONAL DATABASE",
    ruleWidthClass: "w-[260px]",
    accentRule: false,
  },
  {
    desktopIndex: "04 // TOOLS",
    tabletTitle: "04 // TOOLS & WORKFLOW",
    mobileTitle: "04 // DEVOPS & TOOLING",
    ruleWidthClass: "w-[280px]",
    accentRule: false,
  },
];

export const ABOUT_DOMAIN_PRESENTATION_CONFIG: ReadonlyArray<AboutDomainPresentationConfig> = [
  { index: "01" },
  { index: "02" },
  { index: "03" },
  { index: "04", tabletTitleShort: "Educational Tech" },
];

export const ABOUT_PILLAR_PRESENTATION_CONFIG: ReadonlyArray<AboutPillarPresentationConfig> = [
  {
    index: "01 // ARCHITECTURE",
    compactDescShort:
      "Structured REST APIs, relational data models, and server logic with Go, Laravel, and Node.js.",
    accent: true,
  },
  {
    index: "02 // PROBLEM SOLVING",
    compactDescShort:
      "Translating real-world operational needs into clean, functional web and mobile applications.",
    accent: false,
  },
  {
    index: "03 // EDUCATION",
    compactDescShort:
      "Guiding students to grasp computational logic and structured programming fundamentals.",
    accent: false,
  },
];
