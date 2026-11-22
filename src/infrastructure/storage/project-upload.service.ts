// src/infrastructure/storage/project-upload.service.ts
// Local file upload service for Project thumbnail images.
// Enforces strict MIME whitelist, size boundaries, collision-resistant UUIDs, and safe disk persistence.

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import type { UploadResult, UploadFileInput } from './upload.service';
import {
  getSupabaseStorageClient,
  uploadToSupabaseStorage,
  deleteFromSupabaseStorage,
  isSupabaseStorageUrl,
} from './supabase-storage.service';

export const MAX_PROJECT_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_FILE_SIZE = MAX_PROJECT_FILE_SIZE;
export const MAX_PROJECT_IMAGE_SIZE = MAX_PROJECT_FILE_SIZE;

export const PROJECT_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'projects');
export const PROJECT_IMAGE_UPLOAD_DIR = PROJECT_UPLOAD_DIR;

export const PROJECT_URL_PREFIX = '/uploads/projects';
export const PROJECT_IMAGE_URL_PREFIX = PROJECT_URL_PREFIX;

export const ALLOWED_PROJECT_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
] as const;

export type AllowedProjectMimeType = (typeof ALLOWED_PROJECT_MIME_TYPES)[number];
export const ALLOWED_IMAGE_MIME_TYPES = ALLOWED_PROJECT_MIME_TYPES;
export const ALLOWED_PROJECT_IMAGE_MIME_TYPES = ALLOWED_PROJECT_MIME_TYPES;

export const ALLOWED_PROJECT_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
  '.svg',
] as const;

export type AllowedProjectExtension = (typeof ALLOWED_PROJECT_EXTENSIONS)[number];
export const ALLOWED_IMAGE_EXTENSIONS = ALLOWED_PROJECT_EXTENSIONS;
export const ALLOWED_PROJECT_IMAGE_EXTENSIONS = ALLOWED_PROJECT_EXTENSIONS;

export function isAllowedProjectExtension(filenameOrExt: string): boolean {
  if (!filenameOrExt || typeof filenameOrExt !== 'string') return false;
  const raw = filenameOrExt.trim();
  const ext = raw.startsWith('.') ? raw.toLowerCase() : path.extname(raw).toLowerCase();
  return (ALLOWED_PROJECT_EXTENSIONS as readonly string[]).includes(ext);
}

export const isAllowedImageExtension = isAllowedProjectExtension;

const MIME_TO_EXTENSION: Record<AllowedProjectMimeType, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
};

/**
 * Detects project image MIME type from raw buffer magic bytes.
 */
export function detectProjectMimeType(buffer: Buffer | Uint8Array): AllowedProjectMimeType | null {
  if (!buffer || buffer.length < 4) return null;

  // PNG: \x89PNG (0x89 0x50 0x4E 0x47)
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'image/png';
  }

  // JPEG: 0xFF 0xD8 0xFF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // GIF: GIF87a or GIF89a (0x47 0x49 0x46 0x38 0x37/0x39 0x61)
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61
  ) {
    return 'image/gif';
  }

  // WEBP: RIFF....WEBP (0x52 0x49 0x46 0x46 .... 0x57 0x45 0x42 0x50)
  if (buffer.length >= 12) {
    const isRiff =
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
    const isWebp =
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
    if (isRiff && isWebp) {
      return 'image/webp';
    }
  }

  // SVG: text XML with <svg root element (allowing optional BOM, XML declaration, comments, DOCTYPE)
  let svgBuffer = buffer;
  if (buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    svgBuffer = buffer.subarray(3);
  }
  const sample = Buffer.from(svgBuffer.subarray(0, 1024)).toString('utf8').trim().toLowerCase();

  // Reject if it's an HTML document
  if (sample.includes('<!doctype html') || sample.startsWith('<html') || sample.includes('<body')) {
    return null;
  }

  if (
    sample.startsWith('<svg') ||
    sample.startsWith('<?xml') ||
    sample.startsWith('<!--') ||
    sample.startsWith('<!doctype svg')
  ) {
    if (sample.includes('<svg')) {
      return 'image/svg+xml';
    }
  }

  return null;
}

export const detectImageMimeType = detectProjectMimeType;

/**
 * Verifies that the buffer contains authentic magic bytes matching the claimed MIME type.
 */
export function verifyProjectMagicBytes(buffer: Buffer | Uint8Array, mimeType: string): boolean {
  if (!buffer || buffer.length < 4 || !mimeType) return false;

  const normalizedMime = mimeType.toLowerCase();

  if (normalizedMime === 'image/png') {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  }

  if (normalizedMime === 'image/jpeg' || normalizedMime === 'image/jpg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (normalizedMime === 'image/webp') {
    if (buffer.length < 12) return false;
    const isRiff =
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
    const isWebp =
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
    return isRiff && isWebp;
  }

  if (normalizedMime === 'image/gif') {
    return (
      buffer[0] === 0x47 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x38 &&
      (buffer[4] === 0x37 || buffer[4] === 0x39) &&
      buffer[5] === 0x61
    );
  }

  if (normalizedMime === 'image/svg+xml' || normalizedMime === 'image/svg') {
    let svgBuffer = buffer;
    if (buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
      svgBuffer = buffer.subarray(3);
    }
    const sample = Buffer.from(svgBuffer.subarray(0, 1024)).toString('utf8').trim().toLowerCase();

    // Reject HTML
    if (sample.includes('<!doctype html') || sample.startsWith('<html') || sample.includes('<body')) {
      return false;
    }

    if (
      sample.startsWith('<svg') ||
      sample.startsWith('<?xml') ||
      sample.startsWith('<!--') ||
      sample.startsWith('<!doctype svg')
    ) {
      return sample.includes('<svg');
    }
    return false;
  }

  return false;
}

export const verifyMagicBytes = verifyProjectMagicBytes;

export interface ProjectFileValidationResult {
  readonly valid: boolean;
  readonly error?: string;
  readonly detectedMime?: AllowedProjectMimeType;
}

/**
 * Validates metadata and buffer constraints for a project thumbnail file.
 */
export function validateProjectFile(
  file: { size: number; type: string; name?: string; originalFilename?: string },
  buffer?: Buffer | Uint8Array
): ProjectFileValidationResult {
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

  const rawType = (file.type || '').toLowerCase();
  const normalizedMime: AllowedProjectMimeType | undefined =
    rawType === 'image/jpg'
      ? 'image/jpeg'
      : rawType === 'image/svg'
      ? 'image/svg+xml'
      : (ALLOWED_PROJECT_MIME_TYPES as readonly string[]).includes(rawType)
      ? (rawType as AllowedProjectMimeType)
      : undefined;

  if (!normalizedMime) {
    return {
      valid: false,
      error: `Unsupported file type "${file.type}". Allowed types: PNG, JPEG, WEBP, GIF, SVG.`,
    };
  }

  if (buffer && !verifyProjectMagicBytes(buffer, normalizedMime)) {
    return {
      valid: false,
      error: `File signature does not match claimed MIME type "${file.type}".`,
    };
  }

  return { valid: true, detectedMime: normalizedMime };
}

export const validateProjectImageFile = validateProjectFile;

/**
 * Service to store uploaded project thumbnail images safely on the local filesystem.
 */
export class ProjectUploadService {
  /**
   * Uploads and stores a project thumbnail file (Web API File or Buffer wrapper).
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

      const ext = MIME_TO_EXTENSION[validation.detectedMime] || '.png';
      const uniqueId = crypto.randomUUID();
      const filename = `${uniqueId}${ext}`;

      // 1. Supabase Storage: Use when configured or running in Vercel serverless environment
      const supabase = getSupabaseStorageClient();
      const isVercel = process.env.VERCEL === '1';

      if (supabase || isVercel) {
        if (!supabase) {
          return {
            success: false,
            error:
              'Supabase Storage credentials (SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY) are missing in Vercel environment variables.',
          };
        }

        const storageRes = await uploadToSupabaseStorage(
          'projects',
          filename,
          buffer,
          validation.detectedMime
        );

        if (!storageRes.success || !storageRes.publicUrl) {
          return {
            success: false,
            error: storageRes.error || 'Failed to upload project thumbnail to Supabase Storage',
          };
        }

        return {
          success: true,
          fileUrl: storageRes.publicUrl,
          filename,
          size,
          mimeType: validation.detectedMime,
        };
      }

      // 2. Local filesystem fallback (offline testing & local environments)
      await fs.promises.mkdir(targetDirectory, { recursive: true });
      const fullPath = path.join(targetDirectory, filename);
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

      // 1. Supabase Storage cleanup
      if (isSupabaseStorageUrl(fileUrl)) {
        return await deleteFromSupabaseStorage(fileUrl);
      }

      if (!fileUrl.startsWith(PROJECT_URL_PREFIX)) {
        return false;
      }

      // Check for null bytes or invalid characters
      if (fileUrl.includes('\0')) {
        return false;
      }

      const filename = path.basename(fileUrl);
      const fullPath = path.join(targetDirectory, filename);

      // Guard against path traversal
      const normalizedTarget = path.resolve(targetDirectory);
      const normalizedPath = path.resolve(fullPath);
      if (
        normalizedPath !== normalizedTarget &&
        !normalizedPath.startsWith(normalizedTarget + path.sep)
      ) {
        return false;
      }

      // Disallow deleting the directory itself
      if (normalizedPath === normalizedTarget) {
        return false;
      }

      if (fs.existsSync(normalizedPath)) {
        await fs.promises.unlink(normalizedPath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // Instance method delegates
  async upload(
    input: File | UploadFileInput,
    targetDirectory: string = PROJECT_UPLOAD_DIR
  ): Promise<UploadResult> {
    return ProjectUploadService.upload(input, targetDirectory);
  }

  async deleteByUrl(
    fileUrl: string,
    targetDirectory: string = PROJECT_UPLOAD_DIR
  ): Promise<boolean> {
    return ProjectUploadService.deleteByUrl(fileUrl, targetDirectory);
  }
}

export const uploadProjectFile = ProjectUploadService.upload;
export const deleteProjectFile = ProjectUploadService.deleteByUrl;
export const uploadProjectImage = ProjectUploadService.upload;
export const deleteProjectImage = ProjectUploadService.deleteByUrl;
export const uploadProjectThumbnail = ProjectUploadService.upload;
export const deleteProjectThumbnail = ProjectUploadService.deleteByUrl;
