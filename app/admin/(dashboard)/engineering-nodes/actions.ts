// app/admin/(dashboard)/engineering-nodes/actions.ts
// Server Actions for Engineering Nodes CMS module (Create, Update, Delete, Reorder)
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
 * Server Action: Create Engineering Node
 */
export async function createEngineeringNodeAction(
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

  const rawStack = formData.get('stack');
  const rawHighlighted = formData.get('highlighted');

  const rawInput = {
    tag: formData.get('tag'),
    title: formData.get('title'),
    description: formData.get('description'),
    stack: rawStack === null || rawStack === '' ? null : rawStack,
    highlighted: rawHighlighted === 'true' || rawHighlighted === 'on' || rawHighlighted === '1',
  };

  try {
    const useCase = CompositionRoot.getCreateEngineeringNodeUseCase();
    const result = await useCase.execute(rawInput);

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Validation failed. Please correct the highlighted fields.',
        errors: result.errors,
        timestamp: Date.now(),
      };
    }

    revalidatePath('/admin/engineering-nodes');
    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: 'Engineering node created successfully.',
      id: result.data.id,
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred while creating engineering node.',
      timestamp: Date.now(),
    };
  }
}

/**
 * Server Action: Update Engineering Node
 */
export async function updateEngineeringNodeAction(
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
      error: 'Engineering node ID is required.',
      timestamp: Date.now(),
    };
  }

  const rawInput: Record<string, unknown> = {};

  const tag = formData.get('tag');
  if (tag !== null) rawInput.tag = tag;

  const title = formData.get('title');
  if (title !== null) rawInput.title = title;

  const description = formData.get('description');
  if (description !== null) rawInput.description = description;

  if (formData.has('stack')) {
    const rawStack = formData.get('stack');
    rawInput.stack = rawStack === null || rawStack === '' ? null : rawStack;
  }

  if (formData.has('highlighted')) {
    const rawHighlighted = formData.get('highlighted');
    rawInput.highlighted = rawHighlighted === 'true' || rawHighlighted === 'on' || rawHighlighted === '1';
  }

  try {
    const useCase = CompositionRoot.getUpdateEngineeringNodeUseCase();
    const result = await useCase.execute(id, rawInput);

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Validation failed. Please correct the highlighted fields.',
        errors: result.errors,
        timestamp: Date.now(),
      };
    }

    revalidatePath('/admin/engineering-nodes');
    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: 'Engineering node updated successfully.',
      id: result.data.id,
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred while updating engineering node.',
      timestamp: Date.now(),
    };
  }
}

/**
 * Server Action: Delete Engineering Node
 */
export async function deleteEngineeringNodeAction(id: string): Promise<ActionResult> {
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
      error: 'Engineering node ID is required.',
      timestamp: Date.now(),
    };
  }

  try {
    const useCase = CompositionRoot.getDeleteEngineeringNodeUseCase();
    const result = await useCase.execute(id);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to delete engineering node.',
        timestamp: Date.now(),
      };
    }

    revalidatePath('/admin/engineering-nodes');
    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: 'Engineering node deleted successfully.',
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred while deleting engineering node.',
      timestamp: Date.now(),
    };
  }
}

/**
 * Server Action: Reorder Engineering Nodes
 */
export async function reorderEngineeringNodesAction(orderedIds: string[]): Promise<ActionResult> {
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
      error: 'orderedIds must be an array of engineering node IDs.',
      timestamp: Date.now(),
    };
  }

  try {
    const useCase = CompositionRoot.getReorderEngineeringNodesUseCase();
    const result = await useCase.execute(orderedIds);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to reorder engineering nodes.',
        timestamp: Date.now(),
      };
    }

    revalidatePath('/admin/engineering-nodes');
    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: 'Engineering nodes reordered successfully.',
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred while reordering engineering nodes.',
      timestamp: Date.now(),
    };
  }
}
