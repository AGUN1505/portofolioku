// src/domain/entities/engineering-node-record.ts
// Domain entity representing a strictly typed persisted EngineeringNode in the CMS.

export interface EngineeringNodeRecord {
  readonly id: string;
  readonly tag: string;
  readonly title: string;
  readonly description: string;
  readonly stack: string | null;
  readonly highlighted: boolean;
  readonly order: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
