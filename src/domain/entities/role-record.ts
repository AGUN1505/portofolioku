// src/domain/entities/role-record.ts
// Domain entity representing a strictly typed persisted Role in the CMS.

export interface RoleRecord {
  readonly id: string;
  readonly title: string;
  readonly primary: boolean;
  readonly order: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
