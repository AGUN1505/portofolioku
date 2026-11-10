// app/admin/(dashboard)/pillars/actions.ts
// Server Actions for Pillars CMS module (Create, Update, Delete, Reorder)
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
 * Server Action: Create Pillar
 */
export async function createPillarAction(
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
    description: formData.get('description'),
  };

  try {
    const useCase = CompositionRoot.getCreatePillarUseCase();
    const result = await useCase.execute(rawInput);

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Validation failed. Please correct the highlighted fields.',
        errors: result.errors,
        timestamp: Date.now(),
      };
    }

    revalidatePath('/admin/pillars');
    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: 'Pillar created successfully.',
      id: result.data.id,
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred while creating pillar.',
      timestamp: Date.now(),
    };
  }
}

/**
 * Server Action: Update Pillar
 */
export async function updatePillarAction(
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
      error: 'Pillar ID is required.',
      timestamp: Date.now(),
    };
  }

  const rawInput: Record<string, unknown> = {};

  const index = formData.get('index');
  if (index !== null) rawInput.index = index;

  const title = formData.get('title');
  if (title !== null) rawInput.title = title;

  const description = formData.get('description');
  if (description !== null) rawInput.description = description;

  try {
    const useCase = CompositionRoot.getUpdatePillarUseCase();
    const result = await useCase.execute(id, rawInput);

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Validation failed. Please correct the highlighted fields.',
        errors: result.errors,
        timestamp: Date.now(),
      };
    }

    revalidatePath('/admin/pillars');
    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: 'Pillar updated successfully.',
      id: result.data.id,
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred while updating pillar.',
      timestamp: Date.now(),
    };
  }
}

/**
 * Server Action: Delete Pillar
 */
export async function deletePillarAction(id: string): Promise<ActionResult> {
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
      error: 'Pillar ID is required.',
      timestamp: Date.now(),
    };
  }

  try {
    const useCase = CompositionRoot.getDeletePillarUseCase();
    const result = await useCase.execute(id);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to delete pillar.',
        timestamp: Date.now(),
      };
    }

    revalidatePath('/admin/pillars');
    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: 'Pillar deleted successfully.',
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred while deleting pillar.',
      timestamp: Date.now(),
    };
  }
}

/**
 * Server Action: Reorder Pillars
 */
export async function reorderPillarsAction(orderedIds: string[]): Promise<ActionResult> {
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
      error: 'orderedIds must be an array of pillar IDs.',
      timestamp: Date.now(),
    };
  }

  try {
    const useCase = CompositionRoot.getReorderPillarsUseCase();
    const result = await useCase.execute(orderedIds);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to reorder pillars.',
        timestamp: Date.now(),
      };
    }

    revalidatePath('/admin/pillars');
    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: 'Pillars reordered successfully.',
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred while reordering pillars.',
      timestamp: Date.now(),
    };
  }
}
