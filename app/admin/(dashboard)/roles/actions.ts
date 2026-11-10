// app/admin/(dashboard)/roles/actions.ts
// Server Actions for Roles CMS module (Create, Update, Delete, Reorder)
// Enforces strict server-side session authorization via DAL verifySession().

'use server';

import { revalidatePath } from 'next/cache';
import { verifySession, UnauthorizedException } from '../../../../src/infrastructure/auth/dal';
import { CompositionRoot } from '../../../../src/infrastructure/composition-root';

export interface ActionFormState {
  readonly success: boolean;
  readonly message?: string;
  readonly error?: string;
  readonly errors?: Record<string, string>;
  readonly id?: string;
  readonly timestamp?: number;
}

export interface ActionResult {
  readonly success: boolean;
  readonly message?: string;
  readonly error?: string;
  readonly timestamp?: number;
}

/**
 * Server Action: Create Role
 */
export async function createRoleAction(
  _prevState: ActionFormState,
  formData: FormData
): Promise<ActionFormState> {
  try {
    await verifySession();
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

  const rawPrimary = formData.get('primary');
  const rawInput = {
    title: formData.get('title'),
    primary: rawPrimary === 'true' || rawPrimary === 'on' || rawPrimary === '1',
  };

  try {
    const useCase = CompositionRoot.getCreateRoleUseCase();
    const result = await useCase.execute(rawInput);

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Validation failed. Please correct the highlighted fields.',
        errors: result.errors,
        timestamp: Date.now(),
      };
    }

    revalidatePath('/admin/roles');
    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: 'Role created successfully.',
      id: result.data.id,
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred while creating role.',
      timestamp: Date.now(),
    };
  }
}

/**
 * Server Action: Update Role
 */
export async function updateRoleAction(
  id: string,
  _prevState: ActionFormState,
  formData: FormData
): Promise<ActionFormState> {
  try {
    await verifySession();
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

  if (!id || typeof id !== 'string') {
    return {
      success: false,
      error: 'Role ID is required.',
      timestamp: Date.now(),
    };
  }

  const rawPrimary = formData.get('primary');
  const rawInput: Record<string, unknown> = {};

  const title = formData.get('title');
  if (title !== null) rawInput.title = title;

  if (rawPrimary !== null) {
    rawInput.primary = rawPrimary === 'true' || rawPrimary === 'on' || rawPrimary === '1';
  }

  try {
    const useCase = CompositionRoot.getUpdateRoleUseCase();
    const result = await useCase.execute(id, rawInput);

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Validation failed. Please correct the highlighted fields.',
        errors: result.errors,
        timestamp: Date.now(),
      };
    }

    revalidatePath('/admin/roles');
    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: 'Role updated successfully.',
      id: result.data.id,
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred while updating role.',
      timestamp: Date.now(),
    };
  }
}

/**
 * Server Action: Delete Role
 */
export async function deleteRoleAction(id: string): Promise<ActionResult> {
  try {
    await verifySession();
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

  if (!id || typeof id !== 'string') {
    return {
      success: false,
      error: 'Role ID is required.',
      timestamp: Date.now(),
    };
  }

  try {
    const useCase = CompositionRoot.getDeleteRoleUseCase();
    const result = await useCase.execute(id);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to delete role.',
        timestamp: Date.now(),
      };
    }

    revalidatePath('/admin/roles');
    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: 'Role deleted successfully.',
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred while deleting role.',
      timestamp: Date.now(),
    };
  }
}

/**
 * Server Action: Reorder Roles
 */
export async function reorderRolesAction(orderedIds: string[]): Promise<ActionResult> {
  try {
    await verifySession();
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

  if (!Array.isArray(orderedIds)) {
    return {
      success: false,
      error: 'orderedIds must be an array of role IDs.',
      timestamp: Date.now(),
    };
  }

  try {
    const useCase = CompositionRoot.getReorderRolesUseCase();
    const result = await useCase.execute(orderedIds);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to reorder roles.',
        timestamp: Date.now(),
      };
    }

    revalidatePath('/admin/roles');
    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: 'Roles reordered successfully.',
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred while reordering roles.',
      timestamp: Date.now(),
    };
  }
}
