// scripts/test-certificates-backend.ts
// Comprehensive unit test for Certificates Domain, Application, Infrastructure, and Upload Service.
// Strictly runs zero-DB in-memory tests.

import { strict as assert } from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  validateCreateCertificate,
  validateUpdateCertificate,
} from '../src/application/dtos/certificate.dto';
import {
  validateCertificateFile,
  uploadCertificateFile,
  deleteCertificateFile,
  verifyMagicBytes,
  MAX_CERTIFICATE_FILE_SIZE,
} from '../src/infrastructure/storage/upload.service';
import { CompositionRoot } from '../src/infrastructure/composition-root';
import { StaticPortfolioRepository } from '../src/infrastructure/repositories/static-portfolio.repository';
import { ResilientPortfolioRepository } from '../src/infrastructure/repositories/resilient-portfolio.repository';
import type { IPortfolioRepository } from '../src/domain/repositories/portfolio.repository';
import type { Portfolio } from '../src/domain/entities';
import type { ICertificateRepository } from '../src/domain/repositories/certificate.repository';
import type { Certificate } from '../src/domain/entities/certificate';
import { CreateCertificateUseCase } from '../src/application/use-cases/certificates/create-certificate.use-case';
import { UpdateCertificateUseCase } from '../src/application/use-cases/certificates/update-certificate.use-case';
import { DeleteCertificateUseCase } from '../src/application/use-cases/certificates/delete-certificate.use-case';
import { ReorderCertificatesUseCase } from '../src/application/use-cases/certificates/reorder-certificates.use-case';
import { GetCertificatesUseCase } from '../src/application/use-cases/certificates/get-certificates.use-case';

async function main(): Promise<void> {
  console.log('================================================================');
  console.log('   CERTIFICATES BACKEND UNIT TESTS (ZERO-DB IN-MEMORY)          ');
  console.log('================================================================\n');

  // 1. DTO Validation Suite
  console.log('1. Testing Certificate DTO Validators...');
  {
    // Valid create input
    const validCreate = validateCreateCertificate({
      title: 'Backend Engineering with Go',
      issuer: 'Meta',
      issueDate: '2023-08-15',
      credentialId: 'META-12345',
      credentialUrl: 'https://coursera.org/verify/12345',
      fileUrl: '/uploads/certificates/meta-go.pdf',
    });
    assert.strictEqual(validCreate.success, true);
    if (validCreate.success) {
      assert.strictEqual(validCreate.data.title, 'Backend Engineering with Go');
      assert.strictEqual(validCreate.data.issuer, 'Meta');
      assert.strictEqual(validCreate.data.fileUrl, '/uploads/certificates/meta-go.pdf');
      assert(validCreate.data.issueDate instanceof Date);
    }

    // System fields rejection
    const systemFields = validateCreateCertificate({
      id: 'hacker-id',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      title: 'Test',
      issuer: 'Issuer',
      fileUrl: '/path.pdf',
    });
    assert.strictEqual(systemFields.success, false);
    if (!systemFields.success) {
      assert(systemFields.errors.id !== undefined);
      assert(systemFields.errors.createdAt !== undefined);
      assert(systemFields.errors.updatedAt !== undefined);
    }

    // Missing required fields
    const missingRequired = validateCreateCertificate({});
    assert.strictEqual(missingRequired.success, false);
    if (!missingRequired.success) {
      assert(missingRequired.errors.title !== undefined);
      assert(missingRequired.errors.issuer !== undefined);
      assert(missingRequired.errors.fileUrl !== undefined);
    }

    // Invalid update input
    const invalidUpdate = validateUpdateCertificate({
      title: '', // empty title not allowed
      fileUrl: '', // empty fileUrl not allowed
    });
    assert.strictEqual(invalidUpdate.success, false);

    console.log('   ✓ DTO validators correctly whitelist, validate, and reject invalid inputs.\n');
  }

  // 2. Upload Service Suite
  console.log('2. Testing Certificate File Upload Service...');
  {
    // Magic byte detection
    const fakePdf = Buffer.from('%PDF-1.4 dummy content');
    const fakePng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const fakeJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const invalidBuffer = Buffer.from('NOT A VALID IMAGE OR PDF');

    assert.strictEqual(verifyMagicBytes(fakePdf, 'application/pdf'), true);
    assert.strictEqual(verifyMagicBytes(fakePng, 'image/png'), true);
    assert.strictEqual(verifyMagicBytes(fakeJpeg, 'image/jpeg'), true);
    assert.strictEqual(verifyMagicBytes(invalidBuffer, 'application/pdf'), false);

    // Size limit validation
    const oversizeValidation = validateCertificateFile({
      size: MAX_CERTIFICATE_FILE_SIZE + 100,
      type: 'application/pdf',
    });
    assert.strictEqual(oversizeValidation.valid, false);

    // Unsupported MIME validation
    const unsupportedMime = validateCertificateFile({
      size: 1024,
      type: 'application/x-msdownload',
    });
    assert.strictEqual(unsupportedMime.valid, false);

    // Test actual upload writing and cleanup
    const uploadRes = await uploadCertificateFile({
      buffer: fakePdf,
      mimeType: 'application/pdf',
      originalFilename: 'test-certificate.pdf',
    });
    assert.strictEqual(uploadRes.success, true);
    assert(uploadRes.fileUrl?.startsWith('/uploads/certificates/'));
    assert(uploadRes.fileUrl?.endsWith('.pdf'));

    const diskPath = path.join(process.cwd(), 'public', uploadRes.fileUrl!);
    assert.strictEqual(fs.existsSync(diskPath), true);

    // Test cleanup
    const deleteRes = await deleteCertificateFile(uploadRes.fileUrl!);
    assert.strictEqual(deleteRes, true);
    assert.strictEqual(fs.existsSync(diskPath), false);

    console.log('   ✓ Upload service validates MIME, magic bytes, size limits, and persists safely.\n');
  }

  // 3. Static & Resilient Portfolio Aggregate Suite
  console.log('3. Testing Static & Resilient Portfolio Repositories with Certificates...');
  {
    const staticRepo = new StaticPortfolioRepository();
    const staticData = staticRepo.getPortfolioData();
    assert(Array.isArray(staticData.certificates));
    assert(staticData.certificates.length >= 3);
    assert.strictEqual(staticData.certificates[0].id, 'cert_01');
    assert.strictEqual(staticData.certificates[0].title, 'Backend Development with Go');

    const mockPrimary: IPortfolioRepository<Promise<Portfolio>> = {
      getPortfolioData: async () => staticData,
    };
    const resilientRepo = new ResilientPortfolioRepository(mockPrimary, staticRepo);
    const resilientData = await resilientRepo.getPortfolioData();
    assert(Array.isArray(resilientData.certificates));
    assert.strictEqual(resilientData.certificates.length, staticData.certificates.length);

    console.log('   ✓ Static & resilient repositories include authentic sample certificates.\n');
  }

  // 4. Use Cases with In-Memory Mock Repository Suite
  console.log('4. Testing Application Use Cases with in-memory repository...');
  {
    const inMemoryDb: Certificate[] = [];
    const mockRepo: ICertificateRepository = {
      async findAll() {
        return [...inMemoryDb].sort((a, b) => a.order - b.order);
      },
      async findById(id: string) {
        return inMemoryDb.find((c) => c.id === id) ?? null;
      },
      async create(data) {
        const nextOrder = data.order ?? inMemoryDb.length + 1;
        const record: Certificate = {
          id: `cert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          title: data.title,
          issuer: data.issuer,
          issueDate: data.issueDate ?? null,
          credentialId: data.credentialId ?? null,
          credentialUrl: data.credentialUrl ?? null,
          fileUrl: data.fileUrl,
          order: nextOrder,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        inMemoryDb.push(record);
        return record;
      },
      async update(id, data) {
        const idx = inMemoryDb.findIndex((c) => c.id === id);
        if (idx === -1) throw new Error('Not found');
        const existing = inMemoryDb[idx];
        const updated: Certificate = {
          ...existing,
          title: data.title ?? existing.title,
          issuer: data.issuer ?? existing.issuer,
          issueDate: data.issueDate !== undefined ? data.issueDate : existing.issueDate,
          credentialId: data.credentialId !== undefined ? data.credentialId : existing.credentialId,
          credentialUrl: data.credentialUrl !== undefined ? data.credentialUrl : existing.credentialUrl,
          fileUrl: data.fileUrl ?? existing.fileUrl,
          order: data.order ?? existing.order,
          updatedAt: new Date(),
        };
        inMemoryDb[idx] = updated;
        return updated;
      },
      async delete(id) {
        const idx = inMemoryDb.findIndex((c) => c.id === id);
        if (idx === -1) throw new Error('Not found');
        inMemoryDb.splice(idx, 1);
      },
      async reorder(orderedIds) {
        for (let i = 0; i < orderedIds.length; i++) {
          const item = inMemoryDb.find((c) => c.id === orderedIds[i]);
          if (item) {
            (item as { order: number }).order = i + 1;
          }
        }
      },
    };

    const getUseCase = new GetCertificatesUseCase(mockRepo);
    const createUseCase = new CreateCertificateUseCase(mockRepo);
    const updateUseCase = new UpdateCertificateUseCase(mockRepo);
    const deleteUseCase = new DeleteCertificateUseCase(mockRepo);
    const reorderUseCase = new ReorderCertificatesUseCase(mockRepo);

    // Create 2 certificates
    const c1 = await createUseCase.execute({
      title: 'Cert 1',
      issuer: 'Issuer A',
      fileUrl: '/uploads/certificates/1.pdf',
    });
    assert.strictEqual(c1.success, true);
    assert(c1.data !== undefined);

    const c2 = await createUseCase.execute({
      title: 'Cert 2',
      issuer: 'Issuer B',
      fileUrl: '/uploads/certificates/2.pdf',
    });
    assert.strictEqual(c2.success, true);
    assert(c2.data !== undefined);

    // Get list
    const list = await getUseCase.execute();
    assert.strictEqual(list.length, 2);

    // Update c1
    const u1 = await updateUseCase.execute(c1.data.id, {
      title: 'Cert 1 Updated',
    });
    assert.strictEqual(u1.success, true);
    assert.strictEqual(u1.data?.title, 'Cert 1 Updated');

    // Reorder [c2.id, c1.id]
    const rRes = await reorderUseCase.execute([c2.data.id, c1.data.id]);
    assert.strictEqual(rRes.success, true);

    const reorderedList = await getUseCase.execute();
    assert.strictEqual(reorderedList[0].id, c2.data.id);
    assert.strictEqual(reorderedList[1].id, c1.data.id);

    // Delete c1
    const delRes = await deleteUseCase.execute(c1.data.id);
    assert.strictEqual(delRes.success, true);

    const finalList = await getUseCase.execute();
    assert.strictEqual(finalList.length, 1);
    assert.strictEqual(finalList[0].id, c2.data.id);

    console.log('   ✓ All 5 use cases executed CRUD and atomic reordering successfully.\n');
  }

  // 5. Composition Root Registration Suite
  console.log('5. Testing CompositionRoot factory registrations...');
  {
    CompositionRoot.resetForTesting();
    const repo = CompositionRoot.getCertificateRepository();
    assert(repo !== null);
    assert.strictEqual(CompositionRoot.getCertificateRepository(), repo); // singleton

    assert(CompositionRoot.getGetCertificatesUseCase() instanceof GetCertificatesUseCase);
    assert(CompositionRoot.getCertificatesUseCase() instanceof GetCertificatesUseCase);
    assert(CompositionRoot.getCreateCertificateUseCase() instanceof CreateCertificateUseCase);
    assert(CompositionRoot.getUpdateCertificateUseCase() instanceof UpdateCertificateUseCase);
    assert(CompositionRoot.getDeleteCertificateUseCase() instanceof DeleteCertificateUseCase);
    assert(CompositionRoot.getReorderCertificatesUseCase() instanceof ReorderCertificatesUseCase);

    CompositionRoot.resetForTesting();
    console.log('   ✓ CompositionRoot provides all 5 certificate use cases and repository factory.\n');
  }

  console.log('================================================================');
  console.log('   ✅ ALL CERTIFICATE BACKEND UNIT TESTS PASSED                ');
  console.log('================================================================');
}

main().catch((err) => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});
