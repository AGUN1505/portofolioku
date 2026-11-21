// src/application/use-cases/certificates/create-certificate.use-case.ts
// Use Case: Validate input DTO, compute next order if omitted, and persist new Certificate.

import type { ICertificateRepository } from '../../../domain/repositories/certificate.repository';
import type { Certificate } from '../../../domain/entities/certificate';
import { validateCreateCertificate } from '../../dtos/certificate.dto';

export interface CreateCertificateResult {
  readonly success: boolean;
  readonly data?: Certificate;
  readonly errors?: Record<string, string>;
  readonly error?: string;
}

export class CreateCertificateUseCase {
  constructor(private readonly certificateRepository: ICertificateRepository) {}

  async execute(rawInput: Record<string, unknown>): Promise<CreateCertificateResult> {
    const validation = validateCreateCertificate(rawInput);
    if (validation.success === false) {
      return { success: false, errors: validation.errors };
    }

    const { data } = validation;

    try {
      const created = await this.certificateRepository.create(data);
      return { success: true, data: created };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create certificate',
      };
    }
  }
}
