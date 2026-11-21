// app/admin/(dashboard)/certificates/actions.ts
// Server Actions for Certificates CMS module (Create, Update, Delete, Reorder)
// Enforces strict server-side session authorization via DAL verifySession()
// and handles file upload via CertificateUploadService.

'use server';

import { revalidatePath } from 'next/cache';
import { verifySession, UnauthorizedException } from '../../../../src/infrastructure/auth/dal';
import { CompositionRoot } from '../../../../src/infrastructure/composition-root';
import { CertificateUploadService } from '../../../../src/infrastructure/storage/upload.service';
import type { Certificate } from '../../../../src/domain/entities/certificate';

export interface ActionFormState {
  readonly success: boolean;
  readonly message?: string;
  readonly error?: string;
  readonly errors?: Record<string, string>;
  readonly id?: string;
  readonly data?: Certificate;
  readonly timestamp?: number;
}

export interface ActionResult {
  readonly success: boolean;
  readonly message?: string;
  readonly error?: string;
  readonly timestamp?: number;
}

/**
 * Server Action: Create Certificate
 * Handles uploaded certificate file via CertificateUploadService, parses fields, validates DTO, executes CreateCertificateUseCase.
 */
export async function createCertificateAction(
  arg1: ActionFormState | FormData,
  arg2?: FormData
): Promise<ActionFormState> {
  const formData = arg1 instanceof FormData ? arg1 : (arg2 as FormData);

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

  let fileUrl: string | undefined = undefined;

  // Handle uploaded file
  const fileEntry = formData.get('file');
  if (fileEntry instanceof File && fileEntry.size > 0) {
    const uploadRes = await CertificateUploadService.upload(fileEntry);
    if (!uploadRes.success || !uploadRes.fileUrl) {
      return {
        success: false,
        error: uploadRes.error || 'Failed to upload certificate file.',
        errors: { file: uploadRes.error || 'Invalid file provided.' },
        timestamp: Date.now(),
      };
    }
    fileUrl = uploadRes.fileUrl;
  } else {
    const directFileUrl = formData.get('fileUrl');
    if (typeof directFileUrl === 'string' && directFileUrl.trim()) {
      fileUrl = directFileUrl.trim();
    }
  }

  const rawInput: Record<string, unknown> = {
    title: formData.get('title'),
    issuer: formData.get('issuer'),
    fileUrl,
  };

  const issueDate = formData.get('issueDate');
  if (issueDate !== null && issueDate !== '') {
    rawInput.issueDate = issueDate;
  }

  const credentialId = formData.get('credentialId');
  if (credentialId !== null && credentialId !== '') {
    rawInput.credentialId = credentialId;
  }

  const credentialUrl = formData.get('credentialUrl');
  if (credentialUrl !== null && credentialUrl !== '') {
    rawInput.credentialUrl = credentialUrl;
  }

  try {
    const useCase = CompositionRoot.getCreateCertificateUseCase();
    const result = await useCase.execute(rawInput);

    if (!result.success || !result.data) {
      if (fileUrl && fileUrl.startsWith('/uploads/certificates')) {
        await CertificateUploadService.deleteByUrl(fileUrl);
      }
      return {
        success: false,
        error: result.error || 'Validation failed. Please correct the highlighted fields.',
        errors: result.errors,
        timestamp: Date.now(),
      };
    }

    revalidatePath('/admin/certificates');
    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: 'Certificate created successfully.',
      id: result.data.id,
      data: result.data,
      timestamp: Date.now(),
    };
  } catch (err) {
    if (fileUrl && fileUrl.startsWith('/uploads/certificates')) {
      await CertificateUploadService.deleteByUrl(fileUrl);
    }
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while creating certificate.',
      timestamp: Date.now(),
    };
  }
}

/**
 * Server Action: Update Certificate
 * Handles optional updated certificate file, executes UpdateCertificateUseCase.
 */
export async function updateCertificateAction(
  id: string,
  arg2: ActionFormState | FormData,
  arg3?: FormData
): Promise<ActionFormState> {
  const formData = arg2 instanceof FormData ? arg2 : (arg3 as FormData);

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
      error: 'Certificate ID is required.',
      timestamp: Date.now(),
    };
  }

  const rawInput: Record<string, unknown> = {};

  const title = formData.get('title');
  if (title !== null) rawInput.title = title;

  const issuer = formData.get('issuer');
  if (issuer !== null) rawInput.issuer = issuer;

  const issueDate = formData.get('issueDate');
  if (issueDate !== null) rawInput.issueDate = issueDate;

  const credentialId = formData.get('credentialId');
  if (credentialId !== null) rawInput.credentialId = credentialId;

  const credentialUrl = formData.get('credentialUrl');
  if (credentialUrl !== null) rawInput.credentialUrl = credentialUrl;

  // Handle optional new file upload
  const fileEntry = formData.get('file');
  let newUploadedFileUrl: string | undefined = undefined;

  if (fileEntry instanceof File && fileEntry.size > 0) {
    const uploadRes = await CertificateUploadService.upload(fileEntry);
    if (!uploadRes.success || !uploadRes.fileUrl) {
      return {
        success: false,
        error: uploadRes.error || 'Failed to upload new certificate file.',
        errors: { file: uploadRes.error || 'Invalid file provided.' },
        timestamp: Date.now(),
      };
    }
    newUploadedFileUrl = uploadRes.fileUrl;
    rawInput.fileUrl = newUploadedFileUrl;
  } else {
    const fileUrl = formData.get('fileUrl');
    if (fileUrl !== null && typeof fileUrl === 'string' && fileUrl.trim()) {
      rawInput.fileUrl = fileUrl.trim();
    }
  }

  try {
    const repo = CompositionRoot.getCertificateRepository();
    const existing = await repo.findById(id);

    const useCase = CompositionRoot.getUpdateCertificateUseCase();
    const result = await useCase.execute(id, rawInput);

    if (!result.success || !result.data) {
      if (newUploadedFileUrl) {
        await CertificateUploadService.deleteByUrl(newUploadedFileUrl);
      }
      return {
        success: false,
        error: result.error || 'Validation failed. Please correct the highlighted fields.',
        errors: result.errors,
        timestamp: Date.now(),
      };
    }

    // If new file uploaded and differs from existing file, clean up old file
    if (newUploadedFileUrl && existing?.fileUrl && existing.fileUrl !== newUploadedFileUrl) {
      await CertificateUploadService.deleteByUrl(existing.fileUrl);
    }

    revalidatePath('/admin/certificates');
    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: 'Certificate updated successfully.',
      id: result.data.id,
      data: result.data,
      timestamp: Date.now(),
    };
  } catch (err) {
    if (newUploadedFileUrl) {
      await CertificateUploadService.deleteByUrl(newUploadedFileUrl);
    }
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while updating certificate.',
      timestamp: Date.now(),
    };
  }
}

/**
 * Server Action: Delete Certificate
 */
export async function deleteCertificateAction(id: string): Promise<ActionResult> {
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
      error: 'Certificate ID is required.',
      timestamp: Date.now(),
    };
  }

  try {
    const repo = CompositionRoot.getCertificateRepository();
    const existing = await repo.findById(id);

    const useCase = CompositionRoot.getDeleteCertificateUseCase();
    const result = await useCase.execute(id);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to delete certificate.',
        timestamp: Date.now(),
      };
    }

    // Delete local file if it exists
    if (existing?.fileUrl) {
      await CertificateUploadService.deleteByUrl(existing.fileUrl);
    }

    revalidatePath('/admin/certificates');
    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: 'Certificate deleted successfully.',
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while deleting certificate.',
      timestamp: Date.now(),
    };
  }
}

/**
 * Server Action: Reorder Certificates
 */
export async function reorderCertificatesAction(orderedIds: string[]): Promise<ActionResult> {
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
      error: 'orderedIds must be an array of certificate IDs.',
      timestamp: Date.now(),
    };
  }

  try {
    const useCase = CompositionRoot.getReorderCertificatesUseCase();
    const result = await useCase.execute(orderedIds);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to reorder certificates.',
        timestamp: Date.now(),
      };
    }

    revalidatePath('/admin/certificates');
    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: 'Certificates reordered successfully.',
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while reordering certificates.',
      timestamp: Date.now(),
    };
  }
}
