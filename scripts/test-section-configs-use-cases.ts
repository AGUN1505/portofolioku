// scripts/test-section-configs-use-cases.ts
import assert from 'assert';
import {
  validateCreateSectionConfigInput,
  validateUpdateSectionConfigInput,
  validateReorderSectionConfigsInput,
} from '../src/application/dtos/section-config.dto';
import { GetSectionConfigsUseCase } from '../src/application/use-cases/sections/get-sections.use-case';
import { ReorderSectionConfigsUseCase } from '../src/application/use-cases/sections/reorder-sections.use-case';
import { CompositionRoot } from '../src/infrastructure/composition-root';
import type { ISectionConfigRepository, UpdateSectionConfigData } from '../src/domain/repositories/section-config.repository';
import type { SectionConfig } from '../src/domain/entities/section-config';

async function runTests() {
  console.log('--- TEST SUITE: Section Config DTOs & Use Cases ---');

  // 1. DTO: System fields rejection in Create
  console.log('\n[DTO] Testing System Fields Rejection in Create...');
  const createWithSystemFields = validateCreateSectionConfigInput({
    id: 'cuid-123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    key: 'hero',
    label: 'Hero Section',
  });
  assert.strictEqual(createWithSystemFields.success, false);
  if (!createWithSystemFields.success) {
    assert.ok(createWithSystemFields.errors.id, 'Expected error for id');
    assert.ok(createWithSystemFields.errors.createdAt, 'Expected error for createdAt');
    assert.ok(createWithSystemFields.errors.updatedAt, 'Expected error for updatedAt');
    console.log('✓ System fields rejected in CreateSectionConfigInput:', createWithSystemFields.errors);
  }

  // 2. DTO: System fields rejection in Update
  console.log('\n[DTO] Testing System Fields Rejection in Update...');
  const updateWithSystemFields = validateUpdateSectionConfigInput({
    id: 'cuid-456',
    label: 'Updated Label',
  });
  assert.strictEqual(updateWithSystemFields.success, false);
  if (!updateWithSystemFields.success) {
    assert.ok(updateWithSystemFields.errors.id, 'Expected error for id in update');
    console.log('✓ System field id rejected in UpdateSectionConfigInput:', updateWithSystemFields.errors);
  }

  // 3. DTO: Valid Create
  console.log('\n[DTO] Testing Valid Create...');
  const validCreate = validateCreateSectionConfigInput({
    key: 'testimonials',
    label: 'Testimonials Section',
    order: 7,
    enabled: true,
  });
  assert.strictEqual(validCreate.success, true);
  if (validCreate.success) {
    assert.strictEqual(validCreate.data.key, 'testimonials');
    assert.strictEqual(validCreate.data.label, 'Testimonials Section');
    assert.strictEqual(validCreate.data.order, 7);
    assert.strictEqual(validCreate.data.enabled, true);
    console.log('✓ Valid CreateSectionConfigInput accepted:', validCreate.data);
  }

  // 4. DTO: Valid Update
  console.log('\n[DTO] Testing Valid Update...');
  const validUpdate = validateUpdateSectionConfigInput({
    label: 'New Section Label',
    enabled: false,
  });
  assert.strictEqual(validUpdate.success, true);
  if (validUpdate.success) {
    assert.strictEqual(validUpdate.data.label, 'New Section Label');
    assert.strictEqual(validUpdate.data.enabled, false);
    console.log('✓ Valid UpdateSectionConfigInput accepted:', validUpdate.data);
  }

  // 5. DTO: Empty Update rejection
  console.log('\n[DTO] Testing Empty Update Rejection...');
  const emptyUpdate = validateUpdateSectionConfigInput({});
  assert.strictEqual(emptyUpdate.success, false);
  if (!emptyUpdate.success) {
    assert.ok(emptyUpdate.errors._general);
    console.log('✓ Empty update rejected:', emptyUpdate.errors);
  }

  // 5b. DTO: Reorder input validation
  console.log('\n[DTO] Testing Reorder Input Validation...');
  const reorderDtoValidation = validateReorderSectionConfigsInput(['sec-1', 'sec-2']);
  assert.strictEqual(reorderDtoValidation.success, true);
  const invalidReorder = validateReorderSectionConfigsInput('not-an-array');
  assert.strictEqual(invalidReorder.success, false);
  console.log('✓ Reorder input validation passed');

  // 6. Mock Repository for Use Case Testing
  console.log('\n[Use Cases] Setting up mock repository...');
  const mockStore: SectionConfig[] = [
    { id: 'sec-1', key: 'hero', label: 'Hero', order: 1, enabled: true },
    { id: 'sec-2', key: 'about', label: 'About', order: 2, enabled: true },
    { id: 'sec-3', key: 'projects', label: 'Projects', order: 3, enabled: true },
  ];

  let lastReordered: string[] = [];

  const mockRepo: ISectionConfigRepository = {
    async getAll(): Promise<SectionConfig[]> {
      return [...mockStore];
    },
    async findAll(): Promise<SectionConfig[]> {
      return [...mockStore];
    },
    async getById(id: string): Promise<SectionConfig | null> {
      return mockStore.find((s) => s.id === id) || null;
    },
    async findById(id: string): Promise<SectionConfig | null> {
      return mockStore.find((s) => s.id === id) || null;
    },
    async getByKey(key: string): Promise<SectionConfig | null> {
      return mockStore.find((s) => s.key === key) || null;
    },
    async findByKey(key: string): Promise<SectionConfig | null> {
      return mockStore.find((s) => s.key === key) || null;
    },
    async update(keyOrId: string, data: UpdateSectionConfigData): Promise<SectionConfig> {
      const idx = mockStore.findIndex((s) => s.id === keyOrId || s.key === keyOrId);
      if (idx === -1) throw new Error('Not found');
      const updated = { ...mockStore[idx], ...data };
      mockStore[idx] = updated;
      return updated;
    },
    async reorder(orderedIds: string[]): Promise<void> {
      lastReordered = [...orderedIds];
    },
  };

  // 7. GetSectionConfigsUseCase test
  console.log('\n[GetSectionConfigsUseCase] Testing getAll retrieval...');
  const getUseCase = new GetSectionConfigsUseCase(mockRepo);
  const sections = await getUseCase.execute();
  assert.strictEqual(sections.length, 3);
  assert.strictEqual(sections[0].key, 'hero');
  console.log('✓ GetSectionConfigsUseCase returned all items successfully');

  // 8. ReorderSectionConfigsUseCase: Strict validation tests
  console.log('\n[ReorderSectionConfigsUseCase] Testing strict validations...');
  const reorderUseCase = new ReorderSectionConfigsUseCase(mockRepo);

  // 8a. Duplicate check
  console.log('  Testing duplicate check...');
  const dupResult = await reorderUseCase.execute(['sec-1', 'sec-2', 'sec-1']);
  assert.strictEqual(dupResult.success, false);
  assert.ok(dupResult.error?.includes('duplicate'));
  console.log('  ✓ Duplicate IDs rejected:', dupResult.error);

  // 8b. Length match
  console.log('  Testing length match check...');
  const lenResult = await reorderUseCase.execute(['sec-1', 'sec-2']);
  assert.strictEqual(lenResult.success, false);
  assert.ok(lenResult.error?.includes('count'));
  console.log('  ✓ Length mismatch rejected:', lenResult.error);

  // 8c. ID existence check
  console.log('  Testing ID existence check...');
  const existResult = await reorderUseCase.execute(['sec-1', 'sec-2', 'sec-unknown']);
  assert.strictEqual(existResult.success, false);
  assert.ok(existResult.error?.includes('does not exist'));
  console.log('  ✓ Non-existent ID rejected:', existResult.error);

  // 8d. Valid reorder
  console.log('  Testing valid reorder execution...');
  const validReorder = await reorderUseCase.execute(['sec-3', 'sec-1', 'sec-2']);
  assert.strictEqual(validReorder.success, true);
  assert.deepStrictEqual(lastReordered, ['sec-3', 'sec-1', 'sec-2']);
  console.log('  ✓ Valid reorder executed and persisted to repo');

  // 9. CompositionRoot Registration
  console.log('\n[CompositionRoot] Testing use case registration...');
  CompositionRoot.resetForTesting();

  const crGetUseCase = CompositionRoot.getGetSectionConfigsUseCase();
  assert.ok(crGetUseCase instanceof GetSectionConfigsUseCase, 'Should return GetSectionConfigsUseCase');
  console.log('✓ CompositionRoot.getGetSectionConfigsUseCase() returned instance correctly');

  const crReorderUseCase = CompositionRoot.getReorderSectionConfigsUseCase();
  assert.ok(crReorderUseCase instanceof ReorderSectionConfigsUseCase, 'Should return ReorderSectionConfigsUseCase');
  console.log('✓ CompositionRoot.getReorderSectionConfigsUseCase() returned instance correctly');

  console.log('\n==========================================');
  console.log('ALL TESTS PASSED SUCCESSFULLY! ✓');
  console.log('==========================================');
}

runTests().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
