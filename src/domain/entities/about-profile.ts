// Domain entity: About profile narrative
export interface AboutProfile {
  readonly id?: string;
  readonly heading: string;
  readonly quote: string;
  readonly narratives: {
    readonly primary: string;
    readonly secondary: string;
  };
  readonly domains: ReadonlyArray<{
    readonly index: string;
    readonly title: string;
  }>;
  readonly pillars: ReadonlyArray<{
    readonly index: string;
    readonly title: string;
    readonly description: string;
  }>;

  // Optional CMS timestamps
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}
