// Domain entity: Project case study
export interface Project {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly description: string;
  readonly technologies: ReadonlyArray<string>;

  // Optional CMS fields for backward compatibility
  readonly thumbnailUrl?: string | null;
  readonly projectUrl?: string | null;
  readonly githubUrl?: string | null;
  readonly published?: boolean;
  readonly publishedAt?: Date | null;
  readonly order?: number;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}
