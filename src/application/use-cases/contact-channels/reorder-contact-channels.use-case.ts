// src/application/use-cases/contact-channels/reorder-contact-channels.use-case.ts
// Use Case: Validate collection completeness and atomically reorder contact channels.

import type { IContactChannelRepository } from '../../../domain/repositories/contact-channel.repository';

export interface ReorderContactChannelsResult {
  readonly success: boolean;
  readonly error?: string;
}

export class ReorderContactChannelsUseCase {
  constructor(private readonly contactChannelRepository: IContactChannelRepository) {}

  async execute(orderedIds: string[]): Promise<ReorderContactChannelsResult> {
    if (!Array.isArray(orderedIds)) {
      return { success: false, error: 'orderedIds must be an array of contact channel IDs' };
    }

    const existing = await this.contactChannelRepository.getAll();

    if (existing.length === 0 && orderedIds.length === 0) {
      return { success: true };
    }

    if (orderedIds.length === 0 && existing.length > 0) {
      return { success: false, error: 'orderedIds cannot be empty when contact channels exist' };
    }

    const uniqueIds = new Set(orderedIds);
    if (uniqueIds.size !== orderedIds.length) {
      return { success: false, error: 'orderedIds contains duplicate contact channel IDs' };
    }

    if (orderedIds.length !== existing.length) {
      return {
        success: false,
        error: `orderedIds count (${orderedIds.length}) does not match existing contact channels count (${existing.length})`,
      };
    }

    const existingIdSet = new Set(existing.map((c) => c.id));
    for (const id of orderedIds) {
      if (!existingIdSet.has(id)) {
        return {
          success: false,
          error: `Contact channel ID '${id}' does not exist in the collection`,
        };
      }
    }

    try {
      await this.contactChannelRepository.reorder(orderedIds);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to reorder contact channels',
      };
    }
  }
}
