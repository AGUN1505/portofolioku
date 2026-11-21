// src/application/dtos/contact-channel.dto.ts
// Pure TypeScript DTOs and Validators for ContactChannel CMS operations.
// Zero external dependencies.

export interface CreateContactChannelInput {
  readonly label?: unknown;
  readonly value?: unknown;
  readonly order?: unknown;
}

export interface UpdateContactChannelInput {
  readonly label?: unknown;
  readonly value?: unknown;
  readonly order?: unknown;
}

export interface ValidatedCreateContactChannelDTO {
  readonly label: string;
  readonly value: string;
  readonly order?: number;
}

export interface ValidatedUpdateContactChannelDTO {
  readonly label?: string;
  readonly value?: string;
  readonly order?: number;
}

export type ValidationResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly errors: Record<string, string> };

const ALLOWED_KEYS = new Set(['label', 'value', 'order']);
const SYSTEM_KEYS = new Set(['id', 'createdAt', 'updatedAt']);

export function isSyntheticPlaceholderValue(val: string): boolean {
  const lower = val.toLowerCase();
  return (
    val.includes('[') ||
    val.includes(']') ||
    lower.includes('placeholder') ||
    lower.includes('ready for official')
  );
}

export function validateCreateContactChannelInput(
  raw: Record<string, unknown>
): ValidationResult<ValidatedCreateContactChannelDTO> {
  const errors: Record<string, string> = {};

  for (const key of Object.keys(raw)) {
    if (SYSTEM_KEYS.has(key)) {
      errors[key] = `Field '${key}' is system-controlled and cannot be specified`;
    } else if (!ALLOWED_KEYS.has(key)) {
      errors[key] = `Field '${key}' is not allowed`;
    }
  }

  const label = typeof raw.label === 'string' ? raw.label.trim() : '';
  if (!label || label.length < 1 || label.length > 100) {
    errors.label = 'Label must be between 1 and 100 characters';
  } else if (isSyntheticPlaceholderValue(label)) {
    errors.label = 'Label cannot contain placeholder text';
  }

  const value = typeof raw.value === 'string' ? raw.value.trim() : '';
  if (!value || value.length < 1 || value.length > 500) {
    errors.value = 'Value must be between 1 and 500 characters';
  } else if (isSyntheticPlaceholderValue(value)) {
    errors.value = 'Value cannot contain synthetic placeholder markers';
  }

  let order: number | undefined;
  if (raw.order !== undefined) {
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
      label,
      value,
      ...(order !== undefined ? { order } : {}),
    },
  };
}

export function validateUpdateContactChannelInput(
  raw: Record<string, unknown>
): ValidationResult<ValidatedUpdateContactChannelDTO> {
  const errors: Record<string, string> = {};

  for (const key of Object.keys(raw)) {
    if (SYSTEM_KEYS.has(key)) {
      errors[key] = `Field '${key}' is system-controlled and cannot be specified`;
    } else if (!ALLOWED_KEYS.has(key)) {
      errors[key] = `Field '${key}' is not allowed`;
    }
  }

  const data: { label?: string; value?: string; order?: number } = {};
  let fieldsProvided = 0;

  if (raw.label !== undefined) {
    fieldsProvided++;
    if (typeof raw.label !== 'string') {
      errors.label = 'Label must be a string';
    } else {
      const trimmed = raw.label.trim();
      if (!trimmed || trimmed.length < 1 || trimmed.length > 100) {
        errors.label = 'Label must be between 1 and 100 characters';
      } else if (isSyntheticPlaceholderValue(trimmed)) {
        errors.label = 'Label cannot contain placeholder text';
      } else {
        data.label = trimmed;
      }
    }
  }

  if (raw.value !== undefined) {
    fieldsProvided++;
    if (typeof raw.value !== 'string') {
      errors.value = 'Value must be a string';
    } else {
      const trimmed = raw.value.trim();
      if (!trimmed || trimmed.length < 1 || trimmed.length > 500) {
        errors.value = 'Value must be between 1 and 500 characters';
      } else if (isSyntheticPlaceholderValue(trimmed)) {
        errors.value = 'Value cannot contain synthetic placeholder markers';
      } else {
        data.value = trimmed;
      }
    }
  }

  if (raw.order !== undefined) {
    fieldsProvided++;
    if (typeof raw.order !== 'number' || !Number.isInteger(raw.order) || raw.order < 1) {
      errors.order = 'Order must be a positive integer';
    } else {
      data.order = raw.order;
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
