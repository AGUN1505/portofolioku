// app/admin/(dashboard)/experiences/actions.ts
// Server Actions for Experiences CMS module (Create, Update, Delete, Reorder)
// Enforces strict server-side session authorization via DAL verifySession() and DTO validation.

'use server';

import { revalidatePath } from 'next/cache';
import { verifySession, UnauthorizedException } from '../../../../src/infrastructure/auth/dal';
import { CompositionRoot } from '../../../../src/infrastructure/composition-root';

export interface ExperienceFormState {
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
 * Server Action: Create Experience
 */
export async function createExperienceAction(
  _prevState: ExperienceFormState,
  formData: FormData
): Promise<ExperienceFormState> {
  // 1. Authoritative session check
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

  // 2. Extract whitelist fields only (ignore id, createdAt, updatedAt, order)
  const isOngoingRaw = formData.get('isOngoing');
  const isOngoing = isOngoingRaw === 'true' || isOngoingRaw === 'on' || isOngoingRaw === '1';

  const rawDescription = formData.get('description');
  const rawStartDate = formData.get('startDate');
  const rawEndDate = formData.get('endDate');

  // If ongoing is enabled, endDate is explicitly null. Otherwise, pass string or null.
  const endDate = isOngoing ? null : (rawEndDate === null || rawEndDate === '' ? null : rawEndDate);

  const rawInput: Record<string, unknown> = {
    role: formData.get('role'),
    institution: formData.get('institution'),
    track: formData.get('track'),
    description: rawDescription === null || rawDescription === '' ? null : rawDescription,
    startDate: rawStartDate === null || rawStartDate === '' ? null : rawStartDate,
    endDate,
  };

  // 3. Execute Application Use Case
  try {
    const useCase = CompositionRoot.getCreateExperienceUseCase();
    const result = await useCase.execute(rawInput);

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Validation failed. Please correct the highlighted fields.',
        errors: result.errors,
        timestamp: Date.now(),
      };
    }

    revalidatePath('/admin/experiences');
    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: 'Experience created successfully.',
      id: result.data.id,
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred while creating experience.',
      timestamp: Date.now(),
    };
  }
}

/**
 * Server Action: Update Experience
 */
export async function updateExperienceAction(
  id: string,
  _prevState: ExperienceFormState,
  formData: FormData
): Promise<ExperienceFormState> {
  // 1. Authoritative session check
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
      error: 'Experience ID is required.',
      timestamp: Date.now(),
    };
  }

  // 2. Extract whitelist fields only
  const isOngoingRaw = formData.get('isOngoing');
  const isOngoing = isOngoingRaw === 'true' || isOngoingRaw === 'on' || isOngoingRaw === '1';

  const rawDescription = formData.get('description');
  const rawStartDate = formData.get('startDate');
  const rawEndDate = formData.get('endDate');

  const endDate = isOngoing ? null : (rawEndDate === null || rawEndDate === '' ? null : rawEndDate);

  const rawInput: Record<string, unknown> = {
    role: formData.get('role'),
    institution: formData.get('institution'),
    track: formData.get('track'),
    description: rawDescription === null || rawDescription === '' ? null : rawDescription,
    startDate: rawStartDate === null || rawStartDate === '' ? null : rawStartDate,
    endDate,
  };

  // 3. Execute Application Use Case
  try {
    const useCase = CompositionRoot.getUpdateExperienceUseCase();
    const result = await useCase.execute(id, rawInput);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Validation failed. Please correct the highlighted fields.',
        errors: result.errors,
        timestamp: Date.now(),
      };
    }

    revalidatePath('/admin/experiences');
    revalidatePath(`/admin/experiences/${id}`);
    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: 'Experience updated successfully.',
      id,
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred while updating experience.',
      timestamp: Date.now(),
    };
  }
}

/**
 * Server Action: Delete Experience
 */
export async function deleteExperienceAction(id: string): Promise<ActionResult> {
  // 1. Authoritative session check
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
      error: 'Experience ID is required.',
      timestamp: Date.now(),
    };
  }

  try {
    const useCase = CompositionRoot.getDeleteExperienceUseCase();
    const result = await useCase.execute(id);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to delete experience.',
        timestamp: Date.now(),
      };
    }

    revalidatePath('/admin/experiences');
    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: 'Experience deleted successfully.',
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred while deleting experience.',
      timestamp: Date.now(),
    };
  }
}

/**
 * Server Action: Reorder Experiences
 */
export async function reorderExperiencesAction(orderedIds: string[]): Promise<ActionResult> {
  // 1. Authoritative session check
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
      error: 'orderedIds must be an array of experience IDs.',
      timestamp: Date.now(),
    };
  }

  try {
    const useCase = CompositionRoot.getReorderExperiencesUseCase();
    const result = await useCase.execute(orderedIds);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to reorder experiences.',
        timestamp: Date.now(),
      };
    }

    revalidatePath('/admin/experiences');
    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: 'Experiences reordered successfully.',
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred while reordering experiences.',
      timestamp: Date.now(),
    };
  }
}
