// src/domain/repositories/certificate.repository.ts
// Domain contract for Certificate persistence operations.
// STRICT: Must not import Application DTOs or external infrastructure libraries.

import type { Certificate } from '../entities/certificate';

export interface CreateCertificateData {
  readonly title: string;
  readonly issuer: string;
  readonly issueDate?: Date | null;
  readonly credentialId?: string | null;
  readonly credentialUrl?: string | null;
  readonly fileUrl: string;
  readonly order?: number;
}

export interface UpdateCertificateData {
  readonly title?: string;
  readonly issuer?: string;
  readonly issueDate?: Date | null;
  readonly credentialId?: string | null;
  readonly credentialUrl?: string | null;
  readonly fileUrl?: string;
  readonly order?: number;
}

export interface ICertificateRepository {
  /**
   * Retrieves all certificates ordered by ascending display order.
   */
  findAll(): Promise<Certificate[]>;

  /**
   * Retrieves a single certificate by primary key ID.
   * Returns null if no record matches.
   */
  findById(id: string): Promise<Certificate | null>;

  /**
   * Optional aliases for getAll / getById to maintain interoperability.
   */
  getAll?(): Promise<Certificate[]>;
  getById?(id: string): Promise<Certificate | null>;

  /**
   * Persists a new certificate record.
   */
  create(data: CreateCertificateData): Promise<Certificate>;

  /**
   * Updates an existing certificate record by ID.
   * Throws an Error if the certificate does not exist.
   */
  update(id: string, data: UpdateCertificateData): Promise<Certificate>;

  /**
   * Deletes an existing certificate record by ID.
   * Throws an Error if the certificate does not exist.
   */
  delete(id: string): Promise<void>;

  /**
   * Atomically reorders certificates by setting sequential order matching orderedIds.
   */
  reorder(orderedIds: string[]): Promise<void>;
}
