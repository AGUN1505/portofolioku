// About presentation view models
export interface AboutDomainViewModel {
  readonly index: string;
  readonly title: string;
  readonly tabletTitle?: string;
}

export interface AboutPillarViewModel {
  readonly index: string;
  readonly title: string;
  readonly desktopDesc: string;
  readonly compactDesc: string;
  readonly accent: boolean;
}
