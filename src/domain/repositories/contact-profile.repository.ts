// Domain repository contract: Contact Profile Singleton

import type { ContactProfileRecord } from '../entities/contact-profile-record';

export interface UpdateContactProfileData {
  readonly heading: string;
  readonly ctaLabel: string;
  readonly description: string;
}

export interface IContactProfileRepository {
  getProfile(): Promise<ContactProfileRecord | null>;
  updateProfile(data: UpdateContactProfileData): Promise<ContactProfileRecord>;
}
