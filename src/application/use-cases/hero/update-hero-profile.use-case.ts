// Use case: Update Hero Profile Singleton

import type { HeroProfileRecord } from '../../../domain/entities/hero-profile-record';
import type { IHeroProfileRepository } from '../../../domain/repositories/hero-profile.repository';
import { validateHeroProfileInput } from '../../dtos/hero-profile.dto';

export interface UpdateHeroProfileResult {
  readonly success: boolean;
  readonly data?: HeroProfileRecord;
  readonly errors?: Record<string, string>;
}

export class UpdateHeroProfileUseCase {
  constructor(private readonly repository: IHeroProfileRepository) {}

  async execute(input: Record<string, unknown>): Promise<UpdateHeroProfileResult> {
    const validation = validateHeroProfileInput(input);
    if (validation.success === false) {
      return { success: false, errors: validation.errors };
    }

    const updated = await this.repository.updateProfile(validation.data);
    return { success: true, data: updated };
  }
}
