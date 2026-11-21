// app/admin/(dashboard)/account/actions.ts
// Server Actions for Administrator Account Settings (Profile Update & Password Rotation)
// Enforces strict server-side session authorization via DAL verifySession() and rotates Iron Session cookies.

'use server';

import { revalidatePath } from 'next/cache';
import { verifySession, UnauthorizedException } from '../../../../src/infrastructure/auth/dal';
import {
  createSessionCookie,
  SESSION_TTL_SECONDS,
} from '../../../../src/infrastructure/auth/session';
import { CompositionRoot } from '../../../../src/infrastructure/composition-root';

export interface AccountFormState {
  readonly success: boolean;
  readonly message?: string;
  readonly error?: string;
  readonly errors?: Record<string, string>;
  readonly timestamp?: number;
}

/**
 * Server Action: Update Administrator Profile (username & email)
 */
export async function updateAdminProfileAction(
  _prevState: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  let session;
  try {
    session = await verifySession();
  } catch (err) {
    if (err instanceof UnauthorizedException) {
      return {
        success: false,
        error: 'Unauthorized. Session is invalid or expired.',
        timestamp: Date.now(),
      };
    }
    return {
      success: false,
      error: 'Authentication failed.',
      timestamp: Date.now(),
    };
  }

  const rawEmail = formData.get('email');
  const rawInput: Record<string, unknown> = {
    username: formData.get('username'),
    email: rawEmail === null ? '' : rawEmail,
    currentPassword: formData.get('currentPassword'),
  };

  try {
    const useCase = CompositionRoot.getUpdateAdminProfileUseCase();
    const result = await useCase.execute(session.userId, rawInput);

    if (!result.success || !result.data || result.sessionVersion === undefined) {
      return {
        success: false,
        error: result.error || 'Validation failed. Please correct the highlighted fields.',
        errors: result.errors,
        timestamp: Date.now(),
      };
    }

    await createSessionCookie({
      userId: result.data.id,
      username: result.data.username,
      sessionVersion: result.sessionVersion,
      expiresAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString(),
    });

    revalidatePath('/admin/account');
    revalidatePath('/admin');

    return {
      success: true,
      message: 'Administrator profile updated successfully.',
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while updating administrator profile.',
      timestamp: Date.now(),
    };
  }
}

/**
 * Server Action: Change Administrator Password & Rotate Session Version
 */
export async function changeAdminPasswordAction(
  _prevState: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  let session;
  try {
    session = await verifySession();
  } catch (err) {
    if (err instanceof UnauthorizedException) {
      return {
        success: false,
        error: 'Unauthorized. Session is invalid or expired.',
        timestamp: Date.now(),
      };
    }
    return {
      success: false,
      error: 'Authentication failed.',
      timestamp: Date.now(),
    };
  }

  const rawInput: Record<string, unknown> = {
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  };

  try {
    const useCase = CompositionRoot.getChangeAdminPasswordUseCase();
    const result = await useCase.execute(session.userId, rawInput);

    if (!result.success || !result.admin || result.sessionVersion === undefined) {
      return {
        success: false,
        error: result.error || 'Validation failed. Please correct the highlighted fields.',
        errors: result.errors,
        timestamp: Date.now(),
      };
    }

    await createSessionCookie({
      userId: result.admin.id,
      username: result.admin.username,
      sessionVersion: result.sessionVersion,
      expiresAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString(),
    });

    revalidatePath('/admin/account');
    revalidatePath('/admin');

    return {
      success: true,
      message: `Password updated successfully. Session rotated to v${result.sessionVersion} and other active sessions revoked.`,
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while changing administrator password.',
      timestamp: Date.now(),
    };
  }
}
