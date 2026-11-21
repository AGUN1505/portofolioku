// src/infrastructure/storage/upload.service.ts
// Local file upload service for Certificate documents and images.
// Enforces strict MIME whitelist, size boundaries, collision-resistant UUIDs, and safe disk persistence.

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

export const ALLOWED_CERTIFICATE_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
] as const;

export type AllowedCertificateMimeType = (typeof ALLOWED_CERTIFICATE_MIME_TYPES)[number];

export const ALLOWED_CERTIFICATE_EXTENSIONS = [
  '.pdf',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
] as const;

export type AllowedCertificateExtension = (typeof ALLOWED_CERTIFICATE_EXTENSIONS)[number];

export function isAllowedCertificateExtension(filenameOrExt: string): boolean {
  if (!filenameOrExt || typeof filenameOrExt !== 'string') return false;
  const ext = filenameOrExt.startsWith('.')
    ? filenameOrExt.toLowerCase()
    : path.extname(filenameOrExt).toLowerCase();
  return (ALLOWED_CERTIFICATE_EXTENSIONS as readonly string[]).includes(ext);
}

export const MAX_CERTIFICATE_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const CERTIFICATE_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'certificates');
export const CERTIFICATE_URL_PREFIX = '/uploads/certificates';

// Project Thumbnail Upload Constraints & Whitelists
export const ALLOWED_PROJECT_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
] as const;

export type AllowedProjectMimeType = (typeof ALLOWED_PROJECT_MIME_TYPES)[number];

export const ALLOWED_PROJECT_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
  '.svg',
] as const;

export type AllowedProjectExtension = (typeof ALLOWED_PROJECT_EXTENSIONS)[number];

export const MAX_PROJECT_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const PROJECT_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'projects');
export const PROJECT_URL_PREFIX = '/uploads/projects';

export function isAllowedProjectExtension(filenameOrExt: string): boolean {
  if (!filenameOrExt || typeof filenameOrExt !== 'string') return false;
  const ext = filenameOrExt.startsWith('.')
    ? filenameOrExt.toLowerCase()
    : path.extname(filenameOrExt).toLowerCase();
  return (ALLOWED_PROJECT_EXTENSIONS as readonly string[]).includes(ext);
}

const MIME_TO_EXTENSION: Record<AllowedCertificateMimeType, string> = {
  'application/pdf': '.pdf',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
};

const PROJECT_MIME_TO_EXTENSION: Record<AllowedProjectMimeType, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
};

export interface FileValidationResult {
  readonly valid: boolean;
  readonly error?: string;
  readonly detectedMime?: AllowedCertificateMimeType;
}

export interface UploadResult {
  readonly success: boolean;
  readonly fileUrl?: string;
  readonly filename?: string;
  readonly size?: number;
  readonly mimeType?: string;
  readonly error?: string;
}

export interface UploadFileInput {
  readonly buffer: Buffer | Uint8Array;
  readonly mimeType: string;
  readonly originalFilename?: string;
  readonly size?: number;
}

/**
 * Inspects buffer header for authentic magic bytes to prevent spoofed Content-Type attacks.
 */
export function verifyMagicBytes(buffer: Buffer | Uint8Array, mimeType: string): boolean {
  if (buffer.length < 4) return false;

  // PDF: %PDF- (0x25 0x50 0x44 0x46)
  if (mimeType === 'application/pdf') {
    return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
  }

  // PNG: \x89PNG (0x89 0x50 0x4E 0x47)
  if (mimeType === 'image/png') {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  }

  // JPEG: 0xFF 0xD8 0xFF
  if (mimeType === 'image/jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  // WEBP: RIFF....WEBP (0x52 0x49 0x46 0x46 .... 0x57 0x45 0x42 0x50)
  if (mimeType === 'image/webp') {
    if (buffer.length < 12) return false;
    const isRiff =
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
    const isWebp =
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
    return isRiff && isWebp;
  }

  // GIF: GIF87a or GIF89a (0x47 0x49 0x46 0x38)
  if (mimeType === 'image/gif') {
    return (
      buffer[0] === 0x47 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x38
    );
  }

  // SVG: text/XML starting with <svg, <?xml, or <!--
  if (mimeType === 'image/svg+xml') {
    const text = Buffer.from(buffer.subarray(0, 512)).toString('utf8').trim().toLowerCase();
    return text.startsWith('<svg') || text.startsWith('<?xml') || text.startsWith('<!--');
  }

  return false;
}

/**
 * Validates metadata and buffer constraints for a certificate file.
 */
export function validateCertificateFile(
  file: { size: number; type: string; name?: string; originalFilename?: string },
  buffer?: Buffer | Uint8Array
): FileValidationResult {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  const effectiveSize = buffer ? buffer.length : file.size;

  if (effectiveSize <= 0) {
    return { valid: false, error: 'File is empty' };
  }

  if (effectiveSize > MAX_CERTIFICATE_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds the maximum limit of 5MB (${(effectiveSize / (1024 * 1024)).toFixed(2)}MB provided)`,
    };
  }

  const filename = file.name || file.originalFilename;
  if (filename && typeof filename === 'string') {
    const ext = path.extname(filename).toLowerCase();
    if (!ext || !isAllowedCertificateExtension(ext)) {
      return {
        valid: false,
        error: `Disallowed file extension "${ext || 'none'}". Allowed extensions: .pdf, .png, .jpg, .jpeg, .webp.`,
      };
    }
  }

  const mime = file.type.toLowerCase() as AllowedCertificateMimeType;
  if (!ALLOWED_CERTIFICATE_MIME_TYPES.includes(mime)) {
    return {
      valid: false,
      error: `Unsupported file type "${file.type}". Allowed types: PDF, PNG, JPEG, WEBP.`,
    };
  }

  if (buffer && !verifyMagicBytes(buffer, mime)) {
    return {
      valid: false,
      error: `File signature does not match claimed MIME type "${mime}".`,
    };
  }

  return { valid: true, detectedMime: mime };
}

/**
 * Service to store uploaded certificate files safely on the local filesystem.
 */
export class CertificateUploadService {
  /**
   * Uploads and stores a certificate file (Web API File or Buffer wrapper).
   * Generates a collision-resistant UUID filename and ensures storage directory exists.
   */
  static async upload(
    input: File | UploadFileInput,
    targetDirectory: string = CERTIFICATE_UPLOAD_DIR
  ): Promise<UploadResult> {
    try {
      let buffer: Buffer;
      let mimeType: string;
      let size: number;
      let originalFilename: string | undefined = undefined;

      if (typeof (input as File).arrayBuffer === 'function') {
        const file = input as File;
        const arrayBuf = await file.arrayBuffer();
        buffer = Buffer.from(arrayBuf);
        mimeType = file.type;
        size = file.size;
        originalFilename = file.name;
      } else {
        const fileInput = input as UploadFileInput;
        buffer = Buffer.isBuffer(fileInput.buffer)
          ? fileInput.buffer
          : Buffer.from(fileInput.buffer);
        mimeType = fileInput.mimeType;
        size = buffer.length;
        originalFilename = fileInput.originalFilename;
      }

      const validation = validateCertificateFile(
        { size, type: mimeType, name: originalFilename, originalFilename },
        buffer
      );
      if (!validation.valid || !validation.detectedMime) {
        return {
          success: false,
          error: validation.error || 'Invalid file',
        };
      }

      const ext = MIME_TO_EXTENSION[validation.detectedMime];
      const uniqueId = crypto.randomUUID();
      const filename = `${uniqueId}${ext}`;

      await fs.promises.mkdir(targetDirectory, { recursive: true });
      const fullPath = path.join(/*turbopackIgnore: true*/ targetDirectory, filename);
      await fs.promises.writeFile(fullPath, buffer);

      const fileUrl = `${CERTIFICATE_URL_PREFIX}/${filename}`;

      return {
        success: true,
        fileUrl,
        filename,
        size,
        mimeType: validation.detectedMime,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to save uploaded certificate file',
      };
    }
  }

  /**
   * Deletes an uploaded file by its public relative URL path if it exists within the certificate directory.
   */
  static async deleteByUrl(
    fileUrl: string,
    targetDirectory: string = CERTIFICATE_UPLOAD_DIR
  ): Promise<boolean> {
    try {
      if (!fileUrl.startsWith(CERTIFICATE_URL_PREFIX)) {
        return false;
      }
      const filename = path.basename(fileUrl);
      const fullPath = path.join(/*turbopackIgnore: true*/ targetDirectory, filename);

      // Guard against path traversal
      const normalizedTarget = path.resolve(/*turbopackIgnore: true*/ targetDirectory);
      const normalizedPath = path.resolve(/*turbopackIgnore: true*/ fullPath);
      if (
        normalizedPath !== normalizedTarget &&
        !normalizedPath.startsWith(normalizedTarget + path.sep)
      ) {
        return false;
      }

      if (fs.existsSync(/*turbopackIgnore: true*/ normalizedPath)) {
        await fs.promises.unlink(normalizedPath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

export const uploadCertificateFile = CertificateUploadService.upload;
export const deleteCertificateFile = CertificateUploadService.deleteByUrl;

/**
 * Validates metadata and buffer constraints for a project thumbnail file.
 */
export function validateProjectFile(
  file: { size: number; type: string; name?: string; originalFilename?: string },
  buffer?: Buffer | Uint8Array
): { readonly valid: boolean; readonly error?: string; readonly detectedMime?: AllowedProjectMimeType } {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  const effectiveSize = buffer ? buffer.length : file.size;

  if (effectiveSize <= 0) {
    return { valid: false, error: 'File is empty' };
  }

  if (effectiveSize > MAX_PROJECT_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds the maximum limit of 5MB (${(effectiveSize / (1024 * 1024)).toFixed(2)}MB provided)`,
    };
  }

  const filename = file.name || file.originalFilename;
  if (filename && typeof filename === 'string') {
    const ext = path.extname(filename).toLowerCase();
    if (!ext || !isAllowedProjectExtension(ext)) {
      return {
        valid: false,
        error: `Disallowed file extension "${ext || 'none'}". Allowed extensions: .png, .jpg, .jpeg, .webp, .gif, .svg.`,
      };
    }
  }

  const mime = file.type.toLowerCase() as AllowedProjectMimeType;
  if (!ALLOWED_PROJECT_MIME_TYPES.includes(mime)) {
    return {
      valid: false,
      error: `Unsupported file type "${file.type}". Allowed types: PNG, JPEG, WEBP, GIF, SVG.`,
    };
  }

  if (buffer && !verifyMagicBytes(buffer, mime)) {
    return {
      valid: false,
      error: `File signature does not match claimed MIME type "${mime}".`,
    };
  }

  return { valid: true, detectedMime: mime };
}

/**
 * Service to store uploaded project thumbnail images safely on the local filesystem.
 */
export class ProjectUploadService {
  /**
   * Uploads and stores a project thumbnail file (Web API File or Buffer wrapper).
   * Generates a collision-resistant UUID filename and ensures storage directory exists.
   */
  static async upload(
    input: File | UploadFileInput,
    targetDirectory: string = PROJECT_UPLOAD_DIR
  ): Promise<UploadResult> {
    try {
      let buffer: Buffer;
      let mimeType: string;
      let size: number;
      let originalFilename: string | undefined = undefined;

      if (typeof (input as File).arrayBuffer === 'function') {
        const file = input as File;
        const arrayBuf = await file.arrayBuffer();
        buffer = Buffer.from(arrayBuf);
        mimeType = file.type;
        size = file.size;
        originalFilename = file.name;
      } else {
        const fileInput = input as UploadFileInput;
        buffer = Buffer.isBuffer(fileInput.buffer)
          ? fileInput.buffer
          : Buffer.from(fileInput.buffer);
        mimeType = fileInput.mimeType;
        size = buffer.length;
        originalFilename = fileInput.originalFilename;
      }

      const validation = validateProjectFile(
        { size, type: mimeType, name: originalFilename, originalFilename },
        buffer
      );
      if (!validation.valid || !validation.detectedMime) {
        return {
          success: false,
          error: validation.error || 'Invalid file',
        };
      }

      const ext =
        PROJECT_MIME_TO_EXTENSION[validation.detectedMime] ||
        (originalFilename ? path.extname(originalFilename).toLowerCase() : '.png');
      const uniqueId = crypto.randomUUID();
      const filename = `${uniqueId}${ext}`;

      await fs.promises.mkdir(targetDirectory, { recursive: true });
      const fullPath = path.join(/*turbopackIgnore: true*/ targetDirectory, filename);
      await fs.promises.writeFile(fullPath, buffer);

      const fileUrl = `${PROJECT_URL_PREFIX}/${filename}`;

      return {
        success: true,
        fileUrl,
        filename,
        size,
        mimeType: validation.detectedMime,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to save uploaded project thumbnail',
      };
    }
  }

  /**
   * Deletes an uploaded file by its public relative URL path if it exists within the projects directory.
   */
  static async deleteByUrl(
    fileUrl: string,
    targetDirectory: string = PROJECT_UPLOAD_DIR
  ): Promise<boolean> {
    try {
      if (!fileUrl || typeof fileUrl !== 'string') {
        return false;
      }
      if (!fileUrl.startsWith(PROJECT_URL_PREFIX)) {
        return false;
      }
      const filename = path.basename(fileUrl);
      const fullPath = path.join(/*turbopackIgnore: true*/ targetDirectory, filename);

      // Guard against path traversal
      const normalizedTarget = path.resolve(/*turbopackIgnore: true*/ targetDirectory);
      const normalizedPath = path.resolve(/*turbopackIgnore: true*/ fullPath);
      if (
        normalizedPath !== normalizedTarget &&
        !normalizedPath.startsWith(normalizedTarget + path.sep)
      ) {
        return false;
      }

      if (fs.existsSync(/*turbopackIgnore: true*/ normalizedPath)) {
        await fs.promises.unlink(normalizedPath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

export const uploadProjectThumbnail = ProjectUploadService.upload;
export const deleteProjectThumbnail = ProjectUploadService.deleteByUrl;
