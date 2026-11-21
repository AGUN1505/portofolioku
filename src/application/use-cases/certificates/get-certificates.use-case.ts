// src/application/use-cases/certificates/get-certificates.use-case.ts
// Use Case: Retrieve all certificates ordered by ascending display order.

import type { ICertificateRepository } from '../../../domain/repositories/certificate.repository';
import type { Certificate } from '../../../domain/entities/certificate';

export class GetCertificatesUseCase {
  constructor(private readonly certificateRepository: ICertificateRepository) {}

  async execute(): Promise<Certificate[]> {
    if (typeof this.certificateRepository.findAll === 'function') {
      return this.certificateRepository.findAll();
    }
    if (typeof this.certificateRepository.getAll === 'function') {
      return this.certificateRepository.getAll();
    }
    throw new Error('Certificate repository does not implement findAll or getAll');
  }
}
