// Domain repository contract: About Profile Singleton

import type { AboutProfileRecord } from '../entities/about-profile-record';

export interface UpdateAboutProfileData {
  readonly heading: string;
  readonly quote: string;
  readonly primaryNarrative: string;
  readonly secondaryNarrative: string;
}

export interface IAboutProfileRepository {
  getProfile(): Promise<AboutProfileRecord | null>;
  updateProfile(data: UpdateAboutProfileData): Promise<AboutProfileRecord>;
}
