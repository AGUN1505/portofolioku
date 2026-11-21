// src/domain/repositories/contact-channel.repository.ts
// Domain contract for ContactChannel persistence operations.
// STRICT: Must not import Application DTOs or external infrastructure libraries.

import type { ContactChannelRecord } from '../entities/contact-channel-record';

export interface CreateContactChannelData {
  readonly label: string;
  readonly value: string;
  readonly order?: number;
}

export interface UpdateContactChannelData {
  readonly label?: string;
  readonly value?: string;
  readonly order?: number;
}

export interface IContactChannelRepository {
  getAll(): Promise<ContactChannelRecord[]>;
  getById(id: string): Promise<ContactChannelRecord | null>;
  create(data: CreateContactChannelData): Promise<ContactChannelRecord>;
  update(id: string, data: UpdateContactChannelData): Promise<ContactChannelRecord>;
  delete(id: string): Promise<void>;
  reorder(orderedIds: string[]): Promise<void>;
}
