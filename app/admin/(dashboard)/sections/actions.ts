// app/admin/(dashboard)/sections/actions.ts
// Server Actions for Section Configs CMS module (Reorder)
// Enforces strict server-side session authorization via DAL verifySession().

'use server';

import { revalidatePath } from 'next/cache';
import { verifySession, UnauthorizedException } from '../../../../src/infrastructure/auth/dal';
import { CompositionRoot } from '../../../../src/infrastructure/composition-root';

export interface ActionResult {
  readonly success: boolean;
  readonly message?: string;
  readonly error?: string;
  readonly timestamp?: number;
}

/**
 * Server Action: Reorder Section Configs
 * Enforces session verification and revalidates /admin/sections, /admin, and /.
 */
export async function reorderSectionConfigsAction(orderedIds: string[]): Promise<ActionResult> {
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
      error: 'orderedIds must be an array of section IDs.',
      timestamp: Date.now(),
    };
  }

  try {
    const useCase = CompositionRoot.getReorderSectionConfigsUseCase();
    const result = await useCase.execute(orderedIds);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to reorder section configs.',
        timestamp: Date.now(),
      };
    }

    revalidatePath('/admin/sections');
    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: 'Section order updated successfully.',
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while reordering section configs.',
      timestamp: Date.now(),
    };
  }
}
