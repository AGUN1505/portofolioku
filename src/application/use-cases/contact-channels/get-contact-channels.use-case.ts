// src/application/use-cases/contact-channels/get-contact-channels.use-case.ts
// Use Case: Retrieve all contact channels ordered by ascending display order.

import type { IContactChannelRepository } from '../../../domain/repositories/contact-channel.repository';
import type { ContactChannelRecord } from '../../../domain/entities/contact-channel-record';

export class GetContactChannelsUseCase {
  constructor(private readonly contactChannelRepository: IContactChannelRepository) {}

  async execute(): Promise<ContactChannelRecord[]> {
    return this.contactChannelRepository.getAll();
  }
}
