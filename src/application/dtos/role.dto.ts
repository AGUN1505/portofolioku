// src/application/dtos/role.dto.ts
// Pure TypeScript DTOs and Validators for Role CMS operations.
// Zero external dependencies.

export interface CreateRoleInput {
  readonly title?: unknown;
  readonly primary?: unknown;
  readonly order?: unknown;
}

export interface UpdateRoleInput {
  readonly title?: unknown;
  readonly primary?: unknown;
  readonly order?: unknown;
}

export interface ValidatedCreateRoleDTO {
  readonly title: string;
  readonly primary: boolean;
  readonly order?: number;
}

export interface ValidatedUpdateRoleDTO {
  readonly title?: string;
  readonly primary?: boolean;
  readonly order?: number;
}

export type ValidationResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly errors: Record<string, string> };

const ALLOWED_KEYS = new Set(['title', 'primary', 'order']);
const SYSTEM_KEYS = new Set(['id', 'createdAt', 'updatedAt']);

export function validateCreateRoleInput(
  raw: Record<string, unknown>
): ValidationResult<ValidatedCreateRoleDTO> {
  const errors: Record<string, string> = {};

  for (const key of Object.keys(raw)) {
    if (SYSTEM_KEYS.has(key)) {
      errors[key] = `Field '${key}' is system-controlled and cannot be specified`;
    } else if (!ALLOWED_KEYS.has(key)) {
      errors[key] = `Field '${key}' is not allowed`;
    }
  }

  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  if (!title || title.length < 1 || title.length > 100) {
    errors.title = 'Title must be between 1 and 100 characters';
  }

  let primary = false;
  if (raw.primary !== undefined) {
    if (typeof raw.primary !== 'boolean') {
      errors.primary = 'Primary must be a boolean';
    } else {
      primary = raw.primary;
    }
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
      title,
      primary,
      ...(order !== undefined ? { order } : {}),
    },
  };
}

export function validateUpdateRoleInput(
  raw: Record<string, unknown>
): ValidationResult<ValidatedUpdateRoleDTO> {
  const errors: Record<string, string> = {};

  for (const key of Object.keys(raw)) {
    if (SYSTEM_KEYS.has(key)) {
      errors[key] = `Field '${key}' is system-controlled and cannot be specified`;
    } else if (!ALLOWED_KEYS.has(key)) {
      errors[key] = `Field '${key}' is not allowed`;
    }
  }

  const data: { title?: string; primary?: boolean; order?: number } = {};
  let fieldsProvided = 0;

  if (raw.title !== undefined) {
    fieldsProvided++;
    if (typeof raw.title !== 'string') {
      errors.title = 'Title must be a string';
    } else {
      const trimmed = raw.title.trim();
      if (!trimmed || trimmed.length < 1 || trimmed.length > 100) {
        errors.title = 'Title must be between 1 and 100 characters';
      } else {
        data.title = trimmed;
      }
    }
  }

  if (raw.primary !== undefined) {
    fieldsProvided++;
    if (typeof raw.primary !== 'boolean') {
      errors.primary = 'Primary must be a boolean';
    } else {
      data.primary = raw.primary;
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
