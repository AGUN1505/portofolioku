// Application DTO & Validator: Contact Profile

export interface UpdateContactProfileInput {
  readonly heading?: unknown;
  readonly ctaLabel?: unknown;
  readonly description?: unknown;
}

export interface ValidatedContactProfileDTO {
  readonly heading: string;
  readonly ctaLabel: string;
  readonly description: string;
}

export type ValidationResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly errors: Record<string, string> };

export function validateContactProfileInput(
  raw: Record<string, unknown>
): ValidationResult<ValidatedContactProfileDTO> {
  const errors: Record<string, string> = {};
  const allowedKeys = new Set(['heading', 'ctaLabel', 'description']);

  for (const key of Object.keys(raw)) {
    if (!allowedKeys.has(key)) {
      errors[key] = `Field '${key}' is not allowed`;
    }
  }

  const heading = typeof raw.heading === 'string' ? raw.heading.trim() : '';
  if (!heading || heading.length < 2 || heading.length > 150) {
    errors.heading = 'Heading must be between 2 and 150 characters';
  }

  const ctaLabel = typeof raw.ctaLabel === 'string' ? raw.ctaLabel.trim() : '';
  if (!ctaLabel || ctaLabel.length < 2 || ctaLabel.length > 100) {
    errors.ctaLabel = 'CTA label must be between 2 and 100 characters';
  }

  const description =
    typeof raw.description === 'string' ? raw.description.trim() : '';
  if (!description || description.length < 5 || description.length > 2000) {
    errors.description = 'Description must be between 5 and 2000 characters';
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      heading,
      ctaLabel,
      description,
    },
  };
}
