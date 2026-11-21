// src/application/use-cases/contact-channels/update-contact-channel.use-case.ts
// Use Case: Validate update DTO, verify existence, and update ContactChannel.

import type { IContactChannelRepository } from '../../../domain/repositories/contact-channel.repository';
import type { ContactChannelRecord } from '../../../domain/entities/contact-channel-record';
import { validateUpdateContactChannelInput } from '../../dtos/contact-channel.dto';

export interface UpdateContactChannelResult {
  readonly success: boolean;
  readonly data?: ContactChannelRecord;
  readonly errors?: Record<string, string>;
  readonly error?: string;
}

export class UpdateContactChannelUseCase {
  constructor(private readonly contactChannelRepository: IContactChannelRepository) {}

  async execute(id: string, rawInput: Record<string, unknown>): Promise<UpdateContactChannelResult> {
    if (!id || typeof id !== 'string') {
      return { success: false, error: 'Contact channel ID is required' };
    }

    const existing = await this.contactChannelRepository.getById(id);
    if (!existing) {
      return { success: false, error: 'Contact channel not found' };
    }

    const validation = validateUpdateContactChannelInput(rawInput);
    if (validation.success === false) {
      return { success: false, errors: validation.errors };
    }

    try {
      const updated = await this.contactChannelRepository.update(id, validation.data);
      return { success: true, data: updated };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update contact channel',
      };
    }
  }
}
