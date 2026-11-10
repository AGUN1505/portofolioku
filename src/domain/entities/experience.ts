// Domain entity: Professional experience entry
export interface Experience {
  readonly id: string;
  readonly role: string;
  readonly institution: string;
  readonly track: string;

  // Optional CMS fields for backward compatibility
  readonly description?: string | null;
  readonly startDate?: Date | null;
  readonly endDate?: Date | null;
  readonly order?: number;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}
