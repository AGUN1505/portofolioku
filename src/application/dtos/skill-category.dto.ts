// src/application/dtos/skill-category.dto.ts
// Pure TypeScript DTOs and Validators for SkillCategory CMS operations.
// Zero external dependencies.

export interface CreateSkillCategoryInput {
  readonly title?: unknown;
  readonly order?: unknown;
}

export interface UpdateSkillCategoryInput {
  readonly title?: unknown;
  readonly order?: unknown;
}

export interface ValidatedCreateSkillCategoryDTO {
  readonly title: string;
  readonly order?: number;
}

export interface ValidatedUpdateSkillCategoryDTO {
  readonly title?: string;
  readonly order?: number;
}

export type ValidationResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly errors: Record<string, string> };

const ALLOWED_KEYS = new Set(['title', 'order']);
const SYSTEM_KEYS = new Set(['id', 'createdAt', 'updatedAt']);

export function validateCreateSkillCategoryInput(
  raw: Record<string, unknown>
): ValidationResult<ValidatedCreateSkillCategoryDTO> {
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
      ...(order !== undefined ? { order } : {}),
    },
  };
}

export function validateUpdateSkillCategoryInput(
  raw: Record<string, unknown>
): ValidationResult<ValidatedUpdateSkillCategoryDTO> {
  const errors: Record<string, string> = {};

  for (const key of Object.keys(raw)) {
    if (SYSTEM_KEYS.has(key)) {
      errors[key] = `Field '${key}' is system-controlled and cannot be specified`;
    } else if (!ALLOWED_KEYS.has(key)) {
      errors[key] = `Field '${key}' is not allowed`;
    }
  }

  const data: { title?: string; order?: number } = {};
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
