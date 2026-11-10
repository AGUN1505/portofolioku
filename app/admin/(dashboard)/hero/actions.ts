// app/admin/(dashboard)/hero/actions.ts
// Server Action for updating Hero Profile Singleton

'use server';

import { revalidatePath } from 'next/cache';
import { verifySession, UnauthorizedException } from '../../../../src/infrastructure/auth/dal';
import { CompositionRoot } from '../../../../src/infrastructure/composition-root';

export interface HeroFormState {
  readonly success: boolean;
  readonly message?: string;
  readonly error?: string;
  readonly errors?: Record<string, string>;
  readonly timestamp?: number;
}

export async function updateHeroProfileAction(
  _prevState: HeroFormState,
  formData: FormData
): Promise<HeroFormState> {
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

  // 2. Extract whitelist fields only (ignore id, createdAt, updatedAt, etc.)
  const rawInput: Record<string, unknown> = {
    name: formData.get('name'),
    tagline: formData.get('tagline'),
    bio: formData.get('bio'),
    country: formData.get('country'),
    code: formData.get('code'),
    timezone: formData.get('timezone'),
    discipline: formData.get('discipline'),
  };

  // 3. Execute Application Use Case
  try {
    const useCase = CompositionRoot.getUpdateHeroProfileUseCase();
    const result = await useCase.execute(rawInput);

    if (!result.success) {
      return {
        success: false,
        error: 'Validation failed. Please correct the highlighted fields.',
        errors: result.errors,
        timestamp: Date.now(),
      };
    }

    revalidatePath('/admin/hero');
    revalidatePath('/admin');

    return {
      success: true,
      message: 'Hero profile updated successfully.',
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('[updateHeroProfileAction] Failed:', error);
    return {
      success: false,
      error: 'An unexpected server error occurred while updating the profile.',
      timestamp: Date.now(),
    };
  }
}
