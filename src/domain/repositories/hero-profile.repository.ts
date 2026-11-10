// Domain repository contract: Hero Profile Singleton

import type { HeroProfileRecord } from '../entities/hero-profile-record';

export interface UpdateHeroProfileData {
  readonly name: string;
  readonly tagline: string;
  readonly bio: string;
  readonly country: string;
  readonly code: string;
  readonly timezone: string;
  readonly discipline: string;
}

export interface IHeroProfileRepository {
  getProfile(): Promise<HeroProfileRecord | null>;
  updateProfile(data: UpdateHeroProfileData): Promise<HeroProfileRecord>;
}
