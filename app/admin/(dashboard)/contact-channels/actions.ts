// app/admin/(dashboard)/contact-channels/actions.ts
// Server Actions for Contact Channels CMS module (Create, Update, Delete, Reorder)
// Enforces strict server-side session authorization via DAL verifySession().

'use server';

import { revalidatePath } from 'next/cache';
import { verifySession, UnauthorizedException } from '../../../../src/infrastructure/auth/dal';
import { CompositionRoot } from '../../../../src/infrastructure/composition-root';
import type { ContactChannelRecord } from '../../../../src/domain/entities/contact-channel-record';

export interface ActionFormState {
  readonly success: boolean;
  readonly message?: string;
  readonly error?: string;
  readonly errors?: Record<string, string>;
  readonly id?: string;
  readonly data?: ContactChannelRecord;
  readonly timestamp?: number;
}

export interface ActionResult {
  readonly success: boolean;
  readonly message?: string;
  readonly error?: string;
  readonly timestamp?: number;
}

/**
 * Server Action: Create ContactChannel
 */
export async function createContactChannelAction(
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

  const rawInput: Record<string, unknown> = {
    label: formData.get('label'),
    value: formData.get('value'),
  };

  try {
    const useCase = CompositionRoot.getCreateContactChannelUseCase();
    const result = await useCase.execute(rawInput);

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Validation failed. Please correct the highlighted fields.',
        errors: result.errors,
        timestamp: Date.now(),
      };
    }

    revalidatePath('/admin/contact-channels');
    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: 'Contact channel created successfully.',
      id: result.data.id,
      data: result.data,
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while creating contact channel.',
      timestamp: Date.now(),
    };
  }
}

/**
 * Server Action: Update ContactChannel
 */
export async function updateContactChannelAction(
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
      error: 'Contact channel ID is required.',
      timestamp: Date.now(),
    };
  }

  const rawInput: Record<string, unknown> = {};

  const label = formData.get('label');
  if (label !== null) rawInput.label = label;

  const value = formData.get('value');
  if (value !== null) rawInput.value = value;

  try {
    const useCase = CompositionRoot.getUpdateContactChannelUseCase();
    const result = await useCase.execute(id, rawInput);

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Validation failed. Please correct the highlighted fields.',
        errors: result.errors,
        timestamp: Date.now(),
      };
    }

    revalidatePath('/admin/contact-channels');
    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: 'Contact channel updated successfully.',
      id: result.data.id,
      data: result.data,
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while updating contact channel.',
      timestamp: Date.now(),
    };
  }
}

/**
 * Server Action: Delete ContactChannel
 */
export async function deleteContactChannelAction(id: string): Promise<ActionResult> {
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
      error: 'Contact channel ID is required.',
      timestamp: Date.now(),
    };
  }

  try {
    const useCase = CompositionRoot.getDeleteContactChannelUseCase();
    const result = await useCase.execute(id);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to delete contact channel.',
        timestamp: Date.now(),
      };
    }

    revalidatePath('/admin/contact-channels');
    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: 'Contact channel deleted successfully.',
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while deleting contact channel.',
      timestamp: Date.now(),
    };
  }
}

/**
 * Server Action: Reorder ContactChannels
 */
export async function reorderContactChannelsAction(orderedIds: string[]): Promise<ActionResult> {
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
      error: 'orderedIds must be an array of contact channel IDs.',
      timestamp: Date.now(),
    };
  }

  try {
    const useCase = CompositionRoot.getReorderContactChannelsUseCase();
    const result = await useCase.execute(orderedIds);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to reorder contact channels.',
        timestamp: Date.now(),
      };
    }

    revalidatePath('/admin/contact-channels');
    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: 'Contact channels reordered successfully.',
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while reordering contact channels.',
      timestamp: Date.now(),
    };
  }
}
