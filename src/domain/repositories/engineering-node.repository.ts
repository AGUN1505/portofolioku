// src/domain/repositories/engineering-node.repository.ts
// Domain contract for EngineeringNode persistence operations.
// STRICT: Must not import Application DTOs or external infrastructure libraries.

import type { EngineeringNodeRecord } from '../entities/engineering-node-record';

export interface CreateEngineeringNodeData {
  readonly tag: string;
  readonly title: string;
  readonly description: string;
  readonly stack?: string | null;
  readonly highlighted?: boolean;
  readonly order?: number;
}

export interface UpdateEngineeringNodeData {
  readonly tag?: string;
  readonly title?: string;
  readonly description?: string;
  readonly stack?: string | null;
  readonly highlighted?: boolean;
  readonly order?: number;
}

export interface IEngineeringNodeRepository {
  getAll(): Promise<EngineeringNodeRecord[]>;
  getById(id: string): Promise<EngineeringNodeRecord | null>;
  create(data: CreateEngineeringNodeData): Promise<EngineeringNodeRecord>;
  update(id: string, data: UpdateEngineeringNodeData): Promise<EngineeringNodeRecord>;
  delete(id: string): Promise<void>;
  reorder(orderedIds: string[]): Promise<void>;
}
