// src/application/dtos/admin-account.dto.ts
// Pure TypeScript DTOs and Validators for Admin Account Settings operations.
// Zero external dependencies.

import { BootstrapAdminUseCase } from '../use-cases/auth/bootstrap-admin.use-case';

export interface ValidatedUpdateAdminProfileDTO {
  readonly username: string;
  readonly email: string | null;
  readonly currentPassword: string;
}

export interface ValidatedChangeAdminPasswordDTO {
  readonly currentPassword: string;
  readonly newPassword: string;
  readonly confirmPassword: string;
}

export type ValidationResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly errors: Record<string, string> };

const PROFILE_ALLOWED_KEYS = new Set(['username', 'email', 'currentPassword']);
const PASSWORD_ALLOWED_KEYS = new Set(['currentPassword', 'newPassword', 'confirmPassword']);
const SYSTEM_KEYS = new Set(['id', 'passwordHash', 'sessionVersion', 'createdAt', 'updatedAt']);

const USERNAME_REGEX = /^[a-z0-9_-]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateUpdateAdminProfileInput(
  raw: Record<string, unknown>
): ValidationResult<ValidatedUpdateAdminProfileDTO> {
  const errors: Record<string, string> = {};

  for (const key of Object.keys(raw)) {
    if (SYSTEM_KEYS.has(key)) {
      errors[key] = `Field '${key}' is system-controlled and cannot be specified`;
    } else if (!PROFILE_ALLOWED_KEYS.has(key)) {
      errors[key] = `Field '${key}' is not allowed`;
    }
  }

  const rawUsername = typeof raw.username === 'string' ? raw.username.trim().toLowerCase() : '';
  if (!rawUsername || rawUsername.length < 3 || rawUsername.length > 30) {
    errors.username = 'Username must be between 3 and 30 characters';
  } else if (!USERNAME_REGEX.test(rawUsername)) {
    errors.username =
      'Username can only contain lowercase alphanumeric characters, underscores, and hyphens';
  }

  let normalizedEmail: string | null = null;
  if (raw.email !== undefined && raw.email !== null) {
    if (typeof raw.email !== 'string') {
      errors.email = 'Email must be a valid email address';
    } else {
      const trimmedEmail = raw.email.trim().toLowerCase();
      if (trimmedEmail.length > 0) {
        if (trimmedEmail.length > 254 || !EMAIL_REGEX.test(trimmedEmail)) {
          errors.email = 'Email must be a valid email address';
        } else {
          normalizedEmail = trimmedEmail;
        }
      }
    }
  }

  const currentPassword = typeof raw.currentPassword === 'string' ? raw.currentPassword : '';
  if (!currentPassword) {
    errors.currentPassword = 'Current password is required to confirm profile changes';
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      username: rawUsername,
      email: normalizedEmail,
      currentPassword,
    },
  };
}

export function validateChangeAdminPasswordInput(
  raw: Record<string, unknown>,
  currentUsername?: string
): ValidationResult<ValidatedChangeAdminPasswordDTO> {
  const errors: Record<string, string> = {};

  for (const key of Object.keys(raw)) {
    if (SYSTEM_KEYS.has(key)) {
      errors[key] = `Field '${key}' is system-controlled and cannot be specified`;
    } else if (!PASSWORD_ALLOWED_KEYS.has(key)) {
      errors[key] = `Field '${key}' is not allowed`;
    }
  }

  const currentPassword = typeof raw.currentPassword === 'string' ? raw.currentPassword : '';
  if (!currentPassword) {
    errors.currentPassword = 'Current password is required';
  }

  const newPassword = typeof raw.newPassword === 'string' ? raw.newPassword : '';
  const policyResult = BootstrapAdminUseCase.validatePasswordPolicy(newPassword, currentUsername);
  if (!policyResult.valid) {
    errors.newPassword = policyResult.error ?? 'New password does not meet security policy';
  } else if (currentPassword && newPassword === currentPassword) {
    errors.newPassword = 'New password must be different from current password';
  }

  const confirmPassword = typeof raw.confirmPassword === 'string' ? raw.confirmPassword : '';
  if (!confirmPassword || confirmPassword !== newPassword) {
    errors.confirmPassword = 'Password confirmation does not match new password';
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      currentPassword,
      newPassword,
      confirmPassword,
    },
  };
}
