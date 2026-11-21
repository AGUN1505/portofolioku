// scripts/test-certificates-module.ts
// Comprehensive Automated Security & Verification Test Suite for Certificates Module.
// Strictly runs zero-DB in-memory tests (no live database connection, no .env.local).

import { strict as assert } from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  validateCreateCertificate,
  validateUpdateCertificate,
  validateCertificateFileUrl,
  validateHttpOrHttpsUrl,
} from '../src/application/dtos/certificate.dto';

import {
  validateCertificateFile,
  uploadCertificateFile,
  deleteCertificateFile,
  verifyMagicBytes,
  isAllowedCertificateExtension,
  ALLOWED_CERTIFICATE_MIME_TYPES,
  ALLOWED_CERTIFICATE_EXTENSIONS,
  MAX_CERTIFICATE_FILE_SIZE,
  CERTIFICATE_URL_PREFIX,
  CertificateUploadService,
} from '../src/infrastructure/storage/upload.service';

import { CertificatesSection } from '../src/presentation/components/portfolio/CertificatesSection';
import type { CertificateViewModel } from '../src/presentation/view-models';

async function runTestSuite(): Promise<void> {
  console.log('================================================================');
  console.log('   CERTIFICATES MODULE COMPREHENSIVE SECURITY AUDIT SUITE       ');
  console.log('   Run ID: run_04700e32a7f2 | Execution: Strict Zero-DB         ');
  console.log('================================================================\n');

  let totalChecks = 0;
  let passedChecks = 0;

  function pass(msg: string) {
    totalChecks++;
    passedChecks++;
    console.log(`  ✓ ${msg}`);
  }

  // =========================================================================
  // PILLAR 1: DTO Validation & Anti-Tampering Security
  // =========================================================================
  console.log('[Pillar 1: DTO Validation & Anti-Tampering Hardening]');
  {
    // 1.1: System fields rejection (id, createdAt, updatedAt)
    const createWithSystemFields = validateCreateCertificate({
      id: 'injected-id',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      title: 'Valid Title',
      issuer: 'Valid Issuer',
      fileUrl: '/uploads/certificates/valid.pdf',
    });
    assert.strictEqual(createWithSystemFields.success, false);
    if (!createWithSystemFields.success) {
      assert.ok(createWithSystemFields.errors.id?.includes('system-controlled'));
      assert.ok(createWithSystemFields.errors.createdAt?.includes('system-controlled'));
      assert.ok(createWithSystemFields.errors.updatedAt?.includes('system-controlled'));
    }
    pass('1.1: validateCreateCertificate strictly rejects system fields (id, createdAt, updatedAt)');

    const updateWithSystemFields = validateUpdateCertificate({
      id: 'injected-id',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    assert.strictEqual(updateWithSystemFields.success, false);
    if (!updateWithSystemFields.success) {
      assert.ok(updateWithSystemFields.errors.id?.includes('system-controlled'));
      assert.ok(updateWithSystemFields.errors.createdAt?.includes('system-controlled'));
      assert.ok(updateWithSystemFields.errors.updatedAt?.includes('system-controlled'));
    }
    pass('1.2: validateUpdateCertificate strictly rejects system fields (id, createdAt, updatedAt)');

    // 1.2: Unexpected / unwhitelisted fields rejection
    const unwhitelistedFields = validateCreateCertificate({
      title: 'Valid Title',
      issuer: 'Valid Issuer',
      fileUrl: '/uploads/certificates/valid.pdf',
      role: 'admin',
      isSuperuser: true,
      __proto__: {},
    });
    assert.strictEqual(unwhitelistedFields.success, false);
    if (!unwhitelistedFields.success) {
      assert.ok(unwhitelistedFields.errors.role?.includes('not allowed'));
      assert.ok(unwhitelistedFields.errors.isSuperuser?.includes('not allowed'));
    }
    pass('1.3: DTO validator rejects arbitrary unwhitelisted parameter tampering');

    // 1.3: Title validation (1-200 chars, whitespace trimmed, non-empty)
    const emptyTitle = validateCreateCertificate({
      title: '   ',
      issuer: 'Issuer',
      fileUrl: '/uploads/certificates/test.pdf',
    });
    assert.strictEqual(emptyTitle.success, false);

    const longTitle = validateCreateCertificate({
      title: 'A'.repeat(201),
      issuer: 'Issuer',
      fileUrl: '/uploads/certificates/test.pdf',
    });
    assert.strictEqual(longTitle.success, false);

    const validTitle = validateCreateCertificate({
      title: 'Certified Kubernetes Administrator (CKA)',
      issuer: 'Cloud Native Computing Foundation',
      fileUrl: '/uploads/certificates/test.pdf',
    });
    assert.strictEqual(validTitle.success, true);
    pass('1.4: Title enforces 1-200 character boundary and trims whitespace');

    // 1.4: Issuer validation (1-200 chars)
    const emptyIssuer = validateCreateCertificate({
      title: 'Title',
      issuer: '',
      fileUrl: '/uploads/certificates/test.pdf',
    });
    assert.strictEqual(emptyIssuer.success, false);

    const longIssuer = validateCreateCertificate({
      title: 'Title',
      issuer: 'B'.repeat(201),
      fileUrl: '/uploads/certificates/test.pdf',
    });
    assert.strictEqual(longIssuer.success, false);
    pass('1.5: Issuer enforces 1-200 character boundary and rejects empty strings');

    // 1.5: FileUrl security validation (XSS & Protocol injection)
    const dangerousProtocols = [
      'javascript:alert(document.cookie)',
      'JAVASCRIPT:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'vbscript:msgbox("hacked")',
      'file:///etc/passwd',
      'blob:https://example.com/uuid',
      '//attacker.com/malicious.pdf',
      '/uploads/certificates/<script>alert(1)</script>.pdf',
      '/uploads/certificates/test"onmouseover="alert(1).pdf',
    ];

    for (const dangerous of dangerousProtocols) {
      const err = validateCertificateFileUrl(dangerous);
      assert.ok(err !== null, `Expected dangerous fileUrl "${dangerous}" to be rejected`);

      const dtoRes = validateCreateCertificate({
        title: 'Title',
        issuer: 'Issuer',
        fileUrl: dangerous,
      });
      assert.strictEqual(dtoRes.success, false, `DTO must reject "${dangerous}"`);
    }
    pass(`1.6: fileUrl rejects all ${dangerousProtocols.length} dangerous schemes (javascript:, data:, vbscript:, file:, //, XSS tags)`);

    // Valid fileUrl paths & URLs
    const safeLocalPath = '/uploads/certificates/valid-cert-123.pdf';
    assert.strictEqual(validateCertificateFileUrl(safeLocalPath), null);

    const safeHttpsUrl = 'https://credentials.example.org/verify/pdf/12345';
    assert.strictEqual(validateCertificateFileUrl(safeHttpsUrl), null);
    pass('1.7: fileUrl accepts valid root-relative /uploads paths and https:// URLs');

    // 1.6: credentialUrl validation
    assert.ok(validateHttpOrHttpsUrl('javascript:alert(1)', 'Credential URL') !== null);
    assert.ok(validateHttpOrHttpsUrl('data:text/html,abc', 'Credential URL') !== null);
    assert.strictEqual(validateHttpOrHttpsUrl('https://verify.coursera.org/xyz', 'Credential URL'), null);
    pass('1.8: credentialUrl strictly rejects dangerous non-HTTP/HTTPS protocols');

    // 1.7: order validation
    const invalidOrders = [-1, 0, 1.5, NaN, Infinity];
    for (const badOrder of invalidOrders) {
      const res = validateCreateCertificate({
        title: 'Title',
        issuer: 'Issuer',
        fileUrl: '/uploads/certificates/valid.pdf',
        order: badOrder,
      });
      assert.strictEqual(res.success, false, `Order "${badOrder}" must be rejected`);
    }
    pass('1.9: order enforces positive integer constraints');

    // 1.8: issueDate validation
    const invalidDateRes = validateCreateCertificate({
      title: 'Title',
      issuer: 'Issuer',
      fileUrl: '/uploads/certificates/valid.pdf',
      issueDate: '2023-13-45', // invalid month and day
    });
    assert.strictEqual(invalidDateRes.success, false);

    const validDateRes = validateCreateCertificate({
      title: 'Title',
      issuer: 'Issuer',
      fileUrl: '/uploads/certificates/valid.pdf',
      issueDate: '2023-08-15',
    });
    assert.strictEqual(validDateRes.success, true);
    if (validDateRes.success) {
      assert.ok(validDateRes.data.issueDate instanceof Date);
    }
    pass('1.10: issueDate correctly validates strict ISO date format and calendar boundaries');
  }

  // =========================================================================
  // PILLAR 2: File Upload Security & MIME Hardening
  // =========================================================================
  console.log('\n[Pillar 2: File Upload Hardening & Magic-Byte Verification]');
  {
    // 2.1: Allowed extensions and MIME types whitelist
    assert.ok(ALLOWED_CERTIFICATE_MIME_TYPES.includes('application/pdf'));
    assert.strictEqual(typeof CertificateUploadService.upload, 'function');
    assert.deepStrictEqual(
      [...ALLOWED_CERTIFICATE_EXTENSIONS],
      ['.pdf', '.png', '.jpg', '.jpeg', '.webp']
    );
    for (const ext of ALLOWED_CERTIFICATE_EXTENSIONS) {
      assert.strictEqual(isAllowedCertificateExtension(ext), true);
      assert.strictEqual(isAllowedCertificateExtension(`document${ext}`), true);
    }
    pass('2.1: ALLOWED_CERTIFICATE_EXTENSIONS strictly limits to .pdf, .png, .jpg, .jpeg, .webp');

    // 2.2: Rejection of dangerous / executable file extensions
    const maliciousExtensions = [
      '.exe',
      '.js',
      '.html',
      '.htm',
      '.svg', // Disallowed due to XSS payload capabilities
      '.php',
      '.phtml',
      '.sh',
      '.bat',
      '.cmd',
      '.vbs',
      '.jar',
      '.py',
      '.tar.gz',
    ];

    for (const badExt of maliciousExtensions) {
      assert.strictEqual(isAllowedCertificateExtension(badExt), false);

      const fakeBuffer = Buffer.from('%PDF-1.4 fake content');
      const validation = validateCertificateFile(
        { size: 100, type: 'application/pdf', name: `exploit${badExt}` },
        fakeBuffer
      );
      assert.strictEqual(validation.valid, false, `Extension ${badExt} must be rejected`);
      assert.ok(validation.error?.toLowerCase().includes('disallowed file extension'));
    }
    pass(`2.2: Disallowed extensions strictly rejected (${maliciousExtensions.join(', ')})`);

    // 2.3: File size enforcement (<= 5MB)
    assert.strictEqual(MAX_CERTIFICATE_FILE_SIZE, 5 * 1024 * 1024);

    const oversizedFile = validateCertificateFile({
      size: MAX_CERTIFICATE_FILE_SIZE + 1,
      type: 'application/pdf',
      name: 'large.pdf',
    });
    assert.strictEqual(oversizedFile.valid, false);
    assert.ok(oversizedFile.error?.includes('exceeds the maximum limit of 5MB'));

    const emptyFile = validateCertificateFile({
      size: 0,
      type: 'application/pdf',
      name: 'empty.pdf',
    });
    assert.strictEqual(emptyFile.valid, false);
    assert.ok(emptyFile.error?.includes('empty'));
    pass('2.3: Max file size (5MB) and minimum non-empty size boundary strictly enforced');

    // 2.4: MIME spoofing defense & Magic-byte inspection
    const validPdfBuffer = Buffer.from('%PDF-1.7 valid pdf content');
    const validPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    const validJpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
    const validWebpBuffer = Buffer.from([
      0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    ]);

    assert.strictEqual(verifyMagicBytes(validPdfBuffer, 'application/pdf'), true);
    assert.strictEqual(verifyMagicBytes(validPngBuffer, 'image/png'), true);
    assert.strictEqual(verifyMagicBytes(validJpegBuffer, 'image/jpeg'), true);
    assert.strictEqual(verifyMagicBytes(validWebpBuffer, 'image/webp'), true);

    // Spoofed content checks (MIME claims one thing, content is executable/script)
    const spoofedExeAsPdf = Buffer.from('MZ\x90\x00\x03\x00\x00\x00PE executable');
    assert.strictEqual(verifyMagicBytes(spoofedExeAsPdf, 'application/pdf'), false);

    const spoofedHtmlAsPng = Buffer.from('<!DOCTYPE html><html><script>alert(1)</script>');
    assert.strictEqual(verifyMagicBytes(spoofedHtmlAsPng, 'image/png'), false);

    const spoofedPhpAsJpeg = Buffer.from('<?php system($_GET["cmd"]); ?>');
    assert.strictEqual(verifyMagicBytes(spoofedPhpAsJpeg, 'image/jpeg'), false);

    const spoofedJsAsWebp = Buffer.from('console.log("malicious code execution");');
    assert.strictEqual(verifyMagicBytes(spoofedJsAsWebp, 'image/webp'), false);

    // validateCertificateFile with spoofed buffer must fail
    const spoofedValidation = validateCertificateFile(
      { size: spoofedExeAsPdf.length, type: 'application/pdf', name: 'resume.pdf' },
      spoofedExeAsPdf
    );
    assert.strictEqual(spoofedValidation.valid, false);
    assert.ok(spoofedValidation.error?.includes('signature does not match claimed MIME type'));
    pass('2.4: Magic byte verification detects and blocks MIME spoofing across all supported formats');

    // 2.5: Path Traversal (CWE-22) prevention & Collision-resistant UUID filenames
    const uploadRes = await uploadCertificateFile({
      buffer: validPdfBuffer,
      mimeType: 'application/pdf',
      originalFilename: '../../../etc/passwd.pdf', // Path traversal attempt in filename
    });
    assert.strictEqual(uploadRes.success, true);
    assert.ok(uploadRes.filename !== undefined);
    assert.ok(uploadRes.fileUrl !== undefined);

    // Verify UUID filename: the originalFilename path traversal attempt must be completely discarded
    assert.strictEqual(uploadRes.filename.includes('..'), false);
    assert.strictEqual(uploadRes.filename.includes('/'), false);
    assert.strictEqual(uploadRes.filename.includes('\\'), false);
    assert.ok(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/.test(uploadRes.filename));
    assert.ok(uploadRes.fileUrl.startsWith(CERTIFICATE_URL_PREFIX));

    const savedDiskPath = path.join(process.cwd(), 'public', uploadRes.fileUrl);
    assert.strictEqual(fs.existsSync(savedDiskPath), true);
    pass('2.5: Upload service discards user-supplied filenames and generates collision-resistant UUIDs');

    // 2.6: deleteByUrl path traversal prevention
    const traversalDelete = await deleteCertificateFile('/uploads/certificates/../../package.json');
    assert.strictEqual(traversalDelete, false, 'deleteByUrl must reject path traversal attempt');
    assert.strictEqual(fs.existsSync(path.join(process.cwd(), 'package.json')), true);

    const nonExistentDelete = await deleteCertificateFile('/uploads/certificates/non-existent-uuid.pdf');
    assert.strictEqual(nonExistentDelete, false);

    // Clean up created file
    const legitimateDelete = await deleteCertificateFile(uploadRes.fileUrl);
    assert.strictEqual(legitimateDelete, true);
    assert.strictEqual(fs.existsSync(savedDiskPath), false);
    pass('2.6: deleteByUrl prevents path traversal attacks and cleans up verified files safely');
  }

  // =========================================================================
  // PILLAR 3: Server Actions Authorization & Session Gate
  // =========================================================================
  console.log('\n[Pillar 3: Server Actions Authorization & Revalidation Gate]');
  {
    const actionsFilePath = path.join(
      process.cwd(),
      'app',
      'admin',
      '(dashboard)',
      'certificates',
      'actions.ts'
    );
    assert.strictEqual(fs.existsSync(actionsFilePath), true, 'actions.ts must exist');

    const actionsContent = fs.readFileSync(actionsFilePath, 'utf-8');

    // 3.1: 'use server' directive
    assert.ok(
      actionsContent.includes("'use server'") || actionsContent.includes('"use server"'),
      "actions.ts must specify 'use server'"
    );
    pass("3.1: 'use server' directive present in certificates/actions.ts");

    // 3.2: Exported functions inspection
    const requiredActions = [
      'createCertificateAction',
      'updateCertificateAction',
      'deleteCertificateAction',
      'reorderCertificatesAction',
    ];

    for (const actionName of requiredActions) {
      assert.ok(
        actionsContent.includes(`export async function ${actionName}`),
        `actions.ts must export ${actionName}`
      );
    }
    pass(`3.2: All 4 Server Actions exported (${requiredActions.join(', ')})`);

    // 3.3 & 3.4: verifySession call in every action body
    for (const actionName of requiredActions) {
      const fnMarker = `export async function ${actionName}`;
      const fnStart = actionsContent.indexOf(fnMarker);
      assert.ok(fnStart !== -1);

      // Find opening brace
      const openBrace = actionsContent.indexOf('{', fnStart);
      assert.ok(openBrace !== -1);

      // Find function end by tracking braces
      let depth = 0;
      let fnEnd = -1;
      for (let i = openBrace; i < actionsContent.length; i++) {
        if (actionsContent[i] === '{') depth++;
        else if (actionsContent[i] === '}') {
          depth--;
          if (depth === 0) {
            fnEnd = i;
            break;
          }
        }
      }
      assert.ok(fnEnd !== -1);

      const fnBody = actionsContent.slice(openBrace, fnEnd);
      assert.ok(
        fnBody.includes('await verifySession()'),
        `Action ${actionName} must invoke await verifySession()`
      );

      // Verify that verifySession precedes use case execution
      const verifyIdx = fnBody.indexOf('await verifySession()');
      const useCaseIdx = fnBody.indexOf('CompositionRoot.');
      if (useCaseIdx !== -1) {
        assert.ok(
          verifyIdx < useCaseIdx,
          `Action ${actionName} must call verifySession() before invoking use cases`
        );
      }

      // Verify revalidation paths on success
      assert.ok(
        fnBody.includes("revalidatePath('/admin/certificates')") ||
          fnBody.includes('revalidatePath("/admin/certificates")'),
        `Action ${actionName} must revalidate /admin/certificates`
      );
      assert.ok(
        fnBody.includes("revalidatePath('/')") || fnBody.includes('revalidatePath("/")'),
        `Action ${actionName} must revalidate public root /`
      );
    }
    pass('3.3: Every certificate Server Action enforces authoritative DAL verifySession() before business logic');
    pass('3.4: All certificate Server Actions call revalidatePath for admin and public / views on success');
  }

  // =========================================================================
  // PILLAR 4: UI Accessibility & Keyboard Navigation
  // =========================================================================
  console.log('\n[Pillar 4: UI Accessibility & Modal Keyboard Navigation]');
  {
    const clientComponentPath = path.join(
      process.cwd(),
      'app',
      'admin',
      '(dashboard)',
      'certificates',
      'CertificateListClient.tsx'
    );
    assert.strictEqual(fs.existsSync(clientComponentPath), true);

    const clientContent = fs.readFileSync(clientComponentPath, 'utf-8');

    // 4.1: role="dialog" and aria-modal="true"
    const dialogMatches = clientContent.match(/role="dialog"/g);
    assert.ok(dialogMatches && dialogMatches.length >= 3, 'Must have at least 3 modal dialogs');

    const ariaModalMatches = clientContent.match(/aria-modal="true"/g);
    assert.ok(ariaModalMatches && ariaModalMatches.length >= 3, 'All dialogs must set aria-modal="true"');
    pass('4.1: CertificateListClient declares 3 WAI-ARIA accessible modal dialogs (Create, Edit, Delete)');

    // 4.2: aria-labelledby matching heading IDs
    const expectedHeadingIds = [
      'create-certificate-modal-title',
      'edit-certificate-modal-title',
      'delete-certificate-modal-title',
    ];

    for (const hId of expectedHeadingIds) {
      assert.ok(
        clientContent.includes(`aria-labelledby="${hId}"`),
        `Missing aria-labelledby="${hId}"`
      );
      assert.ok(
        clientContent.includes(`id="${hId}"`),
        `Missing corresponding heading <h2 id="${hId}">`
      );
    }
    pass('4.2: Every modal dialog pairs aria-labelledby with a matching heading id');

    // 4.3: Escape key dismissal with cleanup
    assert.ok(
      clientContent.includes("event.key === 'Escape'"),
      "Must listen for event.key === 'Escape'"
    );
    assert.ok(
      clientContent.includes("window.addEventListener('keydown', handleKeyDown)"),
      'Must register window keydown listener'
    );
    assert.ok(
      clientContent.includes("window.removeEventListener('keydown', handleKeyDown)"),
      'Must clean up window keydown listener on unmount'
    );
    pass('4.3: Global Escape key listener handles dismissal safely with proper cleanup');

    // 4.4: Accessible order control buttons
    assert.ok(clientContent.includes('aria-label={`Move certificate'));
    pass('4.4: Reorder buttons include informative aria-labels for assistive technologies');
  }

  // =========================================================================
  // PILLAR 5: Public Presentation & Anti-Placeholder Compliance
  // =========================================================================
  console.log('\n[Pillar 5: Public Portfolio Presentation & Placeholder Audit]');
  {
    const sectionPath = path.join(
      process.cwd(),
      'src',
      'presentation',
      'components',
      'portfolio',
      'CertificatesSection.tsx'
    );
    assert.strictEqual(fs.existsSync(sectionPath), true);

    const sectionContent = fs.readFileSync(sectionPath, 'utf-8');

    // 5.1: Export verification
    assert.ok(
      sectionContent.includes('export function CertificatesSection'),
      'CertificatesSection must be exported'
    );

    // 5.2: Placeholder scan
    const forbiddenPatterns = [
      'TODO',
      'Lorem ipsum',
      'Placeholder Value',
      '[ Profile URL Placeholder ]',
      '[ Email Placeholder',
      'Ready for official',
    ];

    for (const pattern of forbiddenPatterns) {
      assert.strictEqual(
        sectionContent.includes(pattern),
        false,
        `CertificatesSection must NOT contain synthetic placeholder pattern "${pattern}"`
      );
    }
    pass('5.1: Zero synthetic placeholders found in CertificatesSection.tsx');

    // 5.3: External link safety (rel="noopener noreferrer")
    assert.ok(
      sectionContent.includes('target="_blank"'),
      'External links must have target="_blank"'
    );
    assert.ok(
      sectionContent.includes('rel="noopener noreferrer"'),
      'External links must have rel="noopener noreferrer"'
    );
    pass('5.2: External certificate links enforce target="_blank" and rel="noopener noreferrer"');

    // 5.4: Responsive breakpoints
    assert.ok(sectionContent.includes('hidden xl:block'), 'Must include Desktop container (1280px+)');
    assert.ok(sectionContent.includes('hidden md:block xl:hidden'), 'Must include Tablet container (768px-1279px)');
    assert.ok(sectionContent.includes('md:hidden'), 'Must include Mobile container (<768px)');
    pass('5.3: Responsive Swiss layouts declared for Desktop, Tablet, and Mobile viewports');

    // 5.5: Empty state graceful omission test (pure unit test of component logic)
    const emptyResult = CertificatesSection({ certificates: [] });
    assert.strictEqual(emptyResult, null, 'CertificatesSection must render null when certificates is empty');

    const sampleCert: CertificateViewModel = {
      id: 'cert_1',
      title: 'Backend Engineering',
      issuer: 'Linux Foundation',
      issueDate: '2023-08-15',
      formattedDate: 'Aug 2023',
      credentialId: 'LF-12345',
      credentialUrl: 'https://example.org/verify/12345',
      fileUrl: '/uploads/certificates/linux.pdf',
      isPdf: true,
      order: 1,
    };
    const nonEmptyResult = CertificatesSection({ certificates: [sampleCert] });
    assert.notStrictEqual(nonEmptyResult, null);
    pass('5.4: CertificatesSection gracefully omits section when 0 certificates configured');
  }

  console.log('\n================================================================');
  console.log(`   ✅ ALL ${passedChecks} OF ${totalChecks} CHECKS PASSED SUCCESSFULLY (100%)       `);
  console.log('================================================================');
}

runTestSuite().catch((err) => {
  console.error('\n❌ Security verification failed:', err);
  process.exit(1);
});
