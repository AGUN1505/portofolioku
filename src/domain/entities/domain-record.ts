// src/domain/entities/domain-record.ts
// Domain entity representing a strictly typed persisted Domain in the CMS.

export interface DomainRecord {
  readonly id: string;
  readonly index: string;
  readonly title: string;
  readonly order: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
