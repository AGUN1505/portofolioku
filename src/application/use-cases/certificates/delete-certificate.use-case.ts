// src/application/use-cases/certificates/delete-certificate.use-case.ts
// Use Case: Verify certificate existence and delete certificate by ID.

import type { ICertificateRepository } from '../../../domain/repositories/certificate.repository';

export interface DeleteCertificateResult {
  readonly success: boolean;
  readonly error?: string;
}

export class DeleteCertificateUseCase {
  constructor(private readonly certificateRepository: ICertificateRepository) {}

  async execute(id: string): Promise<DeleteCertificateResult> {
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

    try {
      await this.certificateRepository.delete(id);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete certificate',
      };
    }
  }
}
