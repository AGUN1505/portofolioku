// Domain entity: About Profile Singleton Record (Database model mapping)

export interface AboutProfileRecord {
  readonly id: string;
  readonly heading: string;
  readonly quote: string;
  readonly primaryNarrative: string;
  readonly secondaryNarrative: string;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}
