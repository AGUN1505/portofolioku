// Domain aggregate: Portfolio root
import type { HeroProfile } from "./hero-profile";
import type { AboutProfile } from "./about-profile";
import type { Project } from "./project";
import type { Experience } from "./experience";
import type { SkillTaxonomy } from "./skill-taxonomy";
import type { ContactProfile } from "./contact-profile";
import type { Certificate } from "./certificate";
import type { SectionConfig } from "./section-config";

export interface Portfolio {
  readonly hero: HeroProfile;
  readonly about: AboutProfile;
  readonly projects: ReadonlyArray<Project>;
  readonly experiences: ReadonlyArray<Experience>;
  readonly skills: SkillTaxonomy;
  readonly contact: ContactProfile;
  readonly certificates: ReadonlyArray<Certificate>;
  readonly sections: ReadonlyArray<SectionConfig>;
}
