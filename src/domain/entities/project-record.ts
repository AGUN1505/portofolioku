// src/domain/entities/project-record.ts
// Domain entity representing a strictly typed persisted Project in the CMS.

export interface ProjectRecord {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly description: string;
  readonly technologies: readonly string[];
  readonly thumbnailUrl: string | null;
  readonly projectUrl: string | null;
  readonly githubUrl: string | null;
  readonly published: boolean;
  readonly publishedAt: Date | null;
  readonly order: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
