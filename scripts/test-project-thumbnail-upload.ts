// scripts/test-project-thumbnail-upload.ts
// Comprehensive Automated Security & Verification Test Suite for Project Thumbnail Upload.
// Strictly runs zero-DB in-memory tests (no live database connection, no .env.local).
// Tests:
// 1. ProjectUploadService (MIME whitelist, magic bytes, path traversal rejection, size limit, safe deletion)
// 2. Server Actions multipart handling, auth guards, and revalidation hooks
// 3. View-model mapping and ProjectsSection presentation rendering

import { strict as assert } from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  ProjectUploadService,
  uploadProjectFile,
  deleteProjectFile,
  uploadProjectImage,
  deleteProjectImage,
  verifyMagicBytes,
  verifyProjectMagicBytes,
  detectProjectMimeType,
  detectImageMimeType,
  validateProjectFile,
  validateProjectImageFile,
  isAllowedProjectExtension,
  isAllowedImageExtension,
  ALLOWED_PROJECT_MIME_TYPES,
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_PROJECT_EXTENSIONS,
  ALLOWED_IMAGE_EXTENSIONS,
  MAX_PROJECT_FILE_SIZE,
  PROJECT_UPLOAD_DIR,
  PROJECT_URL_PREFIX,
  type AllowedProjectMimeType,
  type AllowedProjectExtension,
} from '../src/infrastructure/storage/project-upload.service';

import {
  createProjectAction,
  updateProjectAction,
  deleteProjectAction,
  reorderProjectsAction,
} from '../app/admin/(dashboard)/projects/actions';

import { PortfolioViewMapper } from '../src/presentation/mappers/portfolio-view-mapper';
import type { Project } from '../src/domain/entities';
import type { ProjectViewModel } from '../src/presentation/view-models';

async function runTestSuite(): Promise<void> {
  console.log('================================================================');
  console.log('   PROJECT THUMBNAIL UPLOAD & STORAGE SECURITY VERIFICATION     ');
  console.log('   Execution: Strict Zero-DB In-Memory Test Suite              ');
  console.log('================================================================\n');

  let totalChecks = 0;
  let passedChecks = 0;

  function pass(msg: string) {
    totalChecks++;
    passedChecks++;
    console.log(`  ✓ ${msg}`);
  }

  // =========================================================================
  // PILLAR 1: ProjectUploadService Unit & Storage Security
  // =========================================================================
  console.log('[Pillar 1: ProjectUploadService MIME Whitelist, Magic Bytes, Traversal & Size]');
  {
    // 1.1 Constants & Whitelists
    assert.strictEqual(MAX_PROJECT_FILE_SIZE, 5 * 1024 * 1024, 'Max file size must be 5MB');
    assert.strictEqual(PROJECT_URL_PREFIX, '/uploads/projects', 'URL prefix must be /uploads/projects');
    assert.ok(
      PROJECT_UPLOAD_DIR.endsWith(path.join('public', 'uploads', 'projects')),
      'Upload directory must end with public/uploads/projects'
    );

    const expectedMimes: readonly AllowedProjectMimeType[] = [
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/gif',
      'image/svg+xml',
    ];
    for (const mime of expectedMimes) {
      assert.ok(
        ALLOWED_PROJECT_MIME_TYPES.includes(mime),
        `ALLOWED_PROJECT_MIME_TYPES must include ${mime}`
      );
    }
    assert.strictEqual(ALLOWED_IMAGE_MIME_TYPES, ALLOWED_PROJECT_MIME_TYPES);

    const expectedExts: readonly AllowedProjectExtension[] = [
      '.png',
      '.jpg',
      '.jpeg',
      '.webp',
      '.gif',
      '.svg',
    ];
    for (const ext of expectedExts) {
      assert.ok(
        ALLOWED_PROJECT_EXTENSIONS.includes(ext),
        `ALLOWED_PROJECT_EXTENSIONS must include ${ext}`
      );
      assert.strictEqual(isAllowedProjectExtension(ext), true);
      assert.strictEqual(isAllowedImageExtension(`test-file${ext}`), true);
      assert.strictEqual(isAllowedProjectExtension(ext.toUpperCase()), true);
    }
    assert.strictEqual(ALLOWED_IMAGE_EXTENSIONS, ALLOWED_PROJECT_EXTENSIONS);
    pass('1.1: Constants, MIME whitelist, and extension whitelist verified');

    // 1.2 Rejection of Disallowed Extensions
    const dangerousExts = [
      '.pdf',
      '.exe',
      '.sh',
      '.php',
      '.phtml',
      '.html',
      '.htm',
      '.js',
      '.ts',
      '.jar',
      '.bat',
      '.cmd',
    ];
    for (const badExt of dangerousExts) {
      assert.strictEqual(isAllowedProjectExtension(badExt), false);
      assert.strictEqual(isAllowedImageExtension(`exploit${badExt}`), false);

      const validation = validateProjectFile({
        size: 500,
        type: 'image/png',
        name: `test${badExt}`,
      });
      assert.strictEqual(validation.valid, false, `Disallowed extension ${badExt} must be rejected`);
      assert.ok(validation.error?.includes('Disallowed file extension'));
    }
    pass(`1.2: Disallowed extensions strictly rejected (${dangerousExts.join(', ')})`);

    // 1.3 Magic Bytes Verification for All Supported Formats
    const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const validJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
    const validWebp = Buffer.from([
      0x52, 0x49, 0x46, 0x46,
      0x24, 0x00, 0x00, 0x00,
      0x57, 0x45, 0x42, 0x50,
    ]);
    const validGif87a = Buffer.from('GIF87a\x01\x00\x01\x00');
    const validGif89a = Buffer.from('GIF89a\x01\x00\x01\x00');
    const validSvg1 = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>');
    const validSvg2 = Buffer.from('<?xml version="1.0" encoding="utf-8"?>\n<svg width="24" height="24"></svg>');
    const validSvg3 = Buffer.from('<!-- comment -->\n<svg viewBox="0 0 10 10"></svg>');
    const validSvg4 = Buffer.from('<?xml version="1.0"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<svg></svg>');
    const validSvgWithBom = Buffer.from([0xef, 0xbb, 0xbf, ...Buffer.from('<svg viewBox="0 0 1 1"></svg>')]);

    assert.strictEqual(verifyMagicBytes(validPng, 'image/png'), true);
    assert.strictEqual(verifyProjectMagicBytes(validPng, 'image/png'), true);
    assert.strictEqual(detectProjectMimeType(validPng), 'image/png');
    assert.strictEqual(detectImageMimeType(validPng), 'image/png');

    assert.strictEqual(verifyMagicBytes(validJpeg, 'image/jpeg'), true);
    assert.strictEqual(verifyMagicBytes(validJpeg, 'image/jpg'), true);
    assert.strictEqual(detectProjectMimeType(validJpeg), 'image/jpeg');

    assert.strictEqual(verifyMagicBytes(validWebp, 'image/webp'), true);
    assert.strictEqual(detectProjectMimeType(validWebp), 'image/webp');

    assert.strictEqual(verifyMagicBytes(validGif87a, 'image/gif'), true);
    assert.strictEqual(verifyMagicBytes(validGif89a, 'image/gif'), true);
    assert.strictEqual(detectProjectMimeType(validGif89a), 'image/gif');

    assert.strictEqual(verifyMagicBytes(validSvg1, 'image/svg+xml'), true);
    assert.strictEqual(verifyMagicBytes(validSvg2, 'image/svg+xml'), true);
    assert.strictEqual(verifyMagicBytes(validSvg3, 'image/svg+xml'), true);
    assert.strictEqual(verifyMagicBytes(validSvg4, 'image/svg+xml'), true);
    assert.strictEqual(verifyMagicBytes(validSvgWithBom, 'image/svg+xml'), true);
    assert.strictEqual(detectProjectMimeType(validSvg1), 'image/svg+xml');
    pass('1.3: Magic byte verification passed for PNG, JPEG, WEBP, GIF, and all SVG variations');

    // 1.4 MIME Spoofing & Malicious Content Rejection
    const spoofedHtmlAsSvg = Buffer.from('<!DOCTYPE html><html><body><script>alert(1)</script></body></html>');
    assert.strictEqual(verifyMagicBytes(spoofedHtmlAsSvg, 'image/svg+xml'), false);

    const spoofedHtmlAsPng = Buffer.from('<html><head></head><body><h1>Fake PNG</h1></body></html>');
    assert.strictEqual(verifyMagicBytes(spoofedHtmlAsPng, 'image/png'), false);

    const spoofedExeAsJpeg = Buffer.from('MZ\x90\x00\x03\x00\x00\x00PE executable');
    assert.strictEqual(verifyMagicBytes(spoofedExeAsJpeg, 'image/jpeg'), false);

    const spoofedPhpAsPng = Buffer.from('<?php echo "evil payload"; ?>');
    assert.strictEqual(verifyMagicBytes(spoofedPhpAsPng, 'image/png'), false);

    const spoofedJsAsWebp = Buffer.from('console.log("malicious code execution");');
    assert.strictEqual(verifyMagicBytes(spoofedJsAsWebp, 'image/webp'), false);

    const spoofedValidation = validateProjectFile(
      { size: spoofedExeAsJpeg.length, type: 'image/jpeg', name: 'thumb.jpg' },
      spoofedExeAsJpeg
    );
    assert.strictEqual(spoofedValidation.valid, false);
    assert.ok(spoofedValidation.error?.includes('signature does not match claimed MIME type'));
    pass('1.4: Magic byte checking rejects spoofed HTML, executable, PHP, and JS payloads');

    // 1.5 File Size Boundaries & Empty File Handling
    const emptyValidation = validateProjectFile({
      size: 0,
      type: 'image/png',
      name: 'empty.png',
    });
    assert.strictEqual(emptyValidation.valid, false);
    assert.ok(emptyValidation.error?.includes('File is empty'));

    const oversizedValidation = validateProjectFile({
      size: MAX_PROJECT_FILE_SIZE + 1,
      type: 'image/png',
      name: 'huge.png',
    });
    assert.strictEqual(oversizedValidation.valid, false);
    assert.ok(oversizedValidation.error?.includes('exceeds the maximum limit of 5MB'));

    const validSizeValidation = validateProjectFile({
      size: MAX_PROJECT_FILE_SIZE,
      type: 'image/png',
      name: 'max.png',
    });
    assert.strictEqual(validSizeValidation.valid, true);
    pass('1.5: Size boundaries enforced (0-byte rejection, 5MB limit check)');

    // 1.6 Upload Persistence, UUID Filenames & Path Traversal Discard
    const testUploadDir = path.join(process.cwd(), 'public', 'uploads', 'projects');
    const uploadRes = await ProjectUploadService.upload({
      buffer: validPng,
      mimeType: 'image/png',
      originalFilename: '../../../../etc/passwd.png', // Malicious path traversal filename
    });
    assert.strictEqual(uploadRes.success, true);
    assert.ok(uploadRes.filename !== undefined);
    assert.ok(uploadRes.fileUrl !== undefined);

    // Ensure path traversal attempt was completely discarded and replaced with UUID
    assert.strictEqual(uploadRes.filename.includes('..'), false);
    assert.strictEqual(uploadRes.filename.includes('/'), false);
    assert.strictEqual(uploadRes.filename.includes('\\'), false);
    assert.ok(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.png$/.test(uploadRes.filename),
      'Filename must be a collision-resistant UUID with .png extension'
    );
    assert.ok(uploadRes.fileUrl.startsWith(PROJECT_URL_PREFIX));

    const savedDiskPath = path.join(testUploadDir, uploadRes.filename);
    assert.strictEqual(fs.existsSync(savedDiskPath), true, 'File must exist in uploads directory');
    pass('1.6: Upload discards traversal filenames and persists with collision-resistant UUID');

    // 1.7 Safe Deletion (deleteByUrl) & CWE-22 Traversal Prevention
    const traversalDeletes = [
      '/uploads/projects/../../package.json',
      '/uploads/projects/..%2f..%2fpackage.json',
      '/uploads/projects/..\\..\\package.json',
      '/uploads/projects/subdir/../test.png',
      '/uploads/projects/foo/bar.png',
      '/uploads/certificates/cert.pdf',
      'https://external.example.com/malicious.png',
      '',
    ];
    for (const evilUrl of traversalDeletes) {
      const result = await ProjectUploadService.deleteByUrl(evilUrl);
      assert.strictEqual(result, false, `deleteByUrl must return false for "${evilUrl}"`);
    }
    // Verify package.json is safe and untouched
    assert.strictEqual(fs.existsSync(path.join(process.cwd(), 'package.json')), true);

    // Non-existent valid URL
    const nonExistent = await ProjectUploadService.deleteByUrl('/uploads/projects/00000000-0000-0000-0000-000000000000.png');
    assert.strictEqual(nonExistent, false);

    // Legitimate deletion of uploaded test file
    const legitimateDelete = await ProjectUploadService.deleteByUrl(uploadRes.fileUrl);
    assert.strictEqual(legitimateDelete, true);
    assert.strictEqual(fs.existsSync(savedDiskPath), false, 'File must be deleted from disk');

    // Helper aliases test
    assert.strictEqual(uploadProjectFile, ProjectUploadService.upload);
    assert.strictEqual(deleteProjectFile, ProjectUploadService.deleteByUrl);
    assert.strictEqual(uploadProjectImage, ProjectUploadService.upload);
    assert.strictEqual(deleteProjectImage, ProjectUploadService.deleteByUrl);
    assert.strictEqual(validateProjectImageFile, validateProjectFile);
    pass('1.7: deleteByUrl strictly prevents CWE-22 traversal and cleanly deletes verified files');
  }

  // =========================================================================
  // PILLAR 2: Server Actions Multipart Handling, Auth Gates & Cleanup
  // =========================================================================
  console.log('\n[Pillar 2: Server Actions Multipart Handling & Security Audit]');
  {
    const actionsFilePath = path.join(
      process.cwd(),
      'app',
      'admin',
      '(dashboard)',
      'projects',
      'actions.ts'
    );
    assert.strictEqual(fs.existsSync(actionsFilePath), true, 'projects/actions.ts must exist');

    const actionsContent = fs.readFileSync(actionsFilePath, 'utf-8');

    // 2.1 Directive and Export Verification
    assert.ok(
      actionsContent.includes("'use server'") || actionsContent.includes('"use server"'),
      "actions.ts must specify 'use server'"
    );

    const requiredActions = [
      'createProjectAction',
      'updateProjectAction',
      'deleteProjectAction',
      'reorderProjectsAction',
    ];
    for (const actionName of requiredActions) {
      assert.ok(
        actionsContent.includes(`export async function ${actionName}`),
        `actions.ts must export ${actionName}`
      );
    }
    pass('2.1: Server Actions declaration and exports verified in projects/actions.ts');

    // 2.2 Authoritative Session Verification & Revalidation Audit
    for (const actionName of requiredActions) {
      const fnMarker = `export async function ${actionName}`;
      const fnStart = actionsContent.indexOf(fnMarker);
      assert.ok(fnStart !== -1);

      const openBrace = actionsContent.indexOf('{', fnStart);
      assert.ok(openBrace !== -1);

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

      const verifyIdx = fnBody.indexOf('await verifySession()');
      const useCaseIdx = fnBody.indexOf('CompositionRoot.');
      if (useCaseIdx !== -1) {
        assert.ok(
          verifyIdx < useCaseIdx,
          `Action ${actionName} must call verifySession() before invoking business use cases`
        );
      }

      assert.ok(
        fnBody.includes("revalidatePath('/admin/projects')") ||
          fnBody.includes('revalidatePath("/admin/projects")'),
        `Action ${actionName} must revalidate /admin/projects`
      );
      assert.ok(
        fnBody.includes("revalidatePath('/admin')") ||
          fnBody.includes('revalidatePath("/admin")'),
        `Action ${actionName} must revalidate /admin`
      );
      assert.ok(
        fnBody.includes("revalidatePath('/')") ||
          fnBody.includes('revalidatePath("/")'),
        `Action ${actionName} must revalidate /`
      );
    }
    pass('2.2: All 4 Server Actions enforce verifySession() and call revalidatePath(/admin/projects, /admin, /)');

    // 2.3 Multipart Handling Logic Audit in Server Action Code
    assert.ok(
      actionsContent.includes("formData.get('thumbnailFile')"),
      'actions.ts must extract thumbnailFile from formData'
    );
    assert.ok(
      actionsContent.includes('ProjectUploadService.upload('),
      'actions.ts must call ProjectUploadService.upload for thumbnail file upload'
    );
    assert.ok(
      actionsContent.includes('ProjectUploadService.deleteByUrl('),
      'actions.ts must call ProjectUploadService.deleteByUrl for thumbnail cleanup'
    );
    assert.ok(
      actionsContent.includes("formData.get('removeThumbnail')"),
      'updateProjectAction must support removeThumbnail flag for explicit removal'
    );
    pass('2.3: actions.ts multipart upload, replacement cleanup, and removal flow statically verified');

    // 2.4 Unauthenticated Security Rejection Execution
    const dummyForm = new FormData();
    dummyForm.append('title', 'Unauthorized Test Project');
    dummyForm.append('category', 'Security');
    dummyForm.append('description', 'Unauthorized call should be rejected by verifySession guard.');
    dummyForm.append('technologies', 'TypeScript');

    const unauthCreate = await createProjectAction({ success: false }, dummyForm);
    assert.strictEqual(unauthCreate.success, false, 'createProjectAction must reject unauthenticated call');
    assert.ok(
      Boolean(unauthCreate.error?.includes('Unauthorized') || unauthCreate.error?.includes('Authentication failed')),
      'createProjectAction must return authentication error'
    );

    const unauthUpdate = await updateProjectAction('project_test_id', { success: false }, dummyForm);
    assert.strictEqual(unauthUpdate.success, false, 'updateProjectAction must reject unauthenticated call');
    assert.ok(
      Boolean(unauthUpdate.error?.includes('Unauthorized') || unauthUpdate.error?.includes('Authentication failed')),
      'updateProjectAction must return authentication error'
    );

    const unauthDelete = await deleteProjectAction('project_test_id');
    assert.strictEqual(unauthDelete.success, false, 'deleteProjectAction must reject unauthenticated call');
    assert.ok(
      Boolean(unauthDelete.error?.includes('Unauthorized') || unauthDelete.error?.includes('Authentication failed')),
      'deleteProjectAction must return authentication error'
    );

    const unauthReorder = await reorderProjectsAction(['project_1', 'project_2']);
    assert.strictEqual(unauthReorder.success, false, 'reorderProjectsAction must reject unauthenticated call');
    assert.ok(
      Boolean(unauthReorder.error?.includes('Unauthorized') || unauthReorder.error?.includes('Authentication failed')),
      'reorderProjectsAction must return authentication error'
    );
    pass('2.4: All 4 Server Actions strictly reject unauthenticated runtime invocations');
  }

  // =========================================================================
  // PILLAR 3: View-Model Mapping & Landing Page Rendering
  // =========================================================================
  console.log('\n[Pillar 3: View-Model Mapping & ProjectsSection Rendering]');
  {
    // 3.1 Domain Entity to View Model Mapping with authentic thumbnailUrl
    const projectWithThumb: Project = {
      id: 'project_01',
      title: 'Water Reminder & Hydration Tracker',
      category: 'Mobile Application',
      description: 'A cross-platform mobile application to track hydration and daily intake goals.',
      technologies: ['Flutter', 'Dart', 'BLoC', 'SQLite'],
      thumbnailUrl: '/uploads/projects/water-reminder-thumb.png',
      projectUrl: 'https://example.com/water',
      githubUrl: 'https://github.com/agunfirmansyah/water-reminder',
      published: true,
      publishedAt: new Date('2023-01-01'),
      order: 1,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-02'),
    };

    const vmWithThumb: ProjectViewModel = PortfolioViewMapper.toProjectViewModel(projectWithThumb);
    assert.strictEqual(vmWithThumb.id, 'project_01');
    assert.strictEqual(vmWithThumb.title, projectWithThumb.title);
    assert.strictEqual(vmWithThumb.category, projectWithThumb.category);
    assert.strictEqual(vmWithThumb.thumbnailUrl, '/uploads/projects/water-reminder-thumb.png');
    assert.strictEqual(vmWithThumb.desktopCategory, '// MOBILE APPLICATION');
    assert.ok(vmWithThumb.tabletTag.includes('FLUTTER'));
    assert.ok(vmWithThumb.tags.length > 0);
    pass('3.1: PortfolioViewMapper maps authentic thumbnailUrl to ProjectViewModel');

    // 3.2 View Model Mapping when thumbnailUrl is null or undefined
    const projectWithoutThumb: Project = {
      id: 'project_02',
      title: 'Porto CMS Headless Core',
      category: 'Backend Systems',
      description: 'Headless CMS core with Next.js 16 and Prisma ORM.',
      technologies: ['Next.js', 'TypeScript', 'Prisma'],
      thumbnailUrl: null,
      projectUrl: null,
      githubUrl: null,
      published: true,
      publishedAt: new Date('2023-02-01'),
      order: 2,
      createdAt: new Date('2023-02-01'),
      updatedAt: new Date('2023-02-02'),
    };

    const vmWithoutThumb = PortfolioViewMapper.toProjectViewModel(projectWithoutThumb);
    assert.strictEqual(vmWithoutThumb.thumbnailUrl, null, 'Null thumbnailUrl must map to null');

    const projectWithUndefinedThumb = {
      ...projectWithoutThumb,
      thumbnailUrl: undefined,
    } as unknown as Project;
    const vmWithUndefinedThumb = PortfolioViewMapper.toProjectViewModel(projectWithUndefinedThumb);
    assert.strictEqual(vmWithUndefinedThumb.thumbnailUrl, null, 'Undefined thumbnailUrl must map to null');
    pass('3.2: PortfolioViewMapper maps null and undefined thumbnailUrl to null');

    // 3.3 ProjectsSection Component Audit for Authentic Thumbnail Rendering
    const projectsSectionPath = path.join(
      process.cwd(),
      'src',
      'presentation',
      'components',
      'portfolio',
      'ProjectsSection.tsx'
    );
    assert.strictEqual(fs.existsSync(projectsSectionPath), true, 'ProjectsSection.tsx must exist');

    const projectsSectionCode = fs.readFileSync(projectsSectionPath, 'utf-8');

    // Check for project.thumbnailUrl condition
    assert.ok(
      projectsSectionCode.includes('project.thumbnailUrl ?'),
      'ProjectsSection must conditionally render based on project.thumbnailUrl'
    );

    // Check for img element with object-cover and accessible alt text
    assert.ok(
      projectsSectionCode.includes('<img') || projectsSectionCode.includes('<Image'),
      'ProjectsSection must render image element'
    );
    assert.ok(
      projectsSectionCode.includes('alt={project.title}'),
      'ProjectsSection image must include alt={project.title} for accessibility'
    );
    assert.ok(
      projectsSectionCode.includes('object-cover'),
      'ProjectsSection image must include object-cover class'
    );
    pass('3.3: ProjectsSection verified for responsive image rendering, alt text, and object-cover');
  }

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n================================================================');
  console.log(`   ALL ${passedChecks} OF ${totalChecks} VERIFICATION CHECKS PASSED (100%)       `);
  console.log('   Project thumbnail upload, storage, server actions & view models');
  console.log('   are fully verified, authenticated, and hardened.              ');
  console.log('================================================================\n');
}

runTestSuite().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
