// src/application/use-cases/contact-channels/get-contact-channel-by-id.use-case.ts
// Use Case: Retrieve a single contact channel by primary key ID.

import type { IContactChannelRepository } from '../../../domain/repositories/contact-channel.repository';
import type { ContactChannelRecord } from '../../../domain/entities/contact-channel-record';

export class GetContactChannelByIdUseCase {
  constructor(private readonly contactChannelRepository: IContactChannelRepository) {}

  async execute(id: string): Promise<ContactChannelRecord | null> {
    if (!id || typeof id !== 'string') {
      return null;
    }
    return this.contactChannelRepository.getById(id);
  }
}
