// src/domain/entities/contact-channel.ts
export interface ContactChannel {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly order: number;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}
