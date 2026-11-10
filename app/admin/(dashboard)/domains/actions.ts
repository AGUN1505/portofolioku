// app/admin/(dashboard)/domains/actions.ts
// Server Actions for Domains CMS module (Create, Update, Delete, Reorder)
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
 * Server Action: Create Domain
 */
export async function createDomainAction(
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

  const rawInput = {
    index: formData.get('index'),
    title: formData.get('title'),
  };

  try {
    const useCase = CompositionRoot.getCreateDomainUseCase();
    const result = await useCase.execute(rawInput);

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Validation failed. Please correct the highlighted fields.',
        errors: result.errors,
        timestamp: Date.now(),
      };
    }

    revalidatePath('/admin/domains');
    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: 'Domain created successfully.',
      id: result.data.id,
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred while creating domain.',
      timestamp: Date.now(),
    };
  }
}

/**
 * Server Action: Update Domain
 */
export async function updateDomainAction(
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
      error: 'Domain ID is required.',
      timestamp: Date.now(),
    };
  }

  const rawInput: Record<string, unknown> = {};

  const index = formData.get('index');
  if (index !== null) rawInput.index = index;

  const title = formData.get('title');
  if (title !== null) rawInput.title = title;

  try {
    const useCase = CompositionRoot.getUpdateDomainUseCase();
    const result = await useCase.execute(id, rawInput);

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Validation failed. Please correct the highlighted fields.',
        errors: result.errors,
        timestamp: Date.now(),
      };
    }

    revalidatePath('/admin/domains');
    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: 'Domain updated successfully.',
      id: result.data.id,
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred while updating domain.',
      timestamp: Date.now(),
    };
  }
}

/**
 * Server Action: Delete Domain
 */
export async function deleteDomainAction(id: string): Promise<ActionResult> {
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
      error: 'Domain ID is required.',
      timestamp: Date.now(),
    };
  }

  try {
    const useCase = CompositionRoot.getDeleteDomainUseCase();
    const result = await useCase.execute(id);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to delete domain.',
        timestamp: Date.now(),
      };
    }

    revalidatePath('/admin/domains');
    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: 'Domain deleted successfully.',
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred while deleting domain.',
      timestamp: Date.now(),
    };
  }
}

/**
 * Server Action: Reorder Domains
 */
export async function reorderDomainsAction(orderedIds: string[]): Promise<ActionResult> {
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
      error: 'orderedIds must be an array of domain IDs.',
      timestamp: Date.now(),
    };
  }

  try {
    const useCase = CompositionRoot.getReorderDomainsUseCase();
    const result = await useCase.execute(orderedIds);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to reorder domains.',
        timestamp: Date.now(),
      };
    }

    revalidatePath('/admin/domains');
    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: 'Domains reordered successfully.',
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred while reordering domains.',
      timestamp: Date.now(),
    };
  }
}
