// src/application/use-cases/sections/get-sections.use-case.ts
// Use Case: Retrieve all section configs ordered by ascending display order.

import type { ISectionConfigRepository } from '../../../domain/repositories/section-config.repository';
import type { SectionConfig } from '../../../domain/entities/section-config';

export class GetSectionConfigsUseCase {
  constructor(private readonly repository: ISectionConfigRepository) {}

  async execute(): Promise<SectionConfig[]> {
    if (typeof this.repository.getAll === 'function') {
      return this.repository.getAll();
    }
    if (typeof this.repository.findAll === 'function') {
      return this.repository.findAll();
    }
    throw new Error('Section config repository does not implement getAll or findAll');
  }
}

// Semantic alias
export const GetSectionsUseCase = GetSectionConfigsUseCase;
