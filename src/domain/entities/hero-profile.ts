// Domain entity: Hero profile identity
export interface HeroProfile {
  readonly id?: string;
  readonly name: string;
  readonly tagline: string;
  readonly bio: string;
  readonly location: {
    readonly country: string;
    readonly timezone: string;
    readonly code: string;
  };
  readonly roles: ReadonlyArray<{
    readonly title: string;
    readonly primary: boolean;
  }>;
  readonly engineeringNodes: ReadonlyArray<{
    readonly tag: string;
    readonly title: string;
    readonly description: string;
    readonly stack?: string;
    readonly highlighted: boolean;
  }>;
  readonly discipline: string;

  // Optional CMS timestamps
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}
