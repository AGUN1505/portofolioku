// scripts/test-project-upload-service.ts
// Comprehensive unit test for ProjectUploadService.
// Strictly runs zero-DB in-memory tests.

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
  ALLOWED_PROJECT_IMAGE_MIME_TYPES,
  ALLOWED_PROJECT_EXTENSIONS,
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_PROJECT_IMAGE_EXTENSIONS,
  MAX_PROJECT_FILE_SIZE,
  MAX_FILE_SIZE,
  MAX_PROJECT_IMAGE_SIZE,
  PROJECT_UPLOAD_DIR,
  PROJECT_IMAGE_UPLOAD_DIR,
  PROJECT_URL_PREFIX,
  PROJECT_IMAGE_URL_PREFIX,
  type AllowedProjectMimeType,
  type AllowedProjectExtension,
} from '../src/infrastructure/storage/project-upload.service';

async function runTestSuite(): Promise<void> {
  console.log('================================================================');
  console.log('   PROJECT UPLOAD SERVICE SECURITY & VERIFICATION TEST SUITE    ');
  console.log('================================================================\n');

  let totalChecks = 0;
  let passedChecks = 0;

  function pass(msg: string) {
    totalChecks++;
    passedChecks++;
    console.log(`  ✓ ${msg}`);
  }

  // ---------------------------------------------------------------------------
  // 1. Constants & Whitelists
  // ---------------------------------------------------------------------------
  console.log('[1. Constants, Whitelists & Helper Aliases]');
  {
    assert.strictEqual(MAX_PROJECT_FILE_SIZE, 5 * 1024 * 1024);
    assert.strictEqual(MAX_FILE_SIZE, MAX_PROJECT_FILE_SIZE);
    assert.strictEqual(MAX_PROJECT_IMAGE_SIZE, MAX_PROJECT_FILE_SIZE);

    assert.strictEqual(PROJECT_URL_PREFIX, '/uploads/projects');
    assert.strictEqual(PROJECT_IMAGE_URL_PREFIX, '/uploads/projects');

    assert.ok(PROJECT_UPLOAD_DIR.endsWith(path.join('public', 'uploads', 'projects')));
    assert.strictEqual(PROJECT_IMAGE_UPLOAD_DIR, PROJECT_UPLOAD_DIR);

    const expectedMimes: readonly AllowedProjectMimeType[] = [
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/gif',
      'image/svg+xml',
    ];
    for (const mime of expectedMimes) {
      assert.ok(ALLOWED_PROJECT_MIME_TYPES.includes(mime), `Missing MIME ${mime}`);
    }
    assert.strictEqual(ALLOWED_IMAGE_MIME_TYPES, ALLOWED_PROJECT_MIME_TYPES);
    assert.strictEqual(ALLOWED_PROJECT_IMAGE_MIME_TYPES, ALLOWED_PROJECT_MIME_TYPES);

    const expectedExts: readonly AllowedProjectExtension[] = [
      '.png',
      '.jpg',
      '.jpeg',
      '.webp',
      '.gif',
      '.svg',
    ];
    for (const ext of expectedExts) {
      assert.ok(ALLOWED_PROJECT_EXTENSIONS.includes(ext), `Missing Extension ${ext}`);
      assert.strictEqual(isAllowedProjectExtension(ext), true);
      assert.strictEqual(isAllowedImageExtension(`test-file${ext}`), true);
      assert.strictEqual(isAllowedProjectExtension(ext.toUpperCase()), true);
    }
    assert.strictEqual(ALLOWED_IMAGE_EXTENSIONS, ALLOWED_PROJECT_EXTENSIONS);
    assert.strictEqual(ALLOWED_PROJECT_IMAGE_EXTENSIONS, ALLOWED_PROJECT_EXTENSIONS);

    // Rejection of dangerous or non-image extensions
    const dangerousExts = ['.pdf', '.exe', '.sh', '.php', '.phtml', '.html', '.htm', '.js', '.ts', '.jar', '.bat'];
    for (const ext of dangerousExts) {
      assert.strictEqual(isAllowedProjectExtension(ext), false, `Extension ${ext} should be disallowed`);
      assert.strictEqual(isAllowedImageExtension(`malicious${ext}`), false);
    }
    pass('1.1: Constants and extension whitelists strictly verified');
  }

  // ---------------------------------------------------------------------------
  // 2. Magic Byte Verification
  // ---------------------------------------------------------------------------
  console.log('\n[2. Magic Byte Verification for PNG, JPEG, WEBP, GIF, SVG]');
  {
    // Valid PNG
    const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    assert.strictEqual(verifyMagicBytes(validPng, 'image/png'), true);
    assert.strictEqual(verifyProjectMagicBytes(validPng, 'image/png'), true);
    assert.strictEqual(detectProjectMimeType(validPng), 'image/png');
    assert.strictEqual(detectImageMimeType(validPng), 'image/png');
    pass('2.1: PNG magic bytes verified (0x89 0x50 0x4E 0x47)');

    // Valid JPEG
    const validJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
    assert.strictEqual(verifyMagicBytes(validJpeg, 'image/jpeg'), true);
    assert.strictEqual(verifyMagicBytes(validJpeg, 'image/jpg'), true);
    assert.strictEqual(detectProjectMimeType(validJpeg), 'image/jpeg');
    pass('2.2: JPEG magic bytes verified (0xFF 0xD8 0xFF)');

    // Valid WEBP
    const validWebp = Buffer.from([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x24, 0x00, 0x00, 0x00, // size
      0x57, 0x45, 0x42, 0x50, // WEBP
    ]);
    assert.strictEqual(verifyMagicBytes(validWebp, 'image/webp'), true);
    assert.strictEqual(detectProjectMimeType(validWebp), 'image/webp');
    pass('2.3: WEBP magic bytes verified (RIFF....WEBP)');

    // Valid GIF (GIF87a and GIF89a)
    const validGif87a = Buffer.from('GIF87a\x01\x00\x01\x00');
    const validGif89a = Buffer.from('GIF89a\x01\x00\x01\x00');
    assert.strictEqual(verifyMagicBytes(validGif87a, 'image/gif'), true);
    assert.strictEqual(verifyMagicBytes(validGif89a, 'image/gif'), true);
    assert.strictEqual(detectProjectMimeType(validGif89a), 'image/gif');
    pass('2.4: GIF magic bytes verified (GIF87a / GIF89a)');

    // Valid SVG: standard, xml-prefixed, comment-prefixed, doctype-prefixed, BOM
    const svg1 = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>');
    const svg2 = Buffer.from('<?xml version="1.0" encoding="utf-8"?>\n<svg width="24" height="24"></svg>');
    const svg3 = Buffer.from('<!-- comment -->\n<svg viewBox="0 0 10 10"></svg>');
    const svg4 = Buffer.from('<?xml version="1.0"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<svg></svg>');
    const svg5 = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from('<svg width="10" height="10"></svg>')]); // UTF-8 BOM

    assert.strictEqual(verifyMagicBytes(svg1, 'image/svg+xml'), true);
    assert.strictEqual(verifyMagicBytes(svg1, 'image/svg'), true);
    assert.strictEqual(verifyMagicBytes(svg2, 'image/svg+xml'), true);
    assert.strictEqual(verifyMagicBytes(svg3, 'image/svg+xml'), true);
    assert.strictEqual(verifyMagicBytes(svg4, 'image/svg+xml'), true);
    assert.strictEqual(verifyMagicBytes(svg5, 'image/svg+xml'), true);
    assert.strictEqual(detectProjectMimeType(svg1), 'image/svg+xml');
    pass('2.5: SVG headers verified across standard, XML, comment, DOCTYPE, and BOM variations');

    // Spoofed payloads
    const spoofedHtmlAsSvg = Buffer.from('<!DOCTYPE html><html><body><svg></svg></body></html>');
    const spoofedHtml2AsSvg = Buffer.from('<html><head></head><body>hello</body></html>');
    const spoofedPhpAsJpeg = Buffer.from('<?php echo "shell"; ?>');
    const spoofedPdfAsPng = Buffer.from('%PDF-1.4 file payload');
    const spoofedExeAsWebp = Buffer.from('MZ\x90\x00\x03\x00PE executable');
    const randomBuffer = Buffer.from('JUST RANDOM PLAIN TEXT');

    assert.strictEqual(verifyMagicBytes(spoofedHtmlAsSvg, 'image/svg+xml'), false);
    assert.strictEqual(verifyMagicBytes(spoofedHtml2AsSvg, 'image/svg+xml'), false);
    assert.strictEqual(verifyMagicBytes(spoofedPhpAsJpeg, 'image/jpeg'), false);
    assert.strictEqual(verifyMagicBytes(spoofedPdfAsPng, 'image/png'), false);
    assert.strictEqual(verifyMagicBytes(spoofedExeAsWebp, 'image/webp'), false);
    assert.strictEqual(verifyMagicBytes(randomBuffer, 'image/gif'), false);
    assert.strictEqual(verifyMagicBytes(Buffer.from(''), 'image/png'), false);
    assert.strictEqual(verifyMagicBytes(Buffer.from([0x89, 0x50]), 'image/png'), false); // too short
    pass('2.6: Magic byte checking rejects all spoofed, HTML, executable, and truncated payloads');
  }

  // ---------------------------------------------------------------------------
  // 3. File Validation
  // ---------------------------------------------------------------------------
  console.log('\n[3. File Validation Boundaries]');
  {
    // Empty file
    const emptyRes = validateProjectFile({ size: 0, type: 'image/png' });
    assert.strictEqual(emptyRes.valid, false);
    assert.ok(emptyRes.error?.includes('empty'));

    // Oversized file (> 5MB)
    const oversizeRes = validateProjectFile({ size: MAX_PROJECT_FILE_SIZE + 1, type: 'image/png' });
    assert.strictEqual(oversizeRes.valid, false);
    assert.ok(oversizeRes.error?.includes('exceeds the maximum limit of 5MB'));

    // Disallowed extension
    const badExtRes = validateProjectFile({
      size: 100,
      type: 'image/png',
      name: 'exploit.php',
    });
    assert.strictEqual(badExtRes.valid, false);
    assert.ok(badExtRes.error?.includes('Disallowed file extension'));

    // Disallowed MIME
    const badMimeRes = validateProjectFile({
      size: 100,
      type: 'application/pdf',
      name: 'document.png',
    });
    assert.strictEqual(badMimeRes.valid, false);
    assert.ok(badMimeRes.error?.includes('Unsupported file type'));

    // Spoofed buffer vs claimed MIME
    const spoofedBuffer = Buffer.from('Not a real PNG');
    const mismatchRes = validateProjectFile(
      { size: 100, type: 'image/png', name: 'image.png' },
      spoofedBuffer
    );
    assert.strictEqual(mismatchRes.valid, false);
    assert.ok(mismatchRes.error?.includes('File signature does not match'));

    // Valid file validation
    const validPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const validRes = validateProjectImageFile(
      { size: validPngBuffer.length, type: 'image/png', name: 'thumbnail.png' },
      validPngBuffer
    );
    assert.strictEqual(validRes.valid, true);
    assert.strictEqual(validRes.detectedMime, 'image/png');
    pass('3.1: File size boundaries, extension whitelist, and MIME verification enforced');
  }

  // ---------------------------------------------------------------------------
  // 4. Upload Service & Collision-Resistant UUIDs
  // ---------------------------------------------------------------------------
  console.log('\n[4. Upload Storage & Collision-Resistant UUIDs]');
  {
    const validPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    const uploadRes = await uploadProjectFile({
      buffer: validPngBuffer,
      mimeType: 'image/png',
      originalFilename: '../../../../etc/shadow.png', // Path traversal attack in filename
    });

    assert.strictEqual(uploadRes.success, true);
    assert.ok(uploadRes.filename !== undefined);
    assert.ok(uploadRes.fileUrl !== undefined);
    assert.strictEqual(uploadRes.mimeType, 'image/png');

    // Verify UUID pattern and that traversal in originalFilename was discarded
    assert.strictEqual(uploadRes.filename.includes('..'), false);
    assert.strictEqual(uploadRes.filename.includes('shadow'), false);
    assert.strictEqual(uploadRes.filename.includes('/'), false);
    assert.strictEqual(uploadRes.filename.includes('\\'), false);
    assert.ok(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.png$/.test(uploadRes.filename),
      `Filename ${uploadRes.filename} must match UUID format`
    );
    assert.ok(uploadRes.fileUrl.startsWith(PROJECT_URL_PREFIX));

    const savedDiskPath = path.join(process.cwd(), 'public', uploadRes.fileUrl);
    assert.strictEqual(fs.existsSync(savedDiskPath), true);
    pass('4.1: Upload generates collision-resistant UUIDs and safely persists to disk');

    // Test GIF upload
    const validGifBuffer = Buffer.from('GIF89a\x01\x00\x01\x00\x80\x00\x00');
    const gifUpload = await uploadProjectImage({
      buffer: validGifBuffer,
      mimeType: 'image/gif',
      originalFilename: 'anim.gif',
    });
    assert.strictEqual(gifUpload.success, true);
    assert.ok(gifUpload.fileUrl?.endsWith('.gif'));
    const gifDiskPath = path.join(process.cwd(), 'public', gifUpload.fileUrl!);
    assert.strictEqual(fs.existsSync(gifDiskPath), true);

    // Test SVG upload
    const validSvgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>');
    const svgUpload = await ProjectUploadService.upload({
      buffer: validSvgBuffer,
      mimeType: 'image/svg+xml',
      originalFilename: 'icon.svg',
    });
    assert.strictEqual(svgUpload.success, true);
    assert.ok(svgUpload.fileUrl?.endsWith('.svg'));
    const svgDiskPath = path.join(process.cwd(), 'public', svgUpload.fileUrl!);
    assert.strictEqual(fs.existsSync(svgDiskPath), true);

    // Test instance methods
    const instanceService = new ProjectUploadService();
    const validJpgBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const jpgUpload = await instanceService.upload({
      buffer: validJpgBuffer,
      mimeType: 'image/jpeg',
      originalFilename: 'photo.jpg',
    });
    assert.strictEqual(jpgUpload.success, true);
    assert.ok(jpgUpload.fileUrl?.endsWith('.jpg'));
    const jpgDiskPath = path.join(process.cwd(), 'public', jpgUpload.fileUrl!);
    assert.strictEqual(fs.existsSync(jpgDiskPath), true);

    // Clean up created files via deleteByUrl
    const delRes1 = await deleteProjectFile(uploadRes.fileUrl);
    const delRes2 = await deleteProjectImage(gifUpload.fileUrl!);
    const delRes3 = await ProjectUploadService.deleteByUrl(svgUpload.fileUrl!);
    const delRes4 = await instanceService.deleteByUrl(jpgUpload.fileUrl!);

    assert.strictEqual(delRes1, true);
    assert.strictEqual(delRes2, true);
    assert.strictEqual(delRes3, true);
    assert.strictEqual(delRes4, true);

    assert.strictEqual(fs.existsSync(savedDiskPath), false);
    assert.strictEqual(fs.existsSync(gifDiskPath), false);
    assert.strictEqual(fs.existsSync(svgDiskPath), false);
    assert.strictEqual(fs.existsSync(jpgDiskPath), false);
    pass('4.2: Uploads and deleteByUrl work seamlessly across all formats and invocation styles');
  }

  // ---------------------------------------------------------------------------
  // 5. Path Traversal Defense in deleteByUrl
  // ---------------------------------------------------------------------------
  console.log('\n[5. Path Traversal (CWE-22) Defense in deleteByUrl]');
  {
    const traversalAttempts = [
      '/uploads/projects/../../package.json',
      '/uploads/projects/..%2f..%2fpackage.json',
      '/uploads/projects/....//....//package.json',
      '/uploads/projects/subfolder/../file.png',
      '/uploads/certificates/some-cert.pdf',
      '../../../package.json',
      'http://attacker.com/uploads/projects/../../package.json',
      '/uploads/projects/\0something.png',
      '',
    ];

    for (const attempt of traversalAttempts) {
      const res = await ProjectUploadService.deleteByUrl(attempt);
      assert.strictEqual(res, false, `deleteByUrl must reject traversal attempt "${attempt}"`);
    }

    // Verify package.json still exists and was not touched
    assert.strictEqual(fs.existsSync(path.join(process.cwd(), 'package.json')), true);

    // Non-existent valid URL returns false
    const nonExistent = await deleteProjectFile('/uploads/projects/00000000-0000-0000-0000-000000000000.png');
    assert.strictEqual(nonExistent, false);

    pass('5.1: Path traversal attacks completely blocked in deleteByUrl');
  }

  console.log('\n================================================================');
  console.log(`   ALL ${passedChecks}/${totalChecks} VERIFICATION CHECKS PASSED SUCCESSFULLY!`);
  console.log('================================================================\n');
}

runTestSuite().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
