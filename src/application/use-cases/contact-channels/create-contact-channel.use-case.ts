// src/application/use-cases/contact-channels/create-contact-channel.use-case.ts
// Use Case: Validate input DTO and persist a new ContactChannel.

import type { IContactChannelRepository } from '../../../domain/repositories/contact-channel.repository';
import type { ContactChannelRecord } from '../../../domain/entities/contact-channel-record';
import { validateCreateContactChannelInput } from '../../dtos/contact-channel.dto';

export interface CreateContactChannelResult {
  readonly success: boolean;
  readonly data?: ContactChannelRecord;
  readonly errors?: Record<string, string>;
  readonly error?: string;
}

export class CreateContactChannelUseCase {
  constructor(private readonly contactChannelRepository: IContactChannelRepository) {}

  async execute(rawInput: Record<string, unknown>): Promise<CreateContactChannelResult> {
    const validation = validateCreateContactChannelInput(rawInput);
    if (validation.success === false) {
      return { success: false, errors: validation.errors };
    }

    const { data } = validation;

    try {
      const created = await this.contactChannelRepository.create({
        label: data.label,
        value: data.value,
        order: data.order,
      });

      return { success: true, data: created };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create contact channel',
      };
    }
  }
}
