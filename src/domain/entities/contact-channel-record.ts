// src/domain/entities/contact-channel-record.ts
// Domain entity representing a strictly typed persisted ContactChannel in the CMS.

export interface ContactChannelRecord {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly order: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
