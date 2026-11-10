// src/application/dtos/experience.dto.ts
// Pure TypeScript DTOs and Validators for Experience CMS operations.
// Zero external dependencies.

export interface CreateExperienceInput {
  readonly role?: unknown;
  readonly institution?: unknown;
  readonly track?: unknown;
  readonly description?: unknown;
  readonly startDate?: unknown;
  readonly endDate?: unknown;
  readonly order?: unknown;
}

export interface UpdateExperienceInput {
  readonly role?: unknown;
  readonly institution?: unknown;
  readonly track?: unknown;
  readonly description?: unknown;
  readonly startDate?: unknown;
  readonly endDate?: unknown;
  readonly order?: unknown;
}

export interface ValidatedCreateExperienceDTO {
  readonly role: string;
  readonly institution: string;
  readonly track: string;
  readonly description: string | null;
  readonly startDate: Date | null;
  readonly endDate: Date | null;
  readonly order?: number;
}

export interface ValidatedUpdateExperienceDTO {
  readonly role?: string;
  readonly institution?: string;
  readonly track?: string;
  readonly description?: string | null;
  readonly startDate?: Date | null;
  readonly endDate?: Date | null;
  readonly order?: number;
}

export type ValidationResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly errors: Record<string, string> };

const ALLOWED_KEYS = new Set([
  'role',
  'institution',
  'track',
  'description',
  'startDate',
  'endDate',
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
    return { date: null, error: `${fieldName} has an invalid day (${day}) for month ${month}` };
  }

  const parsed = new Date(str);
  if (isNaN(parsed.getTime())) {
    return { date: null, error: `${fieldName} is an invalid calendar date` };
  }

  return { date: parsed };
}

export function validateCreateExperienceInput(
  raw: Record<string, unknown>
): ValidationResult<ValidatedCreateExperienceDTO> {
  const errors: Record<string, string> = {};

  for (const key of Object.keys(raw)) {
    if (SYSTEM_KEYS.has(key)) {
      errors[key] = `Field '${key}' is system-controlled and cannot be specified`;
    } else if (!ALLOWED_KEYS.has(key)) {
      errors[key] = `Field '${key}' is not allowed`;
    }
  }

  const role = typeof raw.role === 'string' ? raw.role.trim() : '';
  if (!role || role.length < 2 || role.length > 150) {
    errors.role = 'Role must be between 2 and 150 characters';
  }

  const institution = typeof raw.institution === 'string' ? raw.institution.trim() : '';
  if (!institution || institution.length < 2 || institution.length > 150) {
    errors.institution = 'Institution must be between 2 and 150 characters';
  }

  const track = typeof raw.track === 'string' ? raw.track.trim() : '';
  if (!track || track.length < 2 || track.length > 50) {
    errors.track = 'Track must be between 2 and 50 characters';
  }

  let description: string | null = null;
  if (raw.description !== undefined && raw.description !== null && raw.description !== '') {
    if (typeof raw.description !== 'string') {
      errors.description = 'Description must be a string';
    } else {
      const trimmed = raw.description.trim();
      if (trimmed.length > 3000) {
        errors.description = 'Description cannot exceed 3000 characters';
      } else {
        description = trimmed;
      }
    }
  }

  const startRes = parseStrictIsoDate(raw.startDate, 'Start date');
  if (startRes.error) {
    errors.startDate = startRes.error;
  }

  const endRes = parseStrictIsoDate(raw.endDate, 'End date');
  if (endRes.error) {
    errors.endDate = endRes.error;
  }

  if (startRes.date && endRes.date && endRes.date < startRes.date) {
    errors.endDate = 'End date cannot be earlier than start date';
  }

  let order: number | undefined = undefined;
  if (raw.order !== undefined && raw.order !== null && raw.order !== '') {
    const num = Number(raw.order);
    if (!Number.isInteger(num) || num < 1 || num > 10000) {
      errors.order = 'Order must be an integer between 1 and 10000';
    } else {
      order = num;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      role,
      institution,
      track,
      description,
      startDate: startRes.date,
      endDate: endRes.date,
      ...(order !== undefined ? { order } : {}),
    },
  };
}

export function validateUpdateExperienceInput(
  raw: Record<string, unknown>,
  existingRecord?: { startDate: Date | null; endDate: Date | null }
): ValidationResult<ValidatedUpdateExperienceDTO> {
  const errors: Record<string, string> = {};

  for (const key of Object.keys(raw)) {
    if (SYSTEM_KEYS.has(key)) {
      errors[key] = `Field '${key}' is system-controlled and cannot be specified`;
    } else if (!ALLOWED_KEYS.has(key)) {
      errors[key] = `Field '${key}' is not allowed`;
    }
  }

  const result: Record<string, unknown> = {};

  if (raw.role !== undefined) {
    const role = typeof raw.role === 'string' ? raw.role.trim() : '';
    if (!role || role.length < 2 || role.length > 150) {
      errors.role = 'Role must be between 2 and 150 characters';
    } else {
      result.role = role;
    }
  }

  if (raw.institution !== undefined) {
    const institution = typeof raw.institution === 'string' ? raw.institution.trim() : '';
    if (!institution || institution.length < 2 || institution.length > 150) {
      errors.institution = 'Institution must be between 2 and 150 characters';
    } else {
      result.institution = institution;
    }
  }

  if (raw.track !== undefined) {
    const track = typeof raw.track === 'string' ? raw.track.trim() : '';
    if (!track || track.length < 2 || track.length > 50) {
      errors.track = 'Track must be between 2 and 50 characters';
    } else {
      result.track = track;
    }
  }

  if (raw.description !== undefined) {
    if (raw.description === null || raw.description === '') {
      result.description = null;
    } else if (typeof raw.description !== 'string') {
      errors.description = 'Description must be a string';
    } else {
      const trimmed = raw.description.trim();
      if (trimmed.length > 3000) {
        errors.description = 'Description cannot exceed 3000 characters';
      } else {
        result.description = trimmed || null;
      }
    }
  }

  let effectiveStartDate: Date | null | undefined = undefined;
  if (raw.startDate !== undefined) {
    const startRes = parseStrictIsoDate(raw.startDate, 'Start date');
    if (startRes.error) {
      errors.startDate = startRes.error;
    } else {
      result.startDate = startRes.date;
      effectiveStartDate = startRes.date;
    }
  } else if (existingRecord) {
    effectiveStartDate = existingRecord.startDate;
  }

  let effectiveEndDate: Date | null | undefined = undefined;
  if (raw.endDate !== undefined) {
    const endRes = parseStrictIsoDate(raw.endDate, 'End date');
    if (endRes.error) {
      errors.endDate = endRes.error;
    } else {
      result.endDate = endRes.date;
      effectiveEndDate = endRes.date;
    }
  } else if (existingRecord) {
    effectiveEndDate = existingRecord.endDate;
  }

  if (effectiveStartDate && effectiveEndDate && effectiveEndDate < effectiveStartDate) {
    errors.endDate = 'End date cannot be earlier than start date';
  }

  if (raw.order !== undefined) {
    const num = Number(raw.order);
    if (!Number.isInteger(num) || num < 1 || num > 10000) {
      errors.order = 'Order must be an integer between 1 and 10000';
    } else {
      result.order = num;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: result as ValidatedUpdateExperienceDTO,
  };
}
