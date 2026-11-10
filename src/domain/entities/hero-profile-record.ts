// Domain entity: Hero Profile Singleton Record (Database model mapping)

export interface HeroProfileRecord {
  readonly id: string;
  readonly name: string;
  readonly tagline: string;
  readonly bio: string;
  readonly country: string;
  readonly code: string;
  readonly timezone: string;
  readonly discipline: string;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}
