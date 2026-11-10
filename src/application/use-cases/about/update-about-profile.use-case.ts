// Use case: Update About Profile Singleton

import type { AboutProfileRecord } from '../../../domain/entities/about-profile-record';
import type { IAboutProfileRepository } from '../../../domain/repositories/about-profile.repository';
import { validateAboutProfileInput } from '../../dtos/about-profile.dto';

export interface UpdateAboutProfileResult {
  readonly success: boolean;
  readonly data?: AboutProfileRecord;
  readonly errors?: Record<string, string>;
}

export class UpdateAboutProfileUseCase {
  constructor(private readonly repository: IAboutProfileRepository) {}

  async execute(input: Record<string, unknown>): Promise<UpdateAboutProfileResult> {
    const validation = validateAboutProfileInput(input);
    if (validation.success === false) {
      return { success: false, errors: validation.errors };
    }

    const updated = await this.repository.updateProfile(validation.data);
    return { success: true, data: updated };
  }
}
