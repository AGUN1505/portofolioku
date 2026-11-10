// src/domain/entities/pillar.ts
export interface Pillar {
  readonly id: string;
  readonly index: string;
  readonly title: string;
  readonly description: string;
  readonly order: number;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}
