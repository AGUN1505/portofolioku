// src/application/use-cases/contact-channels/delete-contact-channel.use-case.ts
// Use Case: Verify contact channel existence and delete by ID.

import type { IContactChannelRepository } from '../../../domain/repositories/contact-channel.repository';

export interface DeleteContactChannelResult {
  readonly success: boolean;
  readonly error?: string;
}

export class DeleteContactChannelUseCase {
  constructor(private readonly contactChannelRepository: IContactChannelRepository) {}

  async execute(id: string): Promise<DeleteContactChannelResult> {
    if (!id || typeof id !== 'string') {
      return { success: false, error: 'Contact channel ID is required' };
    }

    const existing = await this.contactChannelRepository.getById(id);
    if (!existing) {
      return { success: false, error: 'Contact channel not found' };
    }

    try {
      await this.contactChannelRepository.delete(id);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete contact channel',
      };
    }
  }
}
