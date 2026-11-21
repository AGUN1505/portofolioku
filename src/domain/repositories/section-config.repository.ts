// src/domain/repositories/section-config.repository.ts
// Domain contract for SectionConfig persistence operations.
// STRICT: Must not import Application DTOs or external infrastructure libraries.

import type { SectionConfig } from '../entities/section-config';

export interface CreateSectionConfigData {
  readonly key: string;
  readonly label: string;
  readonly order?: number;
  readonly enabled?: boolean;
}

export interface UpdateSectionConfigData {
  readonly key?: string;
  readonly label?: string;
  readonly order?: number;
  readonly enabled?: boolean;
}

export interface ISectionConfigRepository {
  findAll(): Promise<SectionConfig[]>;
  getAll(): Promise<SectionConfig[]>;
  findByKey(key: string): Promise<SectionConfig | null>;
  getByKey(key: string): Promise<SectionConfig | null>;
  findById(id: string): Promise<SectionConfig | null>;
  getById(id: string): Promise<SectionConfig | null>;
  update(keyOrId: string, data: UpdateSectionConfigData): Promise<SectionConfig>;
  reorder(orderedIds: string[]): Promise<void>;
  create?(data: CreateSectionConfigData): Promise<SectionConfig>;
}
