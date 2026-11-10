// src/domain/repositories/pillar.repository.ts
// Domain contract for Pillar persistence operations.
// STRICT: Must not import Application DTOs or external infrastructure libraries.

import type { PillarRecord } from '../entities/pillar-record';

export interface CreatePillarData {
  readonly index: string;
  readonly title: string;
  readonly description: string;
  readonly order?: number;
}

export interface UpdatePillarData {
  readonly index?: string;
  readonly title?: string;
  readonly description?: string;
  readonly order?: number;
}

export interface IPillarRepository {
  getAll(): Promise<PillarRecord[]>;
  getById(id: string): Promise<PillarRecord | null>;
  create(data: CreatePillarData): Promise<PillarRecord>;
  update(id: string, data: UpdatePillarData): Promise<PillarRecord>;
  delete(id: string): Promise<void>;
  reorder(orderedIds: string[]): Promise<void>;
}
