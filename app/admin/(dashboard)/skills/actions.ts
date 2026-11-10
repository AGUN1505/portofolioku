// app/admin/(dashboard)/skills/actions.ts
// Server Actions for Skills and Skill Categories CMS module (CRUD & Reorder)
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
  readonly requiresConfirmation?: boolean;
  readonly childCount?: number;
  readonly timestamp?: number;
}

// ============================================================================
// SKILL CATEGORY ACTIONS
// ============================================================================

/**
 * Server Action: Create Skill Category
 */
export async function createSkillCategoryAction(
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
    title: formData.get('title'),
  };

  try {
    const useCase = CompositionRoot.getCreateSkillCategoryUseCase();
    const result = await useCase.execute(rawInput);

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Validation failed. Please correct the highlighted fields.',
        errors: result.errors,
        timestamp: Date.now(),
      };
    }

    revalidatePath('/admin/skills');
    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: 'Skill category created successfully.',
      id: result.data.id,
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred while creating category.',
      timestamp: Date.now(),
    };
  }
}

/**
 * Server Action: Update Skill Category
 */
export async function updateSkillCategoryAction(
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
      error: 'Category ID is required.',
      timestamp: Date.now(),
    };
  }

  const rawInput: Record<string, unknown> = {};
  const title = formData.get('title');
  if (title !== null) rawInput.title = title;

  try {
    const useCase = CompositionRoot.getUpdateSkillCategoryUseCase();
    const result = await useCase.execute(id, rawInput);

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Validation failed. Please correct the highlighted fields.',
        errors: result.errors,
        timestamp: Date.now(),
      };
    }

    revalidatePath('/admin/skills');
    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: 'Skill category updated successfully.',
      id: result.data.id,
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred while updating category.',
      timestamp: Date.now(),
    };
  }
}

/**
 * Server Action: Delete Skill Category (with cascade guard & confirmation)
 */
export async function deleteSkillCategoryAction(
  id: string,
  confirmed: boolean = false,
  expectedChildCount?: number
): Promise<ActionResult> {
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
      error: 'Category ID is required.',
      timestamp: Date.now(),
    };
  }

  try {
    const useCase = CompositionRoot.getDeleteSkillCategoryUseCase();
    const result = await useCase.execute(id, confirmed, expectedChildCount);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to delete category.',
        requiresConfirmation: result.requiresConfirmation,
        childCount: result.affectedSkillCount,
        timestamp: Date.now(),
      };
    }

    revalidatePath('/admin/skills');
    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: 'Skill category deleted successfully.',
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred while deleting category.',
      timestamp: Date.now(),
    };
  }
}

/**
 * Server Action: Reorder Skill Categories
 */
export async function reorderSkillCategoriesAction(orderedIds: string[]): Promise<ActionResult> {
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
      error: 'orderedIds must be an array of category IDs.',
      timestamp: Date.now(),
    };
  }

  try {
    const useCase = CompositionRoot.getReorderSkillCategoriesUseCase();
    const result = await useCase.execute(orderedIds);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to reorder categories.',
        timestamp: Date.now(),
      };
    }

    revalidatePath('/admin/skills');
    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: 'Skill categories reordered successfully.',
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred while reordering categories.',
      timestamp: Date.now(),
    };
  }
}

// ============================================================================
// SKILL ACTIONS
// ============================================================================

/**
 * Server Action: Create Skill
 */
export async function createSkillAction(
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
    name: formData.get('name'),
    categoryId: formData.get('categoryId'),
  };

  try {
    const useCase = CompositionRoot.getCreateSkillUseCase();
    const result = await useCase.execute(rawInput);

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Validation failed. Please correct the highlighted fields.',
        errors: result.errors,
        timestamp: Date.now(),
      };
    }

    revalidatePath('/admin/skills');
    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: 'Skill created successfully.',
      id: result.data.id,
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred while creating skill.',
      timestamp: Date.now(),
    };
  }
}

/**
 * Server Action: Update Skill
 */
export async function updateSkillAction(
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
      error: 'Skill ID is required.',
      timestamp: Date.now(),
    };
  }

  const rawInput: Record<string, unknown> = {};

  const name = formData.get('name');
  if (name !== null) rawInput.name = name;

  const categoryId = formData.get('categoryId');
  if (categoryId !== null) rawInput.categoryId = categoryId;

  try {
    const useCase = CompositionRoot.getUpdateSkillUseCase();
    const result = await useCase.execute(id, rawInput);

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Validation failed. Please correct the highlighted fields.',
        errors: result.errors,
        timestamp: Date.now(),
      };
    }

    revalidatePath('/admin/skills');
    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: 'Skill updated successfully.',
      id: result.data.id,
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred while updating skill.',
      timestamp: Date.now(),
    };
  }
}

/**
 * Server Action: Delete Skill
 */
export async function deleteSkillAction(id: string): Promise<ActionResult> {
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
      error: 'Skill ID is required.',
      timestamp: Date.now(),
    };
  }

  try {
    const useCase = CompositionRoot.getDeleteSkillUseCase();
    const result = await useCase.execute(id);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to delete skill.',
        timestamp: Date.now(),
      };
    }

    revalidatePath('/admin/skills');
    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: 'Skill deleted successfully.',
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred while deleting skill.',
      timestamp: Date.now(),
    };
  }
}

/**
 * Server Action: Reorder Skills within a Category
 */
export async function reorderSkillsAction(
  categoryId: string,
  orderedIds: string[]
): Promise<ActionResult> {
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

  if (!categoryId || typeof categoryId !== 'string') {
    return {
      success: false,
      error: 'Category ID is required.',
      timestamp: Date.now(),
    };
  }

  if (!Array.isArray(orderedIds)) {
    return {
      success: false,
      error: 'orderedIds must be an array of skill IDs.',
      timestamp: Date.now(),
    };
  }

  try {
    const useCase = CompositionRoot.getReorderSkillsUseCase();
    const result = await useCase.execute(categoryId, orderedIds);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to reorder skills.',
        timestamp: Date.now(),
      };
    }

    revalidatePath('/admin/skills');
    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: 'Skills reordered successfully.',
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred while reordering skills.',
      timestamp: Date.now(),
    };
  }
}
