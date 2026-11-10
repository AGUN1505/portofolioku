// Domain entity: Technical skill taxonomy
export interface SkillTaxonomy {
  readonly categories: ReadonlyArray<{
    readonly title: string;
    readonly skills: ReadonlyArray<string>;
  }>;
}
