// Domain entity: Contact Profile Singleton Record (Database model mapping)

export interface ContactProfileRecord {
  readonly id: string;
  readonly heading: string;
  readonly ctaLabel: string;
  readonly description: string;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}
