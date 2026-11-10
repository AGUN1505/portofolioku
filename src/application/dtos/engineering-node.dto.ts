// src/application/dtos/engineering-node.dto.ts
// Pure TypeScript DTOs and Validators for EngineeringNode CMS operations.
// Zero external dependencies.

export interface CreateEngineeringNodeInput {
  readonly tag?: unknown;
  readonly title?: unknown;
  readonly description?: unknown;
  readonly stack?: unknown;
  readonly highlighted?: unknown;
  readonly order?: unknown;
}

export interface UpdateEngineeringNodeInput {
  readonly tag?: unknown;
  readonly title?: unknown;
  readonly description?: unknown;
  readonly stack?: unknown;
  readonly highlighted?: unknown;
  readonly order?: unknown;
}

export interface ValidatedCreateEngineeringNodeDTO {
  readonly tag: string;
  readonly title: string;
  readonly description: string;
  readonly stack: string | null;
  readonly highlighted: boolean;
  readonly order?: number;
}

export interface ValidatedUpdateEngineeringNodeDTO {
  readonly tag?: string;
  readonly title?: string;
  readonly description?: string;
  readonly stack?: string | null;
  readonly highlighted?: boolean;
  readonly order?: number;
}

export type ValidationResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly errors: Record<string, string> };

const ALLOWED_KEYS = new Set(['tag', 'title', 'description', 'stack', 'highlighted', 'order']);
const SYSTEM_KEYS = new Set(['id', 'createdAt', 'updatedAt']);

export function validateCreateEngineeringNodeInput(
  raw: Record<string, unknown>
): ValidationResult<ValidatedCreateEngineeringNodeDTO> {
  const errors: Record<string, string> = {};

  for (const key of Object.keys(raw)) {
    if (SYSTEM_KEYS.has(key)) {
      errors[key] = `Field '${key}' is system-controlled and cannot be specified`;
    } else if (!ALLOWED_KEYS.has(key)) {
      errors[key] = `Field '${key}' is not allowed`;
    }
  }

  const tag = typeof raw.tag === 'string' ? raw.tag.trim() : '';
  if (!tag || tag.length < 1 || tag.length > 50) {
    errors.tag = 'Tag must be between 1 and 50 characters';
  }

  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  if (!title || title.length < 1 || title.length > 150) {
    errors.title = 'Title must be between 1 and 150 characters';
  }

  const description = typeof raw.description === 'string' ? raw.description.trim() : '';
  if (!description || description.length < 1 || description.length > 1000) {
    errors.description = 'Description must be between 1 and 1000 characters';
  }

  let stack: string | null = null;
  if (raw.stack !== undefined && raw.stack !== null && raw.stack !== '') {
    if (typeof raw.stack !== 'string') {
      errors.stack = 'Stack must be a string or null';
    } else {
      const trimmed = raw.stack.trim();
      if (trimmed.length > 200) {
        errors.stack = 'Stack cannot exceed 200 characters';
      } else {
        stack = trimmed.length > 0 ? trimmed : null;
      }
    }
  }

  let highlighted = false;
  if (raw.highlighted !== undefined) {
    if (typeof raw.highlighted !== 'boolean') {
      errors.highlighted = 'Highlighted must be a boolean';
    } else {
      highlighted = raw.highlighted;
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
      tag,
      title,
      description,
      stack,
      highlighted,
      ...(order !== undefined ? { order } : {}),
    },
  };
}

export function validateUpdateEngineeringNodeInput(
  raw: Record<string, unknown>
): ValidationResult<ValidatedUpdateEngineeringNodeDTO> {
  const errors: Record<string, string> = {};

  for (const key of Object.keys(raw)) {
    if (SYSTEM_KEYS.has(key)) {
      errors[key] = `Field '${key}' is system-controlled and cannot be specified`;
    } else if (!ALLOWED_KEYS.has(key)) {
      errors[key] = `Field '${key}' is not allowed`;
    }
  }

  const data: {
    tag?: string;
    title?: string;
    description?: string;
    stack?: string | null;
    highlighted?: boolean;
    order?: number;
  } = {};
  let fieldsProvided = 0;

  if (raw.tag !== undefined) {
    fieldsProvided++;
    if (typeof raw.tag !== 'string') {
      errors.tag = 'Tag must be a string';
    } else {
      const trimmed = raw.tag.trim();
      if (!trimmed || trimmed.length < 1 || trimmed.length > 50) {
        errors.tag = 'Tag must be between 1 and 50 characters';
      } else {
        data.tag = trimmed;
      }
    }
  }

  if (raw.title !== undefined) {
    fieldsProvided++;
    if (typeof raw.title !== 'string') {
      errors.title = 'Title must be a string';
    } else {
      const trimmed = raw.title.trim();
      if (!trimmed || trimmed.length < 1 || trimmed.length > 150) {
        errors.title = 'Title must be between 1 and 150 characters';
      } else {
        data.title = trimmed;
      }
    }
  }

  if (raw.description !== undefined) {
    fieldsProvided++;
    if (typeof raw.description !== 'string') {
      errors.description = 'Description must be a string';
    } else {
      const trimmed = raw.description.trim();
      if (!trimmed || trimmed.length < 1 || trimmed.length > 1000) {
        errors.description = 'Description must be between 1 and 1000 characters';
      } else {
        data.description = trimmed;
      }
    }
  }

  if (raw.stack !== undefined) {
    fieldsProvided++;
    if (raw.stack === null || raw.stack === '') {
      data.stack = null;
    } else if (typeof raw.stack !== 'string') {
      errors.stack = 'Stack must be a string or null';
    } else {
      const trimmed = raw.stack.trim();
      if (trimmed.length > 200) {
        errors.stack = 'Stack cannot exceed 200 characters';
      } else {
        data.stack = trimmed.length > 0 ? trimmed : null;
      }
    }
  }

  if (raw.highlighted !== undefined) {
    fieldsProvided++;
    if (typeof raw.highlighted !== 'boolean') {
      errors.highlighted = 'Highlighted must be a boolean';
    } else {
      data.highlighted = raw.highlighted;
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
