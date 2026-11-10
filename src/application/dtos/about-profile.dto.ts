// Application DTO & Validator: About Profile

export interface UpdateAboutProfileInput {
  readonly heading?: unknown;
  readonly quote?: unknown;
  readonly primaryNarrative?: unknown;
  readonly secondaryNarrative?: unknown;
}

export interface ValidatedAboutProfileDTO {
  readonly heading: string;
  readonly quote: string;
  readonly primaryNarrative: string;
  readonly secondaryNarrative: string;
}

export type ValidationResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly errors: Record<string, string> };

export function validateAboutProfileInput(
  raw: Record<string, unknown>
): ValidationResult<ValidatedAboutProfileDTO> {
  const errors: Record<string, string> = {};
  const allowedKeys = new Set([
    'heading',
    'quote',
    'primaryNarrative',
    'secondaryNarrative',
  ]);

  for (const key of Object.keys(raw)) {
    if (!allowedKeys.has(key)) {
      errors[key] = `Field '${key}' is not allowed`;
    }
  }

  const heading = typeof raw.heading === 'string' ? raw.heading.trim() : '';
  if (!heading || heading.length < 2 || heading.length > 150) {
    errors.heading = 'Heading must be between 2 and 150 characters';
  }

  const quote = typeof raw.quote === 'string' ? raw.quote.trim() : '';
  if (!quote || quote.length < 5 || quote.length > 1000) {
    errors.quote = 'Quote must be between 5 and 1000 characters';
  }

  const primaryNarrative =
    typeof raw.primaryNarrative === 'string' ? raw.primaryNarrative.trim() : '';
  if (!primaryNarrative || primaryNarrative.length < 5 || primaryNarrative.length > 3000) {
    errors.primaryNarrative = 'Primary narrative must be between 5 and 3000 characters';
  }

  const secondaryNarrative =
    typeof raw.secondaryNarrative === 'string' ? raw.secondaryNarrative.trim() : '';
  if (!secondaryNarrative || secondaryNarrative.length < 5 || secondaryNarrative.length > 3000) {
    errors.secondaryNarrative = 'Secondary narrative must be between 5 and 3000 characters';
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      heading,
      quote,
      primaryNarrative,
      secondaryNarrative,
    },
  };
}
