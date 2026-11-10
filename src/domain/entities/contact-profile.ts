// Domain entity: Contact profile
export interface ContactProfile {
  readonly id?: string;
  readonly heading: string;
  readonly ctaLabel: string;
  readonly description: string;
  readonly channels: ReadonlyArray<{
    readonly label: string;
    readonly value: string;
  }>;

  // Optional CMS timestamps
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}
