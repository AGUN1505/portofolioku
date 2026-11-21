// src/infrastructure/repositories/prisma-admin.repository.ts
// Prisma implementation of IAdminRepository

import type { PrismaClient } from '@prisma/client';
import type { Admin } from '../../domain/entities/admin';
import type {
  IAdminRepository,
  AdminAuthRecord,
  CreateAdminInput,
  UpdateAdminProfileData,
} from '../../domain/repositories/admin.repository';
import { prisma as defaultPrisma } from '../prisma/client';

export class PrismaAdminRepository implements IAdminRepository {
  private readonly client: PrismaClient;

  constructor(client: PrismaClient = defaultPrisma) {
    this.client = client;
  }

  /**
   * Find admin by ID. Returns pure domain entity without passwordHash.
   */
  public async findById(id: string): Promise<Admin | null> {
    if (!id || typeof id !== 'string') return null;

    const record = await this.client.admin.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!record) return null;

    return {
      id: record.id,
      username: record.username,
      email: record.email,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  /**
   * Find admin by normalized username. Returns pure domain entity without passwordHash.
   */
  public async findByUsername(normalizedUsername: string): Promise<Admin | null> {
    if (!normalizedUsername || typeof normalizedUsername !== 'string') return null;

    const normalized = normalizedUsername.toLowerCase().trim();
    const record = await this.client.admin.findUnique({
      where: { username: normalized },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!record) return null;

    return {
      id: record.id,
      username: record.username,
      email: record.email,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  /**
   * Find admin by normalized email. Returns pure domain entity without passwordHash.
   */
  public async findByEmail(normalizedEmail: string): Promise<Admin | null> {
    if (!normalizedEmail || typeof normalizedEmail !== 'string') return null;

    const normalized = normalizedEmail.toLowerCase().trim();
    const record = await this.client.admin.findUnique({
      where: { email: normalized },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!record) return null;

    return {
      id: record.id,
      username: record.username,
      email: record.email,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  /**
   * Internal auth query: retrieves credentials strictly for authentication verification.
   * Isolated so passwordHash is never returned on general queries or domain entities.
   */
  public async findAuthByUsername(normalizedUsername: string): Promise<AdminAuthRecord | null> {
    if (!normalizedUsername || typeof normalizedUsername !== 'string') return null;

    const normalized = normalizedUsername.toLowerCase().trim();
    const record = await this.client.admin.findUnique({
      where: { username: normalized },
      select: {
        id: true,
        username: true,
        email: true,
        passwordHash: true,
        sessionVersion: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!record) return null;

    const admin: Admin = {
      id: record.id,
      username: record.username,
      email: record.email,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };

    return {
      admin,
      passwordHash: record.passwordHash,
      sessionVersion: record.sessionVersion,
    };
  }

  /**
   * Internal auth query by email: retrieves credentials strictly for authentication verification.
   * Isolated so passwordHash is never returned on general queries or domain entities.
   */
  public async findAuthByEmail(normalizedEmail: string): Promise<AdminAuthRecord | null> {
    if (!normalizedEmail || typeof normalizedEmail !== 'string') return null;

    const normalized = normalizedEmail.toLowerCase().trim();
    const record = await this.client.admin.findUnique({
      where: { email: normalized },
      select: {
        id: true,
        username: true,
        email: true,
        passwordHash: true,
        sessionVersion: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!record) return null;

    const admin: Admin = {
      id: record.id,
      username: record.username,
      email: record.email,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };

    return {
      admin,
      passwordHash: record.passwordHash,
      sessionVersion: record.sessionVersion,
    };
  }

  /**
   * Internal auth query by ID: retrieves credentials strictly for password verification.
   */
  public async findAuthById(id: string): Promise<AdminAuthRecord | null> {
    if (!id || typeof id !== 'string') return null;

    const record = await this.client.admin.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        passwordHash: true,
        sessionVersion: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!record) return null;

    const admin: Admin = {
      id: record.id,
      username: record.username,
      email: record.email,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };

    return {
      admin,
      passwordHash: record.passwordHash,
      sessionVersion: record.sessionVersion,
    };
  }

  /**
   * Quick query to fetch session version for DAL authorization check.
   */
  public async getSessionVersion(id: string): Promise<number | null> {
    if (!id || typeof id !== 'string') return null;

    const record = await this.client.admin.findUnique({
      where: { id },
      select: { sessionVersion: true },
    });

    return record?.sessionVersion ?? null;
  }

  /**
   * Increments session version (reserved for Phase 3 logout workflows).
   */
  public async incrementSessionVersion(id: string): Promise<number> {
    if (!id || typeof id !== 'string') {
      throw new Error('Valid admin ID required to increment session version');
    }

    const updated = await this.client.admin.update({
      where: { id },
      data: { sessionVersion: { increment: 1 } },
      select: { sessionVersion: true },
    });

    return updated.sessionVersion;
  }

  /**
   * Updates administrator profile fields (username, email).
   */
  public async updateProfile(id: string, data: UpdateAdminProfileData): Promise<Admin> {
    if (!id || typeof id !== 'string') {
      throw new Error('Valid admin ID required to update profile');
    }

    const updateData: { username?: string; email?: string | null } = {};
    if (data.username !== undefined) {
      updateData.username = data.username.toLowerCase().trim();
    }
    if (data.email !== undefined) {
      updateData.email = data.email ? data.email.toLowerCase().trim() : null;
    }

    const updated = await this.client.admin.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      id: updated.id,
      username: updated.username,
      email: updated.email,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Updates administrator passwordHash and atomically increments sessionVersion
   * to invalidate all other active sessions.
   */
  public async updatePassword(
    id: string,
    passwordHash: string
  ): Promise<{ admin: Admin; sessionVersion: number }> {
    if (!id || typeof id !== 'string') {
      throw new Error('Valid admin ID required to update password');
    }

    const updated = await this.client.admin.update({
      where: { id },
      data: {
        passwordHash,
        sessionVersion: { increment: 1 },
      },
      select: {
        id: true,
        username: true,
        email: true,
        sessionVersion: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      admin: {
        id: updated.id,
        username: updated.username,
        email: updated.email,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
      sessionVersion: updated.sessionVersion,
    };
  }

  /**
   * Count total admin accounts to enforce single-admin policy.
   */
  public async count(): Promise<number> {
    return this.client.admin.count();
  }

  /**
   * Creates initial administrator.
   * Strictly enforces single-admin policy: throws error if an admin already exists.
   */
  public async create(data: CreateAdminInput): Promise<Admin> {
    const existingCount = await this.client.admin.count();
    if (existingCount > 0) {
      throw new Error('Single-admin policy violation: Admin account already exists');
    }

    const normalized = data.username.toLowerCase().trim();
    const created = await this.client.admin.create({
      data: {
        username: normalized,
        passwordHash: data.passwordHash,
        email: data.email ? data.email.toLowerCase().trim() : null,
        sessionVersion: 1,
      },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      id: created.id,
      username: created.username,
      email: created.email,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }
}
