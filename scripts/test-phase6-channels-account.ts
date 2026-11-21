// scripts/test-phase6-channels-account.ts
// Stage 10.4 Phase 6 Pure In-Memory Test Suite:
// Contact Channels (Module 12) & Administrator Account Settings (Module 13).
// ZERO database connection, ZERO .env.local load.

import assert from 'node:assert/strict';
import type { PrismaClient } from '@prisma/client';

import type { ContactChannelRecord } from '../src/domain/entities/contact-channel-record';
import type { Admin } from '../src/domain/entities/admin';
import type {
  IContactChannelRepository,
  CreateContactChannelData,
  UpdateContactChannelData,
} from '../src/domain/repositories/contact-channel.repository';
import type {
  IAdminRepository,
  AdminAuthRecord,
  CreateAdminInput,
  UpdateAdminProfileData,
} from '../src/domain/repositories/admin.repository';
import type { IPasswordService } from '../src/infrastructure/auth/password.service';

import {
  validateCreateContactChannelInput,
  validateUpdateContactChannelInput,
} from '../src/application/dtos/contact-channel.dto';
import {
  validateUpdateAdminProfileInput,
  validateChangeAdminPasswordInput,
} from '../src/application/dtos/admin-account.dto';

import { GetContactChannelsUseCase } from '../src/application/use-cases/contact-channels/get-contact-channels.use-case';
import { GetContactChannelByIdUseCase } from '../src/application/use-cases/contact-channels/get-contact-channel-by-id.use-case';
import { CreateContactChannelUseCase } from '../src/application/use-cases/contact-channels/create-contact-channel.use-case';
import { UpdateContactChannelUseCase } from '../src/application/use-cases/contact-channels/update-contact-channel.use-case';
import { DeleteContactChannelUseCase } from '../src/application/use-cases/contact-channels/delete-contact-channel.use-case';
import { ReorderContactChannelsUseCase } from '../src/application/use-cases/contact-channels/reorder-contact-channels.use-case';

import { GetAdminAccountUseCase } from '../src/application/use-cases/account/get-admin-account.use-case';
import { UpdateAdminProfileUseCase } from '../src/application/use-cases/account/update-admin-profile.use-case';
import { ChangeAdminPasswordUseCase } from '../src/application/use-cases/account/change-admin-password.use-case';

import { PrismaContactChannelRecordMapper } from '../src/infrastructure/mappers/prisma-contact-channel-record.mapper';
import { PrismaContactChannelRepository } from '../src/infrastructure/repositories/prisma-contact-channel.repository';
import { AdvisoryLockNamespace } from '../src/infrastructure/utils/advisory-lock';
import { CompositionRoot } from '../src/infrastructure/composition-root';

import {
  createContactChannelAction,
  updateContactChannelAction,
  deleteContactChannelAction,
  reorderContactChannelsAction,
} from '../app/admin/(dashboard)/contact-channels/actions';
import {
  updateAdminProfileAction,
  changeAdminPasswordAction,
} from '../app/admin/(dashboard)/account/actions';

// -----------------------------------------------------------------
// In-Memory Mock Implementations
// -----------------------------------------------------------------

class InMemoryContactChannelRepository implements IContactChannelRepository {
  private items: ContactChannelRecord[] = [];
  private seq = 1;

  async getAll(): Promise<ContactChannelRecord[]> {
    return [...this.items].sort((a, b) => a.order - b.order);
  }

  async getById(id: string): Promise<ContactChannelRecord | null> {
    return this.items.find((item) => item.id === id) ?? null;
  }

  async create(data: CreateContactChannelData): Promise<ContactChannelRecord> {
    const nextOrder =
      data.order ??
      this.items.reduce((max, item) => (item.order > max ? item.order : max), 0) + 1;
    const now = new Date();
    const record: ContactChannelRecord = {
      id: `ch_${this.seq++}`,
      label: data.label,
      value: data.value,
      order: nextOrder,
      createdAt: now,
      updatedAt: now,
    };
    this.items.push(record);
    return record;
  }

  async update(id: string, data: UpdateContactChannelData): Promise<ContactChannelRecord> {
    const idx = this.items.findIndex((item) => item.id === id);
    if (idx === -1) throw new Error(`Contact channel "${id}" not found`);
    const prev = this.items[idx];
    const updated: ContactChannelRecord = {
      ...prev,
      ...(data.label !== undefined ? { label: data.label } : {}),
      ...(data.value !== undefined ? { value: data.value } : {}),
      ...(data.order !== undefined ? { order: data.order } : {}),
      updatedAt: new Date(),
    };
    this.items[idx] = updated;
    return updated;
  }

  async delete(id: string): Promise<void> {
    const idx = this.items.findIndex((item) => item.id === id);
    if (idx === -1) throw new Error(`Contact channel "${id}" not found`);
    this.items.splice(idx, 1);
  }

  async reorder(orderedIds: string[]): Promise<void> {
    const orderMap = new Map<string, number>();
    orderedIds.forEach((id, i) => orderMap.set(id, i + 1));
    this.items = this.items.map((item) => ({
      ...item,
      order: orderMap.get(item.id) ?? item.order,
    }));
  }
}

class InMemoryAdminRepository implements IAdminRepository {
  public records: Array<{
    admin: Admin;
    passwordHash: string;
    sessionVersion: number;
  }> = [];

  constructor(initial?: {
    id: string;
    username: string;
    email: string | null;
    passwordHash: string;
    sessionVersion: number;
  }) {
    if (initial) {
      const now = new Date();
      this.records.push({
        admin: {
          id: initial.id,
          username: initial.username,
          email: initial.email,
          createdAt: now,
          updatedAt: now,
        },
        passwordHash: initial.passwordHash,
        sessionVersion: initial.sessionVersion,
      });
    }
  }

  async findById(id: string): Promise<Admin | null> {
    return this.records.find((r) => r.admin.id === id)?.admin ?? null;
  }

  async findByUsername(normalizedUsername: string): Promise<Admin | null> {
    const target = normalizedUsername.toLowerCase().trim();
    return this.records.find((r) => r.admin.username === target)?.admin ?? null;
  }

  async findByEmail(normalizedEmail: string): Promise<Admin | null> {
    const target = normalizedEmail.toLowerCase().trim();
    return this.records.find((r) => r.admin.email === target)?.admin ?? null;
  }

  async findAuthByUsername(normalizedUsername: string): Promise<AdminAuthRecord | null> {
    const target = normalizedUsername.toLowerCase().trim();
    const found = this.records.find((r) => r.admin.username === target);
    return found ? { ...found } : null;
  }

  async findAuthByEmail(normalizedEmail: string): Promise<AdminAuthRecord | null> {
    const target = normalizedEmail.toLowerCase().trim();
    const found = this.records.find((r) => r.admin.email === target);
    return found ? { ...found } : null;
  }

  async findAuthById(id: string): Promise<AdminAuthRecord | null> {
    const found = this.records.find((r) => r.admin.id === id);
    return found ? { ...found } : null;
  }

  async getSessionVersion(id: string): Promise<number | null> {
    return this.records.find((r) => r.admin.id === id)?.sessionVersion ?? null;
  }

  async incrementSessionVersion(id: string): Promise<number> {
    const found = this.records.find((r) => r.admin.id === id);
    if (!found) throw new Error('Admin not found');
    found.sessionVersion += 1;
    return found.sessionVersion;
  }

  async updateProfile(id: string, data: UpdateAdminProfileData): Promise<Admin> {
    const found = this.records.find((r) => r.admin.id === id);
    if (!found) throw new Error('Admin not found');
    found.admin = {
      ...found.admin,
      ...(data.username !== undefined ? { username: data.username } : {}),
      ...(data.email !== undefined ? { email: data.email } : {}),
      updatedAt: new Date(),
    };
    return found.admin;
  }

  async updatePassword(
    id: string,
    passwordHash: string
  ): Promise<{ admin: Admin; sessionVersion: number }> {
    const found = this.records.find((r) => r.admin.id === id);
    if (!found) throw new Error('Admin not found');
    found.passwordHash = passwordHash;
    found.sessionVersion += 1;
    found.admin = {
      ...found.admin,
      updatedAt: new Date(),
    };
    return {
      admin: found.admin,
      sessionVersion: found.sessionVersion,
    };
  }

  async count(): Promise<number> {
    return this.records.length;
  }

  async create(data: CreateAdminInput): Promise<Admin> {
    if (this.records.length > 0) {
      throw new Error('Single-admin policy violation');
    }
    const now = new Date();
    const admin: Admin = {
      id: 'admin_1',
      username: data.username.toLowerCase().trim(),
      email: data.email ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.records.push({
      admin,
      passwordHash: data.passwordHash,
      sessionVersion: 1,
    });
    return admin;
  }
}

class MockPasswordService implements IPasswordService {
  async hash(password: string): Promise<string> {
    return `hashed:${password}`;
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return hash === `hashed:${password}`;
  }

  async performDummyCompare(_password: string): Promise<boolean> {
    void _password;
    return false;
  }

  async getDummyHash(): Promise<string> {
    return 'hashed:dummy';
  }
}

let passed = 0;
let failed = 0;

async function runTest(name: string, fn: () => Promise<void> | void): Promise<void> {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(err);
    failed++;
  }
}

async function main() {
  console.log('=== [STAGE 10.4 PHASE 6] CONTACT CHANNELS & ACCOUNT SETTINGS TESTS ===\n');

  // -----------------------------------------------------------------
  // 1. ContactChannel DTO Validation Tests
  // -----------------------------------------------------------------
  console.log('1. ContactChannel DTO Validators:');

  await runTest('Create DTO accepts valid Email channel', () => {
    const res = validateCreateContactChannelInput({
      label: '  Email  ',
      value: '  hello@agunfirmansyah.dev  ',
    });
    assert.equal(res.success, true);
    if (res.success) {
      assert.equal(res.data.label, 'Email');
      assert.equal(res.data.value, 'hello@agunfirmansyah.dev');
    }
  });

  await runTest('Create DTO rejects system fields and disallowed keys', () => {
    const res = validateCreateContactChannelInput({
      id: 'ch_hacked',
      createdAt: new Date(),
      unknownProp: 'bad',
      label: 'GitHub',
      value: 'https://github.com/agun',
    });
    assert.equal(res.success, false);
    if (!res.success) {
      assert.ok(res.errors.id);
      assert.ok(res.errors.createdAt);
      assert.ok(res.errors.unknownProp);
    }
  });

  await runTest('Create DTO rejects synthetic placeholder markers', () => {
    const bracketed = validateCreateContactChannelInput({
      label: 'Email',
      value: '[ Email Placeholder ]',
    });
    assert.equal(bracketed.success, false);
    if (!bracketed.success) {
      assert.ok(bracketed.errors.value);
    }

    const readyText = validateCreateContactChannelInput({
      label: '[Placeholder]',
      value: 'Ready for official address',
    });
    assert.equal(readyText.success, false);
    if (!readyText.success) {
      assert.ok(readyText.errors.label);
      assert.ok(readyText.errors.value);
    }
  });

  await runTest('Create DTO enforces length bounds on label and value', () => {
    const res = validateCreateContactChannelInput({
      label: 'a'.repeat(101),
      value: 'b'.repeat(501),
    });
    assert.equal(res.success, false);
    if (!res.success) {
      assert.ok(res.errors.label);
      assert.ok(res.errors.value);
    }
  });

  await runTest('Update DTO rejects empty payload and validates partial fields', () => {
    const empty = validateUpdateContactChannelInput({});
    assert.equal(empty.success, false);
    if (!empty.success) {
      assert.ok(empty.errors._general);
    }

    const partial = validateUpdateContactChannelInput({ value: 'https://linkedin.com/in/agun' });
    assert.equal(partial.success, true);
    if (partial.success) {
      assert.equal(partial.data.value, 'https://linkedin.com/in/agun');
      assert.equal(partial.data.label, undefined);
    }
  });

  // -----------------------------------------------------------------
  // 2. ContactChannel Use Cases (6 Use Cases)
  // -----------------------------------------------------------------
  console.log('\n2. ContactChannel Use Cases (In-Memory Repository):');

  await runTest('Create, GetAll, GetById, Update, Reorder, Delete lifecycle', async () => {
    const repo = new InMemoryContactChannelRepository();
    const createUC = new CreateContactChannelUseCase(repo);
    const getAllUC = new GetContactChannelsUseCase(repo);
    const getByIdUC = new GetContactChannelByIdUseCase(repo);
    const updateUC = new UpdateContactChannelUseCase(repo);
    const reorderUC = new ReorderContactChannelsUseCase(repo);
    const deleteUC = new DeleteContactChannelUseCase(repo);

    // Create two channels
    const c1 = await createUC.execute({ label: 'Email', value: 'agun@example.com' });
    const c2 = await createUC.execute({ label: 'GitHub', value: 'https://github.com/agun' });
    assert.equal(c1.success, true);
    assert.equal(c2.success, true);
    assert.ok(c1.data && c2.data);
    assert.equal(c1.data.order, 1);
    assert.equal(c2.data.order, 2);

    // GetAll & GetById
    const all = await getAllUC.execute();
    assert.equal(all.length, 2);
    const found = await getByIdUC.execute(c1.data.id);
    assert.equal(found?.label, 'Email');
    assert.equal(await getByIdUC.execute(''), null);

    // Update
    const upd = await updateUC.execute(c2.data.id, { value: 'https://github.com/agun-dev' });
    assert.equal(upd.success, true);
    assert.equal(upd.data?.value, 'https://github.com/agun-dev');

    const missingUpd = await updateUC.execute('missing_id', { label: 'X' });
    assert.equal(missingUpd.success, false);

    // Reorder validation & success
    const dupReorder = await reorderUC.execute([c1.data.id, c1.data.id]);
    assert.equal(dupReorder.success, false);

    const mismatchReorder = await reorderUC.execute([c1.data.id]);
    assert.equal(mismatchReorder.success, false);

    const okReorder = await reorderUC.execute([c2.data.id, c1.data.id]);
    assert.equal(okReorder.success, true);
    const afterReorder = await getAllUC.execute();
    assert.equal(afterReorder[0].id, c2.data.id);
    assert.equal(afterReorder[0].order, 1);
    assert.equal(afterReorder[1].id, c1.data.id);
    assert.equal(afterReorder[1].order, 2);

    // Delete
    const delMissing = await deleteUC.execute('non_existent');
    assert.equal(delMissing.success, false);

    const delOk = await deleteUC.execute(c1.data.id);
    assert.equal(delOk.success, true);
    assert.equal((await getAllUC.execute()).length, 1);
  });

  // -----------------------------------------------------------------
  // 3. Prisma Mapper & Repository Mock Tests (Advisory Lock)
  // -----------------------------------------------------------------
  console.log('\n3. ContactChannel Mapper & Repository Transaction Lock:');

  await runTest('PrismaContactChannelRecordMapper maps domain and prisma inputs', () => {
    const now = new Date();
    const domain = PrismaContactChannelRecordMapper.toDomain({
      id: 'ch_1',
      label: 'LinkedIn',
      value: 'https://linkedin.com/in/agun',
      order: 1,
      createdAt: now,
      updatedAt: now,
    });
    assert.equal(domain.id, 'ch_1');
    assert.equal(domain.label, 'LinkedIn');

    const createInput = PrismaContactChannelRecordMapper.toPrismaCreate({
      label: 'Email',
      value: 'a@b.com',
      order: 2,
    });
    assert.equal(createInput.order, 2);

    const updateInput = PrismaContactChannelRecordMapper.toPrismaUpdate({
      value: 'c@d.com',
    });
    assert.equal(updateInput.value, 'c@d.com');
    assert.equal(updateInput.label, undefined);
  });

  await runTest('PrismaContactChannelRepository acquires CONTACT_CHANNEL advisory lock on create', async () => {
    const executedSql: string[] = [];
    const now = new Date();

    const mockTx = {
      $executeRawUnsafe: async (query: string) => {
        executedSql.push(query);
        return 1;
      },
      contactChannel: {
        aggregate: async () => ({ _max: { order: 3 } }),
        create: async ({ data }: { data: { label: string; value: string; order: number } }) => ({
          id: 'ch_new',
          label: data.label,
          value: data.value,
          order: data.order,
          createdAt: now,
          updatedAt: now,
        }),
      },
    };

    const mockPrisma = {
      $transaction: async <T>(cb: (tx: typeof mockTx) => Promise<T>) => cb(mockTx),
    } as unknown as PrismaClient;

    const repo = new PrismaContactChannelRepository(mockPrisma);
    const created = await repo.create({ label: 'Website', value: 'https://agun.dev' });

    assert.equal(created.order, 4);
    assert.equal(executedSql.length, 1);
    assert.ok(
      executedSql[0].includes(`pg_advisory_xact_lock(${AdvisoryLockNamespace.CONTACT_CHANNEL}, 0)`),
      'Must acquire CONTACT_CHANNEL advisory lock'
    );
  });

  // -----------------------------------------------------------------
  // 4. Admin Account DTO Validation Tests
  // -----------------------------------------------------------------
  console.log('\n4. Admin Account DTO Validators:');

  await runTest('UpdateAdminProfile DTO validates username, normalizes email, rejects system fields', () => {
    const valid = validateUpdateAdminProfileInput({
      username: '  Agun_Admin  ',
      email: '  Agun@Example.COM  ',
      currentPassword: 'CurrentStrongPassword123',
    });
    assert.equal(valid.success, true);
    if (valid.success) {
      assert.equal(valid.data.username, 'agun_admin');
      assert.equal(valid.data.email, 'agun@example.com');
    }

    const blankEmail = validateUpdateAdminProfileInput({
      username: 'admin1',
      email: '   ',
      currentPassword: 'CurrentStrongPassword123',
    });
    assert.equal(blankEmail.success, true);
    if (blankEmail.success) {
      assert.equal(blankEmail.data.email, null);
    }

    const invalid = validateUpdateAdminProfileInput({
      id: 'hack',
      passwordHash: 'hack',
      sessionVersion: 99,
      username: 'ab',
      email: 'not-an-email',
      currentPassword: '',
    });
    assert.equal(invalid.success, false);
    if (!invalid.success) {
      assert.ok(invalid.errors.id);
      assert.ok(invalid.errors.passwordHash);
      assert.ok(invalid.errors.sessionVersion);
      assert.ok(invalid.errors.username);
      assert.ok(invalid.errors.email);
      assert.ok(invalid.errors.currentPassword);
    }
  });

  await runTest('ChangeAdminPassword DTO enforces strong policy, username exclusion, and confirmation', () => {
    const weak = validateChangeAdminPasswordInput(
      {
        currentPassword: 'OldPassword123',
        newPassword: 'short',
        confirmPassword: 'different',
      },
      'agunadmin'
    );
    assert.equal(weak.success, false);
    if (!weak.success) {
      assert.ok(weak.errors.newPassword);
      assert.ok(weak.errors.confirmPassword);
    }

    const containsUser = validateChangeAdminPasswordInput(
      {
        currentPassword: 'OldPassword123',
        newPassword: 'MyAgunAdminPassword99',
        confirmPassword: 'MyAgunAdminPassword99',
      },
      'agunadmin'
    );
    assert.equal(containsUser.success, false);
    if (!containsUser.success) {
      assert.ok(containsUser.errors.newPassword?.includes('username'));
    }

    const sameAsCurrent = validateChangeAdminPasswordInput(
      {
        currentPassword: 'SameStrongPassword123',
        newPassword: 'SameStrongPassword123',
        confirmPassword: 'SameStrongPassword123',
      },
      'agunadmin'
    );
    assert.equal(sameAsCurrent.success, false);
    if (!sameAsCurrent.success) {
      assert.ok(sameAsCurrent.errors.newPassword?.includes('different'));
    }

    const valid = validateChangeAdminPasswordInput(
      {
        currentPassword: 'OldStrongPassword123',
        newPassword: 'NewStrongPassword456',
        confirmPassword: 'NewStrongPassword456',
      },
      'agunadmin'
    );
    assert.equal(valid.success, true);
  });

  // -----------------------------------------------------------------
  // 5. Admin Account Use Cases (3 Use Cases)
  // -----------------------------------------------------------------
  console.log('\n5. Admin Account Use Cases (In-Memory Repository):');

  await runTest('GetAdminAccountUseCase returns sanitized snapshot without passwordHash', async () => {
    const adminRepo = new InMemoryAdminRepository({
      id: 'adm_1',
      username: 'agun',
      email: 'agun@example.com',
      passwordHash: 'hashed:InitialSecret123',
      sessionVersion: 3,
    });
    const uc = new GetAdminAccountUseCase(adminRepo);
    const snapshot = await uc.execute('adm_1');

    assert.ok(snapshot !== null);
    assert.equal(snapshot.admin.username, 'agun');
    assert.equal(snapshot.sessionVersion, 3);
    assert.equal('passwordHash' in snapshot.admin, false);
    assert.equal(await uc.execute('non_existent'), null);
  });

  await runTest('UpdateAdminProfileUseCase verifies password, checks uniqueness, and updates profile', async () => {
    const adminRepo = new InMemoryAdminRepository({
      id: 'adm_1',
      username: 'agun',
      email: 'agun@example.com',
      passwordHash: 'hashed:InitialSecret123',
      sessionVersion: 2,
    });
    // Add another admin record solely in-memory to test collision guard
    const now = new Date();
    adminRepo.records.push({
      admin: {
        id: 'adm_other',
        username: 'taken_user',
        email: 'taken@example.com',
        createdAt: now,
        updatedAt: now,
      },
      passwordHash: 'hashed:OtherPass12345',
      sessionVersion: 1,
    });

    const uc = new UpdateAdminProfileUseCase(adminRepo, new MockPasswordService());

    // Wrong current password
    const badPass = await uc.execute('adm_1', {
      username: 'agun_new',
      email: 'new@example.com',
      currentPassword: 'WrongPassword123',
    });
    assert.equal(badPass.success, false);
    assert.ok(badPass.errors?.currentPassword);

    // Duplicate username
    const dupUser = await uc.execute('adm_1', {
      username: 'taken_user',
      email: 'new@example.com',
      currentPassword: 'InitialSecret123',
    });
    assert.equal(dupUser.success, false);
    assert.ok(dupUser.errors?.username);

    // Duplicate email
    const dupEmail = await uc.execute('adm_1', {
      username: 'agun_new',
      email: 'taken@example.com',
      currentPassword: 'InitialSecret123',
    });
    assert.equal(dupEmail.success, false);
    assert.ok(dupEmail.errors?.email);

    // Valid update
    const ok = await uc.execute('adm_1', {
      username: 'agun_new',
      email: 'new@example.com',
      currentPassword: 'InitialSecret123',
    });
    assert.equal(ok.success, true);
    assert.equal(ok.data?.username, 'agun_new');
    assert.equal(ok.data?.email, 'new@example.com');
    assert.equal(ok.sessionVersion, 2);
  });

  await runTest('ChangeAdminPasswordUseCase verifies password, hashes new password, increments sessionVersion', async () => {
    const adminRepo = new InMemoryAdminRepository({
      id: 'adm_1',
      username: 'agun',
      email: 'agun@example.com',
      passwordHash: 'hashed:InitialSecret123',
      sessionVersion: 4,
    });
    const uc = new ChangeAdminPasswordUseCase(adminRepo, new MockPasswordService());

    // Wrong current password
    const wrong = await uc.execute('adm_1', {
      currentPassword: 'WrongPassword123',
      newPassword: 'UpdatedPassword456',
      confirmPassword: 'UpdatedPassword456',
    });
    assert.equal(wrong.success, false);
    assert.ok(wrong.errors?.currentPassword);
    assert.equal(await adminRepo.getSessionVersion('adm_1'), 4);

    // Success
    const ok = await uc.execute('adm_1', {
      currentPassword: 'InitialSecret123',
      newPassword: 'UpdatedPassword456',
      confirmPassword: 'UpdatedPassword456',
    });
    assert.equal(ok.success, true);
    assert.equal(ok.sessionVersion, 5);
    assert.equal(await adminRepo.getSessionVersion('adm_1'), 5);
    const updatedAuth = await adminRepo.findAuthById('adm_1');
    assert.equal(updatedAuth?.passwordHash, 'hashed:UpdatedPassword456');
  });

  // -----------------------------------------------------------------
  // 6. Server Action Security (Unauthenticated Rejection via DAL)
  // -----------------------------------------------------------------
  console.log('\n6. Server Action Security (6 New Actions):');

  await runTest('All 4 ContactChannel Server Actions reject unauthenticated calls', async () => {
    const form = new FormData();
    form.append('label', 'Email');
    form.append('value', 'hack@example.com');

    const r1 = await createContactChannelAction({ success: false }, form);
    assert.equal(r1.success, false);
    assert.ok(r1.error?.includes('Unauthorized') || r1.error?.includes('Authentication failed'));

    const r2 = await updateContactChannelAction('ch_1', { success: false }, form);
    assert.equal(r2.success, false);
    assert.ok(r2.error?.includes('Unauthorized') || r2.error?.includes('Authentication failed'));

    const r3 = await deleteContactChannelAction('ch_1');
    assert.equal(r3.success, false);
    assert.ok(r3.error?.includes('Unauthorized') || r3.error?.includes('Authentication failed'));

    const r4 = await reorderContactChannelsAction(['ch_1', 'ch_2']);
    assert.equal(r4.success, false);
    assert.ok(r4.error?.includes('Unauthorized') || r4.error?.includes('Authentication failed'));
  });

  await runTest('Both Account Server Actions reject unauthenticated calls', async () => {
    const profileForm = new FormData();
    profileForm.append('username', 'hacker');
    profileForm.append('currentPassword', 'Pass123456789');

    const r1 = await updateAdminProfileAction({ success: false }, profileForm);
    assert.equal(r1.success, false);
    assert.ok(r1.error?.includes('Unauthorized') || r1.error?.includes('Authentication failed'));

    const pwdForm = new FormData();
    pwdForm.append('currentPassword', 'Pass123456789');
    pwdForm.append('newPassword', 'NewPass123456789');
    pwdForm.append('confirmPassword', 'NewPass123456789');

    const r2 = await changeAdminPasswordAction({ success: false }, pwdForm);
    assert.equal(r2.success, false);
    assert.ok(r2.error?.includes('Unauthorized') || r2.error?.includes('Authentication failed'));
  });

  // -----------------------------------------------------------------
  // 7. CompositionRoot Factory Verification
  // -----------------------------------------------------------------
  console.log('\n7. CompositionRoot DI Factories:');

  await runTest('CompositionRoot resolves all Phase 6 repositories and use cases', () => {
    CompositionRoot.resetForTesting();
    const repo1 = CompositionRoot.getContactChannelRepository();
    const repo2 = CompositionRoot.getContactChannelRepository();
    assert.strictEqual(repo1, repo2);

    assert.ok(CompositionRoot.getGetContactChannelsUseCase() instanceof GetContactChannelsUseCase);
    assert.ok(
      CompositionRoot.getGetContactChannelByIdUseCase() instanceof GetContactChannelByIdUseCase
    );
    assert.ok(
      CompositionRoot.getCreateContactChannelUseCase() instanceof CreateContactChannelUseCase
    );
    assert.ok(
      CompositionRoot.getUpdateContactChannelUseCase() instanceof UpdateContactChannelUseCase
    );
    assert.ok(
      CompositionRoot.getDeleteContactChannelUseCase() instanceof DeleteContactChannelUseCase
    );
    assert.ok(
      CompositionRoot.getReorderContactChannelsUseCase() instanceof ReorderContactChannelsUseCase
    );
    assert.ok(CompositionRoot.getGetAdminAccountUseCase() instanceof GetAdminAccountUseCase);
    assert.ok(CompositionRoot.getUpdateAdminProfileUseCase() instanceof UpdateAdminProfileUseCase);
    assert.ok(CompositionRoot.getChangeAdminPasswordUseCase() instanceof ChangeAdminPasswordUseCase);
  });

  console.log(`\n=== SUMMARY: ${passed} PASSED / ${failed} FAILED ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('FATAL TEST ERROR:', err);
  process.exit(1);
});
