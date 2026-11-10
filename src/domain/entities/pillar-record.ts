// src/domain/entities/pillar-record.ts
// Domain entity representing a strictly typed persisted Pillar in the CMS.

export interface PillarRecord {
  readonly id: string;
  readonly index: string;
  readonly title: string;
  readonly description: string;
  readonly order: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
