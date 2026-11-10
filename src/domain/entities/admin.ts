// src/domain/entities/admin.ts
export interface Admin {
  readonly id: string;
  readonly username: string;
  readonly email?: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
