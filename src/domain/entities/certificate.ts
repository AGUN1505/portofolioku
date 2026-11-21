// src/domain/entities/certificate.ts
// Domain entity representing a Certificate in the portfolio.

export interface Certificate {
  readonly id: string;
  readonly title: string;
  readonly issuer: string;
  readonly issueDate?: Date | null;
  readonly credentialId?: string | null;
  readonly credentialUrl?: string | null;
  readonly fileUrl: string;
  readonly order: number;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}
