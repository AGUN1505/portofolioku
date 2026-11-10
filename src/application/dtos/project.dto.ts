// src/application/dtos/project.dto.ts
// Pure TypeScript DTOs and Validators for Project CMS operations.
// Zero external dependencies.

export interface CreateProjectInput {
  readonly title?: unknown;
  readonly category?: unknown;
  readonly description?: unknown;
  readonly technologies?: unknown;
  readonly thumbnailUrl?: unknown;
  readonly projectUrl?: unknown;
  readonly githubUrl?: unknown;
  readonly published?: unknown;
  readonly order?: unknown;
}

export interface UpdateProjectInput {
  readonly title?: unknown;
  readonly category?: unknown;
  readonly description?: unknown;
  readonly technologies?: unknown;
  readonly thumbnailUrl?: unknown;
  readonly projectUrl?: unknown;
  readonly githubUrl?: unknown;
  readonly published?: unknown;
  readonly order?: unknown;
}

export interface ValidatedCreateProjectDTO {
  readonly title: string;
  readonly category: string;
  readonly description: string;
  readonly technologies: readonly string[];
  readonly thumbnailUrl: string | null;
  readonly projectUrl: string | null;
  readonly githubUrl: string | null;
  readonly published: boolean;
  readonly order?: number;
}

export interface ValidatedUpdateProjectDTO {
  readonly title?: string;
  readonly category?: string;
  readonly description?: string;
  readonly technologies?: readonly string[];
  readonly thumbnailUrl?: string | null;
  readonly projectUrl?: string | null;
  readonly githubUrl?: string | null;
  readonly published?: boolean;
  readonly order?: number;
}

export type ValidationResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly errors: Record<string, string> };

const ALLOWED_KEYS = new Set([
  'title',
  'category',
  'description',
  'technologies',
  'thumbnailUrl',
  'projectUrl',
  'githubUrl',
  'published',
  'order',
]);

const SYSTEM_KEYS = new Set(['id', 'createdAt', 'updatedAt', 'publishedAt']);

function validateHttpUrl(url: string, fieldName: string): string | null {
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

function validateThumbnailUrl(url: string): string | null {
  if (url.length > 1000) {
    return 'Thumbnail URL cannot exceed 1000 characters';
  }
  // Reject protocol-relative URLs
  if (url.startsWith('//')) {
    return 'Protocol-relative URLs starting with "//" are not allowed';
  }
  // Allow safe root-relative path
  if (url.startsWith('/')) {
    if (/[\s<>"'\\^`{|}]/.test(url)) {
      return 'Thumbnail path contains invalid characters';
    }
    return null;
  }
  // Reject dangerous protocols
  const lower = url.toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:')) {
    return 'Thumbnail URL uses an unsupported or unsafe protocol';
  }
  // Allow HTTP / HTTPS
  return validateHttpUrl(url, 'Thumbnail URL');
}

function parseTechnologies(
  rawTech: unknown,
  errors: Record<string, string>
): string[] | null {
  let list: unknown[] = [];
  if (Array.isArray(rawTech)) {
    list = rawTech;
  } else if (typeof rawTech === 'string') {
    list = rawTech.split(',').map((t) => t.trim());
  } else {
    errors.technologies = 'Technologies must be an array of strings or comma-separated string';
    return null;
  }

  if (list.length === 0) {
    errors.technologies = 'At least 1 technology is required';
    return null;
  }
  if (list.length > 20) {
    errors.technologies = 'Cannot exceed 20 technologies';
    return null;
  }

  const result: string[] = [];
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (typeof item !== 'string') {
      errors.technologies = `Technology at index ${i} must be a string`;
      return null;
    }
    const trimmed = item.trim();
    if (!trimmed || trimmed.length < 1 || trimmed.length > 50) {
      errors.technologies = `Each technology must be between 1 and 50 characters`;
      return null;
    }
    result.push(trimmed);
  }

  return result;
}

export function validateCreateProjectInput(
  raw: Record<string, unknown>
): ValidationResult<ValidatedCreateProjectDTO> {
  const errors: Record<string, string> = {};

  for (const key of Object.keys(raw)) {
    if (SYSTEM_KEYS.has(key)) {
      errors[key] = `Field '${key}' is system-controlled and cannot be specified`;
    } else if (!ALLOWED_KEYS.has(key)) {
      errors[key] = `Field '${key}' is not allowed`;
    }
  }

  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  if (!title || title.length < 2 || title.length > 150) {
    errors.title = 'Title must be between 2 and 150 characters';
  }

  const category = typeof raw.category === 'string' ? raw.category.trim() : '';
  if (!category || category.length < 2 || category.length > 100) {
    errors.category = 'Category must be between 2 and 100 characters';
  }

  const description = typeof raw.description === 'string' ? raw.description.trim() : '';
  if (!description || description.length < 10 || description.length > 3000) {
    errors.description = 'Description must be between 10 and 3000 characters';
  }

  const parsedTech = parseTechnologies(raw.technologies, errors);

  let thumbnailUrl: string | null = null;
  if (raw.thumbnailUrl !== undefined && raw.thumbnailUrl !== null && raw.thumbnailUrl !== '') {
    if (typeof raw.thumbnailUrl !== 'string') {
      errors.thumbnailUrl = 'Thumbnail URL must be a string';
    } else {
      const trimmed = raw.thumbnailUrl.trim();
      if (trimmed) {
        const err = validateThumbnailUrl(trimmed);
        if (err) {
          errors.thumbnailUrl = err;
        } else {
          thumbnailUrl = trimmed;
        }
      }
    }
  }

  let projectUrl: string | null = null;
  if (raw.projectUrl !== undefined && raw.projectUrl !== null && raw.projectUrl !== '') {
    if (typeof raw.projectUrl !== 'string') {
      errors.projectUrl = 'Project URL must be a string';
    } else {
      const trimmed = raw.projectUrl.trim();
      if (trimmed) {
        const err = validateHttpUrl(trimmed, 'Project URL');
        if (err) {
          errors.projectUrl = err;
        } else {
          projectUrl = trimmed;
        }
      }
    }
  }

  let githubUrl: string | null = null;
  if (raw.githubUrl !== undefined && raw.githubUrl !== null && raw.githubUrl !== '') {
    if (typeof raw.githubUrl !== 'string') {
      errors.githubUrl = 'GitHub URL must be a string';
    } else {
      const trimmed = raw.githubUrl.trim();
      if (trimmed) {
        const err = validateHttpUrl(trimmed, 'GitHub URL');
        if (err) {
          errors.githubUrl = err;
        } else {
          githubUrl = trimmed;
        }
      }
    }
  }

  let published = false;
  if (raw.published !== undefined && raw.published !== null) {
    if (typeof raw.published === 'boolean') {
      published = raw.published;
    } else if (raw.published === 'true') {
      published = true;
    } else if (raw.published === 'false') {
      published = false;
    } else {
      errors.published = 'Published must be a boolean value';
    }
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
      title,
      category,
      description,
      technologies: parsedTech ?? [],
      thumbnailUrl,
      projectUrl,
      githubUrl,
      published,
      ...(order !== undefined ? { order } : {}),
    },
  };
}

export function validateUpdateProjectInput(
  raw: Record<string, unknown>
): ValidationResult<ValidatedUpdateProjectDTO> {
  const errors: Record<string, string> = {};

  for (const key of Object.keys(raw)) {
    if (SYSTEM_KEYS.has(key)) {
      errors[key] = `Field '${key}' is system-controlled and cannot be specified`;
    } else if (!ALLOWED_KEYS.has(key)) {
      errors[key] = `Field '${key}' is not allowed`;
    }
  }

  const result: Record<string, unknown> = {};

  if (raw.title !== undefined) {
    const title = typeof raw.title === 'string' ? raw.title.trim() : '';
    if (!title || title.length < 2 || title.length > 150) {
      errors.title = 'Title must be between 2 and 150 characters';
    } else {
      result.title = title;
    }
  }

  if (raw.category !== undefined) {
    const category = typeof raw.category === 'string' ? raw.category.trim() : '';
    if (!category || category.length < 2 || category.length > 100) {
      errors.category = 'Category must be between 2 and 100 characters';
    } else {
      result.category = category;
    }
  }

  if (raw.description !== undefined) {
    const description = typeof raw.description === 'string' ? raw.description.trim() : '';
    if (!description || description.length < 10 || description.length > 3000) {
      errors.description = 'Description must be between 10 and 3000 characters';
    } else {
      result.description = description;
    }
  }

  if (raw.technologies !== undefined) {
    const parsedTech = parseTechnologies(raw.technologies, errors);
    if (parsedTech) {
      result.technologies = parsedTech;
    }
  }

  if (raw.thumbnailUrl !== undefined) {
    if (raw.thumbnailUrl === null || raw.thumbnailUrl === '') {
      result.thumbnailUrl = null;
    } else if (typeof raw.thumbnailUrl !== 'string') {
      errors.thumbnailUrl = 'Thumbnail URL must be a string';
    } else {
      const trimmed = raw.thumbnailUrl.trim();
      if (!trimmed) {
        result.thumbnailUrl = null;
      } else {
        const err = validateThumbnailUrl(trimmed);
        if (err) {
          errors.thumbnailUrl = err;
        } else {
          result.thumbnailUrl = trimmed;
        }
      }
    }
  }

  if (raw.projectUrl !== undefined) {
    if (raw.projectUrl === null || raw.projectUrl === '') {
      result.projectUrl = null;
    } else if (typeof raw.projectUrl !== 'string') {
      errors.projectUrl = 'Project URL must be a string';
    } else {
      const trimmed = raw.projectUrl.trim();
      if (!trimmed) {
        result.projectUrl = null;
      } else {
        const err = validateHttpUrl(trimmed, 'Project URL');
        if (err) {
          errors.projectUrl = err;
        } else {
          result.projectUrl = trimmed;
        }
      }
    }
  }

  if (raw.githubUrl !== undefined) {
    if (raw.githubUrl === null || raw.githubUrl === '') {
      result.githubUrl = null;
    } else if (typeof raw.githubUrl !== 'string') {
      errors.githubUrl = 'GitHub URL must be a string';
    } else {
      const trimmed = raw.githubUrl.trim();
      if (!trimmed) {
        result.githubUrl = null;
      } else {
        const err = validateHttpUrl(trimmed, 'GitHub URL');
        if (err) {
          errors.githubUrl = err;
        } else {
          result.githubUrl = trimmed;
        }
      }
    }
  }

  if (raw.published !== undefined) {
    if (typeof raw.published === 'boolean') {
      result.published = raw.published;
    } else if (raw.published === 'true') {
      result.published = true;
    } else if (raw.published === 'false') {
      result.published = false;
    } else {
      errors.published = 'Published must be a boolean value';
    }
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
    data: result as ValidatedUpdateProjectDTO,
  };
}
