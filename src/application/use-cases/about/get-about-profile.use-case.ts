// Use case: Get About Profile Singleton

import type { AboutProfileRecord } from '../../../domain/entities/about-profile-record';
import type { IAboutProfileRepository } from '../../../domain/repositories/about-profile.repository';

export class GetAboutProfileUseCase {
  constructor(private readonly repository: IAboutProfileRepository) {}

  async execute(): Promise<AboutProfileRecord | null> {
    return this.repository.getProfile();
  }
}
