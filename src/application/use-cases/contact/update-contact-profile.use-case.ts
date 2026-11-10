// Use case: Update Contact Profile Singleton

import type { ContactProfileRecord } from '../../../domain/entities/contact-profile-record';
import type { IContactProfileRepository } from '../../../domain/repositories/contact-profile.repository';
import { validateContactProfileInput } from '../../dtos/contact-profile.dto';

export interface UpdateContactProfileResult {
  readonly success: boolean;
  readonly data?: ContactProfileRecord;
  readonly errors?: Record<string, string>;
}

export class UpdateContactProfileUseCase {
  constructor(private readonly repository: IContactProfileRepository) {}

  async execute(input: Record<string, unknown>): Promise<UpdateContactProfileResult> {
    const validation = validateContactProfileInput(input);
    if (validation.success === false) {
      return { success: false, errors: validation.errors };
    }

    const updated = await this.repository.updateProfile(validation.data);
    return { success: true, data: updated };
  }
}
