// Application DTO & Validator: Hero Profile

export interface UpdateHeroProfileInput {
  readonly name?: unknown;
  readonly tagline?: unknown;
  readonly bio?: unknown;
  readonly country?: unknown;
  readonly code?: unknown;
  readonly timezone?: unknown;
  readonly discipline?: unknown;
}

export interface ValidatedHeroProfileDTO {
  readonly name: string;
  readonly tagline: string;
  readonly bio: string;
  readonly country: string;
  readonly code: string;
  readonly timezone: string;
  readonly discipline: string;
}

export type ValidationResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly errors: Record<string, string> };

export function validateHeroProfileInput(
  raw: Record<string, unknown>
): ValidationResult<ValidatedHeroProfileDTO> {
  const errors: Record<string, string> = {};
  const allowedKeys = new Set([
    'name',
    'tagline',
    'bio',
    'country',
    'code',
    'timezone',
    'discipline',
  ]);

  for (const key of Object.keys(raw)) {
    if (!allowedKeys.has(key)) {
      errors[key] = `Field '${key}' is not allowed`;
    }
  }

  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  if (!name || name.length < 2 || name.length > 100) {
    errors.name = 'Name must be between 2 and 100 characters';
  }

  const tagline = typeof raw.tagline === 'string' ? raw.tagline.trim() : '';
  if (!tagline || tagline.length < 2 || tagline.length > 500) {
    errors.tagline = 'Tagline must be between 2 and 500 characters';
  }

  const bio = typeof raw.bio === 'string' ? raw.bio.trim() : '';
  if (!bio || bio.length < 10 || bio.length > 2000) {
    errors.bio = 'Bio must be between 10 and 2000 characters';
  }

  const country = typeof raw.country === 'string' ? raw.country.trim() : '';
  if (!country || country.length < 2 || country.length > 100) {
    errors.country = 'Country must be between 2 and 100 characters';
  }

  const code = typeof raw.code === 'string' ? raw.code.trim().toUpperCase() : '';
  if (!code || code.length < 2 || code.length > 10) {
    errors.code = 'Country code must be between 2 and 10 characters';
  }

  const timezone = typeof raw.timezone === 'string' ? raw.timezone.trim() : '';
  if (!timezone || timezone.length < 2 || timezone.length > 50) {
    errors.timezone = 'Timezone must be between 2 and 50 characters';
  }

  const discipline = typeof raw.discipline === 'string' ? raw.discipline.trim() : '';
  if (!discipline || discipline.length < 2 || discipline.length > 500) {
    errors.discipline = 'Discipline must be between 2 and 500 characters';
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      name,
      tagline,
      bio,
      country,
      code,
      timezone,
      discipline,
    },
  };
}
