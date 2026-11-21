// src/domain/entities/certificate-record.ts
// Domain entity representing a strictly typed persisted Certificate in the CMS.

export interface CertificateRecord {
  readonly id: string;
  readonly title: string;
  readonly issuer: string;
  readonly issueDate: Date | null;
  readonly credentialId: string | null;
  readonly credentialUrl: string | null;
  readonly fileUrl: string;
  readonly order: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
