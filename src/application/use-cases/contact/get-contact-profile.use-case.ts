// Use case: Get Contact Profile Singleton

import type { ContactProfileRecord } from '../../../domain/entities/contact-profile-record';
import type { IContactProfileRepository } from '../../../domain/repositories/contact-profile.repository';

export class GetContactProfileUseCase {
  constructor(private readonly repository: IContactProfileRepository) {}

  async execute(): Promise<ContactProfileRecord | null> {
    return this.repository.getProfile();
  }
}
