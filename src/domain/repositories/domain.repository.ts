// src/domain/repositories/domain.repository.ts
// Domain contract for Domain persistence operations.
// STRICT: Must not import Application DTOs or external infrastructure libraries.

import type { DomainRecord } from '../entities/domain-record';

export interface CreateDomainData {
  readonly index: string;
  readonly title: string;
  readonly order?: number;
}

export interface UpdateDomainData {
  readonly index?: string;
  readonly title?: string;
  readonly order?: number;
}

export interface IDomainRepository {
  getAll(): Promise<DomainRecord[]>;
  getById(id: string): Promise<DomainRecord | null>;
  create(data: CreateDomainData): Promise<DomainRecord>;
  update(id: string, data: UpdateDomainData): Promise<DomainRecord>;
  delete(id: string): Promise<void>;
  reorder(orderedIds: string[]): Promise<void>;
}
