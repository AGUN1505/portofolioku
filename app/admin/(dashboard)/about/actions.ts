// app/admin/(dashboard)/about/actions.ts
// Server Action for updating About Profile Singleton

'use server';

import { revalidatePath } from 'next/cache';
import { verifySession, UnauthorizedException } from '../../../../src/infrastructure/auth/dal';
import { CompositionRoot } from '../../../../src/infrastructure/composition-root';

export interface AboutFormState {
  readonly success: boolean;
  readonly message?: string;
  readonly error?: string;
  readonly errors?: Record<string, string>;
  readonly timestamp?: number;
}

export async function updateAboutProfileAction(
  _prevState: AboutFormState,
  formData: FormData
): Promise<AboutFormState> {
  try {
    // 1. Authoritative session check
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

  // 2. Extract whitelist fields only
  const rawInput: Record<string, unknown> = {
    heading: formData.get('heading'),
    quote: formData.get('quote'),
    primaryNarrative: formData.get('primaryNarrative'),
    secondaryNarrative: formData.get('secondaryNarrative'),
  };

  // 3. Execute Application Use Case
  try {
    const useCase = CompositionRoot.getUpdateAboutProfileUseCase();
    const result = await useCase.execute(rawInput);

    if (!result.success) {
      return {
        success: false,
        error: 'Validation failed. Please correct the highlighted fields.',
        errors: result.errors,
        timestamp: Date.now(),
      };
    }

    revalidatePath('/admin/about');
    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: 'About profile updated successfully.',
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('[updateAboutProfileAction] Failed:', error);
    return {
      success: false,
      error: 'An unexpected server error occurred while updating the profile.',
      timestamp: Date.now(),
    };
  }
}
