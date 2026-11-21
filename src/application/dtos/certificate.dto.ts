// src/application/dtos/certificate.dto.ts
// Pure TypeScript DTOs and Validators for Certificate CMS operations.
// Zero external dependencies.

export interface CreateCertificateInput {
  readonly title?: unknown;
  readonly issuer?: unknown;
  readonly issueDate?: unknown;
  readonly credentialId?: unknown;
  readonly credentialUrl?: unknown;
  readonly fileUrl?: unknown;
  readonly order?: unknown;
}

export interface UpdateCertificateInput {
  readonly title?: unknown;
  readonly issuer?: unknown;
  readonly issueDate?: unknown;
  readonly credentialId?: unknown;
  readonly credentialUrl?: unknown;
  readonly fileUrl?: unknown;
  readonly order?: unknown;
}

export interface ValidatedCreateCertificateDTO {
  readonly title: string;
  readonly issuer: string;
  readonly issueDate: Date | null;
  readonly credentialId: string | null;
  readonly credentialUrl: string | null;
  readonly fileUrl: string;
  readonly order?: number;
}

export interface ValidatedUpdateCertificateDTO {
  readonly title?: string;
  readonly issuer?: string;
  readonly issueDate?: Date | null;
  readonly credentialId?: string | null;
  readonly credentialUrl?: string | null;
  readonly fileUrl?: string;
  readonly order?: number;
}

export type ValidationResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly errors: Record<string, string> };

const ALLOWED_KEYS = new Set([
  'title',
  'issuer',
  'issueDate',
  'credentialId',
  'credentialUrl',
  'fileUrl',
  'order',
]);

const SYSTEM_KEYS = new Set(['id', 'createdAt', 'updatedAt']);

export function parseStrictIsoDate(
  val: unknown,
  fieldName: string
): { date: Date | null; error?: string } {
  if (val === null || val === undefined || val === '') {
    return { date: null };
  }
  if (val instanceof Date) {
    if (isNaN(val.getTime())) {
      return { date: null, error: `${fieldName} is not a valid date` };
    }
    return { date: val };
  }
  if (typeof val !== 'string') {
    return { date: null, error: `${fieldName} must be an ISO date string or Date object` };
  }
  const str = val.trim();
  if (!str) {
    return { date: null };
  }

  const isoDateRegex = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?Z?)?$/;
  const match = isoDateRegex.exec(str);
  if (!match) {
    return { date: null, error: `${fieldName} must be a valid ISO date string (YYYY-MM-DD)` };
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (month < 1 || month > 12) {
    return { date: null, error: `${fieldName} has an invalid month (${month})` };
  }

  const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  const daysInMonths = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const maxDays = daysInMonths[month - 1];

  if (day < 1 || day > maxDays) {
    return { date: null, error: `${fieldName} has an invalid day for month ${month} (${day})` };
  }

  const parsed = new Date(str);
  if (isNaN(parsed.getTime())) {
    return { date: null, error: `${fieldName} is not a valid date` };
  }

  return { date: parsed };
}

export function validateHttpOrHttpsUrl(url: string, fieldName: string): string | null {
  if (url.length > 1000) {
    return `${fieldName} cannot exceed 1000 characters`;
  }
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `${fieldName} must be a valid HTTP or HTTPS URL`;
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return `${fieldName} must use http or https protocol`;
    }
  } catch {
    return `${fieldName} is not a valid URL`;
  }
  return null;
}

export function validateCertificateFileUrl(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return 'File URL is required and must be a valid path or URL';
  }
  const trimmed = url.trim();
  if (trimmed.length < 1 || trimmed.length > 1000) {
    return 'File URL must be between 1 and 1000 characters';
  }
  // Reject protocol-relative URLs
  if (trimmed.startsWith('//')) {
    return 'Protocol-relative URLs starting with "//" are not allowed';
  }
  // Reject dangerous protocols
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:') ||
    lower.startsWith('blob:')
  ) {
    return 'File URL uses an unsupported or unsafe protocol';
  }
  // If root-relative path (e.g. /uploads/certificates/...)
  if (trimmed.startsWith('/')) {
    if (/[\s<>"'\\^`{|}]/.test(trimmed)) {
      return 'File URL path contains invalid characters';
    }
    return null;
  }
  // Otherwise must be a valid HTTP/HTTPS URL
  return validateHttpOrHttpsUrl(trimmed, 'File URL');
}

export function validateCreateCertificate(
  raw: Record<string, unknown>
): ValidationResult<ValidatedCreateCertificateDTO> {
  const errors: Record<string, string> = {};

  for (const key of Object.keys(raw)) {
    if (SYSTEM_KEYS.has(key)) {
      errors[key] = `Field '${key}' is system-controlled and cannot be specified`;
    } else if (!ALLOWED_KEYS.has(key)) {
      errors[key] = `Field '${key}' is not allowed`;
    }
  }

  // title: required string (1-200 chars)
  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  if (!title || title.length < 1 || title.length > 200) {
    errors.title = 'Title is required and must be between 1 and 200 characters';
  }

  // issuer: required string (1-200 chars)
  const issuer = typeof raw.issuer === 'string' ? raw.issuer.trim() : '';
  if (!issuer || issuer.length < 1 || issuer.length > 200) {
    errors.issuer = 'Issuer is required and must be between 1 and 200 characters';
  }

  // fileUrl: required string (1-1000 chars)
  let fileUrl = '';
  if (typeof raw.fileUrl !== 'string') {
    errors.fileUrl = 'File URL is required and must be a valid path or URL';
  } else {
    const trimmed = raw.fileUrl.trim();
    const fileUrlErr = validateCertificateFileUrl(trimmed);
    if (fileUrlErr) {
      errors.fileUrl = fileUrlErr;
    } else {
      fileUrl = trimmed;
    }
  }

  // issueDate: optional date
  let issueDate: Date | null = null;
  if (raw.issueDate !== undefined && raw.issueDate !== null && raw.issueDate !== '') {
    const parsedDate = parseStrictIsoDate(raw.issueDate, 'issueDate');
    if (parsedDate.error) {
      errors.issueDate = parsedDate.error;
    } else {
      issueDate = parsedDate.date;
    }
  }

  // credentialId: optional string
  let credentialId: string | null = null;
  if (raw.credentialId !== undefined && raw.credentialId !== null) {
    if (typeof raw.credentialId !== 'string') {
      errors.credentialId = 'Credential ID must be a string';
    } else {
      const trimmed = raw.credentialId.trim();
      credentialId = trimmed.length > 0 ? trimmed : null;
    }
  }

  // credentialUrl: optional string
  let credentialUrl: string | null = null;
  if (raw.credentialUrl !== undefined && raw.credentialUrl !== null && raw.credentialUrl !== '') {
    if (typeof raw.credentialUrl !== 'string') {
      errors.credentialUrl = 'Credential URL must be a string';
    } else {
      const trimmed = raw.credentialUrl.trim();
      if (trimmed.length > 0) {
        const urlErr = validateHttpOrHttpsUrl(trimmed, 'Credential URL');
        if (urlErr) {
          errors.credentialUrl = urlErr;
        } else {
          credentialUrl = trimmed;
        }
      }
    }
  }

  // order: optional integer
  let order: number | undefined;
  if (raw.order !== undefined && raw.order !== null) {
    if (typeof raw.order !== 'number' || !Number.isInteger(raw.order) || raw.order < 1) {
      errors.order = 'Order must be a positive integer';
    } else {
      order = raw.order;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      title,
      issuer,
      issueDate,
      credentialId,
      credentialUrl,
      fileUrl,
      ...(order !== undefined ? { order } : {}),
    },
  };
}

export function validateUpdateCertificate(
  raw: Record<string, unknown>
): ValidationResult<ValidatedUpdateCertificateDTO> {
  const errors: Record<string, string> = {};

  for (const key of Object.keys(raw)) {
    if (SYSTEM_KEYS.has(key)) {
      errors[key] = `Field '${key}' is system-controlled and cannot be specified`;
    } else if (!ALLOWED_KEYS.has(key)) {
      errors[key] = `Field '${key}' is not allowed`;
    }
  }

  const result: {
    title?: string;
    issuer?: string;
    issueDate?: Date | null;
    credentialId?: string | null;
    credentialUrl?: string | null;
    fileUrl?: string;
    order?: number;
  } = {};

  if (raw.title !== undefined) {
    if (typeof raw.title !== 'string') {
      errors.title = 'Title must be a string';
    } else {
      const title = raw.title.trim();
      if (!title || title.length < 1 || title.length > 200) {
        errors.title = 'Title must be between 1 and 200 characters';
      } else {
        result.title = title;
      }
    }
  }

  if (raw.issuer !== undefined) {
    if (typeof raw.issuer !== 'string') {
      errors.issuer = 'Issuer must be a string';
    } else {
      const issuer = raw.issuer.trim();
      if (!issuer || issuer.length < 1 || issuer.length > 200) {
        errors.issuer = 'Issuer must be between 1 and 200 characters';
      } else {
        result.issuer = issuer;
      }
    }
  }

  if (raw.fileUrl !== undefined) {
    if (typeof raw.fileUrl !== 'string') {
      errors.fileUrl = 'File URL must be a string';
    } else {
      const fileUrl = raw.fileUrl.trim();
      const fileUrlErr = validateCertificateFileUrl(fileUrl);
      if (fileUrlErr) {
        errors.fileUrl = fileUrlErr;
      } else {
        result.fileUrl = fileUrl;
      }
    }
  }

  if (raw.issueDate !== undefined) {
    if (raw.issueDate === null || raw.issueDate === '') {
      result.issueDate = null;
    } else {
      const parsedDate = parseStrictIsoDate(raw.issueDate, 'issueDate');
      if (parsedDate.error) {
        errors.issueDate = parsedDate.error;
      } else {
        result.issueDate = parsedDate.date;
      }
    }
  }

  if (raw.credentialId !== undefined) {
    if (raw.credentialId === null) {
      result.credentialId = null;
    } else if (typeof raw.credentialId !== 'string') {
      errors.credentialId = 'Credential ID must be a string or null';
    } else {
      const trimmed = raw.credentialId.trim();
      result.credentialId = trimmed.length > 0 ? trimmed : null;
    }
  }

  if (raw.credentialUrl !== undefined) {
    if (raw.credentialUrl === null || raw.credentialUrl === '') {
      result.credentialUrl = null;
    } else if (typeof raw.credentialUrl !== 'string') {
      errors.credentialUrl = 'Credential URL must be a string or null';
    } else {
      const trimmed = raw.credentialUrl.trim();
      if (trimmed.length === 0) {
        result.credentialUrl = null;
      } else {
        const urlErr = validateHttpOrHttpsUrl(trimmed, 'Credential URL');
        if (urlErr) {
          errors.credentialUrl = urlErr;
        } else {
          result.credentialUrl = trimmed;
        }
      }
    }
  }

  if (raw.order !== undefined && raw.order !== null) {
    if (typeof raw.order !== 'number' || !Number.isInteger(raw.order) || raw.order < 1) {
      errors.order = 'Order must be a positive integer';
    } else {
      result.order = raw.order;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: result,
  };
}

export const validateCreateCertificateInput = validateCreateCertificate;
export const validateUpdateCertificateInput = validateUpdateCertificate;
