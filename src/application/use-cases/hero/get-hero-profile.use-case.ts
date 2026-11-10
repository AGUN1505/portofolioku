// Use case: Get Hero Profile Singleton

import type { HeroProfileRecord } from '../../../domain/entities/hero-profile-record';
import type { IHeroProfileRepository } from '../../../domain/repositories/hero-profile.repository';

export class GetHeroProfileUseCase {
  constructor(private readonly repository: IHeroProfileRepository) {}

  async execute(): Promise<HeroProfileRecord | null> {
    return this.repository.getProfile();
  }
}
