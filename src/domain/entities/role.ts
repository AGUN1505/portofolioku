// src/domain/entities/role.ts
export interface Role {
  readonly id: string;
  readonly title: string;
  readonly primary: boolean;
  readonly order: number;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}
