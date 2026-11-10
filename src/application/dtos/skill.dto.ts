// src/application/dtos/skill.dto.ts
// Pure TypeScript DTOs and Validators for Skill CMS operations.
// Zero external dependencies.

export interface CreateSkillInput {
  readonly name?: unknown;
  readonly categoryId?: unknown;
  readonly order?: unknown;
}

export interface UpdateSkillInput {
  readonly name?: unknown;
  readonly categoryId?: unknown;
  readonly order?: unknown;
}

export interface ValidatedCreateSkillDTO {
  readonly name: string;
  readonly categoryId: string;
  readonly order?: number;
}

export interface ValidatedUpdateSkillDTO {
  readonly name?: string;
  readonly categoryId?: string;
  readonly order?: number;
}

export type ValidationResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly errors: Record<string, string> };

const ALLOWED_KEYS = new Set(['name', 'categoryId', 'order']);
const SYSTEM_KEYS = new Set(['id', 'createdAt', 'updatedAt']);

export function validateCreateSkillInput(
  raw: Record<string, unknown>
): ValidationResult<ValidatedCreateSkillDTO> {
  const errors: Record<string, string> = {};

  for (const key of Object.keys(raw)) {
    if (SYSTEM_KEYS.has(key)) {
      errors[key] = `Field '${key}' is system-controlled and cannot be specified`;
    } else if (!ALLOWED_KEYS.has(key)) {
      errors[key] = `Field '${key}' is not allowed`;
    }
  }

  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  if (!name || name.length < 1 || name.length > 100) {
    errors.name = 'Name must be between 1 and 100 characters';
  }

  const categoryId = typeof raw.categoryId === 'string' ? raw.categoryId.trim() : '';
  if (!categoryId || categoryId.length < 1 || categoryId.length > 100) {
    errors.categoryId = 'Category ID must be between 1 and 100 characters';
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
      name,
      categoryId,
      ...(order !== undefined ? { order } : {}),
    },
  };
}

export function validateUpdateSkillInput(
  raw: Record<string, unknown>
): ValidationResult<ValidatedUpdateSkillDTO> {
  const errors: Record<string, string> = {};

  for (const key of Object.keys(raw)) {
    if (SYSTEM_KEYS.has(key)) {
      errors[key] = `Field '${key}' is system-controlled and cannot be specified`;
    } else if (!ALLOWED_KEYS.has(key)) {
      errors[key] = `Field '${key}' is not allowed`;
    }
  }

  const data: { name?: string; categoryId?: string; order?: number } = {};
  let fieldsProvided = 0;

  if (raw.name !== undefined) {
    fieldsProvided++;
    if (typeof raw.name !== 'string') {
      errors.name = 'Name must be a string';
    } else {
      const trimmed = raw.name.trim();
      if (!trimmed || trimmed.length < 1 || trimmed.length > 100) {
        errors.name = 'Name must be between 1 and 100 characters';
      } else {
        data.name = trimmed;
      }
    }
  }

  if (raw.categoryId !== undefined) {
    fieldsProvided++;
    if (typeof raw.categoryId !== 'string') {
      errors.categoryId = 'Category ID must be a string';
    } else {
      const trimmed = raw.categoryId.trim();
      if (!trimmed || trimmed.length < 1 || trimmed.length > 100) {
        errors.categoryId = 'Category ID must be between 1 and 100 characters';
      } else {
        data.categoryId = trimmed;
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
