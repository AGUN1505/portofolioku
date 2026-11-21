// src/application/use-cases/certificates/update-certificate.use-case.ts
// Use Case: Validate update DTO, verify certificate existence, and update Certificate.

import type { ICertificateRepository } from '../../../domain/repositories/certificate.repository';
import type { Certificate } from '../../../domain/entities/certificate';
import { validateUpdateCertificate } from '../../dtos/certificate.dto';

export interface UpdateCertificateResult {
  readonly success: boolean;
  readonly data?: Certificate;
  readonly errors?: Record<string, string>;
  readonly error?: string;
}

export class UpdateCertificateUseCase {
  constructor(private readonly certificateRepository: ICertificateRepository) {}

  async execute(id: string, rawInput: Record<string, unknown>): Promise<UpdateCertificateResult> {
    if (!id || typeof id !== 'string') {
      return { success: false, error: 'Certificate ID is required' };
    }

    const findFn = typeof this.certificateRepository.findById === 'function'
      ? this.certificateRepository.findById.bind(this.certificateRepository)
      : this.certificateRepository.getById?.bind(this.certificateRepository);

    if (!findFn) {
      return { success: false, error: 'Certificate repository does not support findById or getById' };
    }

    const existing = await findFn(id);
    if (!existing) {
      return { success: false, error: 'Certificate not found' };
    }

    const validation = validateUpdateCertificate(rawInput);
    if (validation.success === false) {
      return { success: false, errors: validation.errors };
    }

    try {
      const updated = await this.certificateRepository.update(id, validation.data);
      return { success: true, data: updated };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update certificate',
      };
    }
  }
}
