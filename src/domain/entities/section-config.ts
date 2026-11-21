// src/domain/entities/section-config.ts
export interface SectionConfig {
  readonly id: string;
  readonly key: string;
  readonly label: string;
  readonly order: number;
  readonly enabled: boolean;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}
