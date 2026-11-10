// src/domain/entities/experience-record.ts
// Domain entity representing a strictly typed persisted Experience in the CMS.
// Note: Ongoing experience is represented by `endDate === null`.

export interface ExperienceRecord {
  readonly id: string;
  readonly role: string;
  readonly institution: string;
  readonly track: string;
  readonly description: string | null;
  readonly startDate: Date | null;
  readonly endDate: Date | null;
  readonly order: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
