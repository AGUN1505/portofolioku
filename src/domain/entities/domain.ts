// src/domain/entities/domain.ts
export interface Domain {
  readonly id: string;
  readonly index: string;
  readonly title: string;
  readonly order: number;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}
