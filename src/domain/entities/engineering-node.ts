// src/domain/entities/engineering-node.ts
export interface EngineeringNode {
  readonly id: string;
  readonly tag: string;
  readonly title: string;
  readonly description: string;
  readonly stack?: string | null;
  readonly highlighted: boolean;
  readonly order: number;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}
