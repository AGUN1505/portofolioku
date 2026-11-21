// src/application/dtos/section-config.dto.ts
// Pure TypeScript DTOs and Validators for SectionConfig CMS operations.
// Zero external dependencies.

export interface CreateSectionConfigInput {
  readonly key?: unknown;
  readonly label?: unknown;
  readonly order?: unknown;
  readonly enabled?: unknown;
}

export interface UpdateSectionConfigInput {
  readonly key?: unknown;
  readonly label?: unknown;
  readonly order?: unknown;
  readonly enabled?: unknown;
}

export interface ReorderSectionConfigsInput {
  readonly orderedIds?: unknown;
}

export interface ValidatedCreateSectionConfigDTO {
  readonly key: string;
  readonly label: string;
  readonly order?: number;
  readonly enabled?: boolean;
}

export interface ValidatedUpdateSectionConfigDTO {
  readonly key?: string;
  readonly label?: string;
  readonly order?: number;
  readonly enabled?: boolean;
}

export interface ValidatedReorderSectionConfigsDTO {
  readonly orderedIds: string[];
}

export type ValidationResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly errors: Record<string, string> };

export const ALLOWED_KEYS = new Set(['key', 'label', 'order', 'enabled']);
export const SYSTEM_KEYS = new Set(['id', 'createdAt', 'updatedAt']);

/**
 * Validates payload for creating a new section configuration.
 * Rejects system-controlled fields (id, createdAt, updatedAt) and extraneous keys.
 */
export function validateCreateSectionConfigInput(
  raw: Record<string, unknown>
): ValidationResult<ValidatedCreateSectionConfigDTO> {
  const errors: Record<string, string> = {};

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      success: false,
      errors: { _general: 'Input must be a valid object' },
    };
  }

  for (const key of Object.keys(raw)) {
    if (SYSTEM_KEYS.has(key)) {
      errors[key] = `Field '${key}' is system-controlled and cannot be specified`;
    } else if (!ALLOWED_KEYS.has(key)) {
      errors[key] = `Field '${key}' is not allowed`;
    }
  }

  // key: required string (1-50 chars, slug/identifier friendly)
  const keyVal = typeof raw.key === 'string' ? raw.key.trim() : '';
  if (!keyVal || keyVal.length < 1 || keyVal.length > 50) {
    errors.key = 'Key is required and must be between 1 and 50 characters';
  } else if (!/^[a-zA-Z0-9_-]+$/.test(keyVal)) {
    errors.key = 'Key must contain only alphanumeric characters, dashes, or underscores';
  }

  // label: required string (1-100 chars)
  const labelVal = typeof raw.label === 'string' ? raw.label.trim() : '';
  if (!labelVal || labelVal.length < 1 || labelVal.length > 100) {
    errors.label = 'Label is required and must be between 1 and 100 characters';
  }

  // order: optional integer >= 0
  let order: number | undefined;
  if (raw.order !== undefined && raw.order !== null) {
    if (typeof raw.order !== 'number' || !Number.isInteger(raw.order) || raw.order < 0) {
      errors.order = 'Order must be a non-negative integer';
    } else {
      order = raw.order;
    }
  }

  // enabled: optional boolean
  let enabled: boolean | undefined;
  if (raw.enabled !== undefined && raw.enabled !== null) {
    if (typeof raw.enabled !== 'boolean') {
      errors.enabled = 'Enabled must be a boolean';
    } else {
      enabled = raw.enabled;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      key: keyVal,
      label: labelVal,
      ...(order !== undefined ? { order } : {}),
      ...(enabled !== undefined ? { enabled } : {}),
    },
  };
}

/**
 * Validates payload for updating an existing section configuration.
 * Rejects system-controlled fields (id, createdAt, updatedAt) and extraneous keys.
 * Requires at least one editable field.
 */
export function validateUpdateSectionConfigInput(
  raw: Record<string, unknown>
): ValidationResult<ValidatedUpdateSectionConfigDTO> {
  const errors: Record<string, string> = {};

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      success: false,
      errors: { _general: 'Input must be a valid object' },
    };
  }

  for (const key of Object.keys(raw)) {
    if (SYSTEM_KEYS.has(key)) {
      errors[key] = `Field '${key}' is system-controlled and cannot be specified`;
    } else if (!ALLOWED_KEYS.has(key)) {
      errors[key] = `Field '${key}' is not allowed`;
    }
  }

  const data: {
    key?: string;
    label?: string;
    order?: number;
    enabled?: boolean;
  } = {};
  let fieldsProvided = 0;

  if (raw.key !== undefined) {
    fieldsProvided++;
    if (typeof raw.key !== 'string') {
      errors.key = 'Key must be a string';
    } else {
      const trimmed = raw.key.trim();
      if (!trimmed || trimmed.length < 1 || trimmed.length > 50) {
        errors.key = 'Key must be between 1 and 50 characters';
      } else if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
        errors.key = 'Key must contain only alphanumeric characters, dashes, or underscores';
      } else {
        data.key = trimmed;
      }
    }
  }

  if (raw.label !== undefined) {
    fieldsProvided++;
    if (typeof raw.label !== 'string') {
      errors.label = 'Label must be a string';
    } else {
      const trimmed = raw.label.trim();
      if (!trimmed || trimmed.length < 1 || trimmed.length > 100) {
        errors.label = 'Label must be between 1 and 100 characters';
      } else {
        data.label = trimmed;
      }
    }
  }

  if (raw.order !== undefined && raw.order !== null) {
    fieldsProvided++;
    if (typeof raw.order !== 'number' || !Number.isInteger(raw.order) || raw.order < 0) {
      errors.order = 'Order must be a non-negative integer';
    } else {
      data.order = raw.order;
    }
  }

  if (raw.enabled !== undefined && raw.enabled !== null) {
    fieldsProvided++;
    if (typeof raw.enabled !== 'boolean') {
      errors.enabled = 'Enabled must be a boolean';
    } else {
      data.enabled = raw.enabled;
    }
  }

  if (fieldsProvided === 0 && Object.keys(errors).length === 0) {
    errors._general = 'At least one field must be provided for update';
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return { success: true, data };
}

/**
 * Validates reorder input (either an array of IDs or an object with orderedIds).
 */
export function validateReorderSectionConfigsInput(
  raw: unknown
): ValidationResult<ValidatedReorderSectionConfigsDTO> {
  const errors: Record<string, string> = {};

  let orderedIds: unknown = raw;
  if (raw && typeof raw === 'object' && !Array.isArray(raw) && 'orderedIds' in raw) {
    orderedIds = (raw as Record<string, unknown>).orderedIds;
  }

  if (!Array.isArray(orderedIds)) {
    return {
      success: false,
      errors: { orderedIds: 'orderedIds must be an array of section IDs' },
    };
  }

  if (orderedIds.length === 0) {
    return {
      success: false,
      errors: { orderedIds: 'orderedIds cannot be empty' },
    };
  }

  const validatedIds: string[] = [];
  const seenIds = new Set<string>();

  for (let i = 0; i < orderedIds.length; i++) {
    const item = orderedIds[i];
    if (typeof item !== 'string' || !item.trim()) {
      errors[`orderedIds[${i}]`] = `Section ID at index ${i} must be a non-empty string`;
      continue;
    }
    const trimmed = item.trim();
    if (seenIds.has(trimmed)) {
      errors.orderedIds = 'orderedIds contains duplicate section IDs';
      break;
    }
    seenIds.add(trimmed);
    validatedIds.push(trimmed);
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: { orderedIds: validatedIds },
  };
}

// Semantic aliases for consistency
export const validateCreateSectionConfig = validateCreateSectionConfigInput;
export const validateUpdateSectionConfig = validateUpdateSectionConfigInput;
export const validateReorderSectionConfigs = validateReorderSectionConfigsInput;
