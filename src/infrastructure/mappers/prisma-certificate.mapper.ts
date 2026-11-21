// src/infrastructure/mappers/prisma-certificate.mapper.ts
// Dedicated CMS persistence mapper for Certificate records.

import type { Certificate as PrismaCertificate, Prisma } from '@prisma/client';
import type { Certificate } from '../../domain/entities/certificate';
import type {
  CreateCertificateData,
  UpdateCertificateData,
} from '../../domain/repositories/certificate.repository';

export class PrismaCertificateMapper {
  /**
   * Maps a Prisma Certificate record to Domain Certificate entity.
   */
  static toDomain(c: PrismaCertificate): Certificate {
    return {
      id: c.id,
      title: c.title,
      issuer: c.issuer,
      issueDate: c.issueDate,
      credentialId: c.credentialId,
      credentialUrl: c.credentialUrl,
      fileUrl: c.fileUrl,
      order: c.order,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }

  /**
   * Maps Domain CreateCertificateData to Prisma CertificateCreateInput.
   */
  static toPrismaCreate(data: CreateCertificateData): Prisma.CertificateCreateInput {
    return {
      title: data.title,
      issuer: data.issuer,
      issueDate: data.issueDate ?? null,
      credentialId: data.credentialId ?? null,
      credentialUrl: data.credentialUrl ?? null,
      fileUrl: data.fileUrl,
      order: data.order ?? 0,
    };
  }

  /**
   * Maps Domain UpdateCertificateData to Prisma CertificateUpdateInput.
   */
  static toPrismaUpdate(data: UpdateCertificateData): Prisma.CertificateUpdateInput {
    const update: Prisma.CertificateUpdateInput = {};

    if (data.title !== undefined) update.title = data.title;
    if (data.issuer !== undefined) update.issuer = data.issuer;
    if (data.issueDate !== undefined) update.issueDate = data.issueDate;
    if (data.credentialId !== undefined) update.credentialId = data.credentialId;
    if (data.credentialUrl !== undefined) update.credentialUrl = data.credentialUrl;
    if (data.fileUrl !== undefined) update.fileUrl = data.fileUrl;
    if (data.order !== undefined) update.order = data.order;

    return update;
  }
}

export const PrismaCertificateRecordMapper = PrismaCertificateMapper;
