// app/admin/(dashboard)/projects/actions.ts
// Server Actions for Projects CMS module (Create, Update, Delete, Reorder)
// Enforces strict server-side session authorization via DAL verifySession(),
// DTO validation, and file upload via ProjectUploadService.

'use server';

import { revalidatePath } from 'next/cache';
import { verifySession, UnauthorizedException } from '../../../../src/infrastructure/auth/dal';
import { CompositionRoot } from '../../../../src/infrastructure/composition-root';
import { ProjectUploadService } from '../../../../src/infrastructure/storage/upload.service';
import { isSupabaseStorageUrl } from '../../../../src/infrastructure/storage/supabase-storage.service';

export interface ProjectFormState {
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
 * Helper to parse technologies input into string[]
 * Accepts comma-separated values or JSON string.
 */
function parseTechnologies(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item).trim()).filter(Boolean);
        }
      } catch {
        // Fall back to comma-separated splitting
      }
    }
    return trimmed
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Server Action: Create Project
 * Handles uploaded thumbnail file via ProjectUploadService, parses fields,
 * validates DTO, executes CreateProjectUseCase, and revalidates cache.
 */
export async function createProjectAction(
  arg1: ProjectFormState | FormData,
  arg2?: FormData
): Promise<ProjectFormState> {
  const formData = arg1 instanceof FormData ? arg1 : (arg2 as FormData);

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

  // 2. Extract and handle thumbnail upload
  let uploadedThumbnailUrl: string | undefined = undefined;
  const fileEntry = formData.get('thumbnailFile');

  if (fileEntry instanceof File && fileEntry.size > 0 && fileEntry.name !== '') {
    const uploadRes = await ProjectUploadService.upload(fileEntry);
    if (!uploadRes.success || !uploadRes.fileUrl) {
      return {
        success: false,
        error: uploadRes.error || 'Failed to upload project thumbnail.',
        errors: { thumbnailFile: uploadRes.error || 'Invalid file provided.' },
        timestamp: Date.now(),
      };
    }
    uploadedThumbnailUrl = uploadRes.fileUrl;
  }

  const rawThumbnail = formData.get('thumbnailUrl');
  let finalThumbnailUrl: string | null = null;
  if (uploadedThumbnailUrl) {
    finalThumbnailUrl = uploadedThumbnailUrl;
  } else if (rawThumbnail !== null && rawThumbnail !== '') {
    finalThumbnailUrl = typeof rawThumbnail === 'string' ? rawThumbnail.trim() : String(rawThumbnail).trim();
  }

  // 3. Extract whitelist fields only (ignore id, createdAt, updatedAt, publishedAt)
  const technologiesRaw = formData.get('technologies');
  const technologies = parseTechnologies(technologiesRaw);

  const rawProjectUrl = formData.get('projectUrl');
  const rawGithubUrl = formData.get('githubUrl');
  const rawPublished = formData.get('published');

  const rawInput: Record<string, unknown> = {
    title: formData.get('title'),
    category: formData.get('category'),
    description: formData.get('description'),
    technologies,
    thumbnailUrl: finalThumbnailUrl,
    projectUrl: rawProjectUrl === null || rawProjectUrl === '' ? null : rawProjectUrl,
    githubUrl: rawGithubUrl === null || rawGithubUrl === '' ? null : rawGithubUrl,
    published: rawPublished === 'true' || rawPublished === 'on' || rawPublished === '1',
  };

  // 4. Execute Application Use Case
  try {
    const useCase = CompositionRoot.getCreateProjectUseCase();
    const result = await useCase.execute(rawInput);

    if (!result.success || !result.data) {
      if (
        uploadedThumbnailUrl &&
        (uploadedThumbnailUrl.startsWith('/uploads/projects/') || isSupabaseStorageUrl(uploadedThumbnailUrl))
      ) {
        await ProjectUploadService.deleteByUrl(uploadedThumbnailUrl);
      }
      return {
        success: false,
        error: result.error || 'Validation failed. Please correct the highlighted fields.',
        errors: result.errors,
        timestamp: Date.now(),
      };
    }

    revalidatePath('/admin/projects');
    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: 'Project created successfully.',
      id: result.data.id,
      timestamp: Date.now(),
    };
  } catch (err) {
    if (
      uploadedThumbnailUrl &&
      (uploadedThumbnailUrl.startsWith('/uploads/projects/') || isSupabaseStorageUrl(uploadedThumbnailUrl))
    ) {
      await ProjectUploadService.deleteByUrl(uploadedThumbnailUrl);
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred while creating project.',
      timestamp: Date.now(),
    };
  }
}

/**
 * Server Action: Update Project
 * Supports uploading a new thumbnailFile (cleaning up old uploaded file if replaced or removed)
 * while preserving existing thumbnailUrl if no new file is uploaded.
 */
export async function updateProjectAction(
  id: string,
  arg2: ProjectFormState | FormData,
  arg3?: FormData
): Promise<ProjectFormState> {
  const formData = arg2 instanceof FormData ? arg2 : (arg3 as FormData);

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
      error: 'Project ID is required.',
      timestamp: Date.now(),
    };
  }

  // 2. Fetch existing project to support preserving existing thumbnailUrl and cleaning up old files
  const repo = CompositionRoot.getProjectRepository();
  const existing = await repo.getById(id);
  if (!existing) {
    return {
      success: false,
      error: 'Project not found.',
      timestamp: Date.now(),
    };
  }

  // 3. Extract and handle thumbnail upload / replacement / removal / preservation
  const fileEntry = formData.get('thumbnailFile');
  let newUploadedThumbnailUrl: string | undefined = undefined;
  let finalThumbnailUrl: string | null = existing.thumbnailUrl ?? null;
  let shouldCleanupOldFile = false;

  if (fileEntry instanceof File && fileEntry.size > 0 && fileEntry.name !== '') {
    const uploadRes = await ProjectUploadService.upload(fileEntry);
    if (!uploadRes.success || !uploadRes.fileUrl) {
      return {
        success: false,
        error: uploadRes.error || 'Failed to upload new project thumbnail.',
        errors: { thumbnailFile: uploadRes.error || 'Invalid file provided.' },
        timestamp: Date.now(),
      };
    }
    newUploadedThumbnailUrl = uploadRes.fileUrl;
    finalThumbnailUrl = newUploadedThumbnailUrl;
    shouldCleanupOldFile = true;
  } else {
    // No new file is uploaded: support removal, custom URL, or preservation of existing
    const removeThumbnail =
      formData.get('removeThumbnail') === 'true' || formData.get('removeThumbnail') === '1';

    if (removeThumbnail) {
      finalThumbnailUrl = null;
      shouldCleanupOldFile = true;
    } else {
      const rawThumbnail = formData.get('thumbnailUrl');
      if (rawThumbnail !== null) {
        const trimmed = typeof rawThumbnail === 'string' ? rawThumbnail.trim() : String(rawThumbnail).trim();
        if (trimmed.length > 0) {
          finalThumbnailUrl = trimmed;
          if (existing.thumbnailUrl && existing.thumbnailUrl !== trimmed) {
            shouldCleanupOldFile = true;
          }
        } else {
          // Explicitly cleared string (e.g. user clicked remove in form)
          finalThumbnailUrl = null;
          shouldCleanupOldFile = true;
        }
      } else {
        // Not provided in formData: strictly preserve existing thumbnailUrl
        finalThumbnailUrl = existing.thumbnailUrl ?? null;
      }
    }
  }

  // 4. Extract whitelist fields only
  const technologiesRaw = formData.get('technologies');
  const technologies = parseTechnologies(technologiesRaw);

  const rawProjectUrl = formData.get('projectUrl');
  const rawGithubUrl = formData.get('githubUrl');
  const rawPublished = formData.get('published');

  const rawInput: Record<string, unknown> = {
    title: formData.get('title'),
    category: formData.get('category'),
    description: formData.get('description'),
    technologies,
    thumbnailUrl: finalThumbnailUrl,
    projectUrl: rawProjectUrl === null || rawProjectUrl === '' ? null : rawProjectUrl,
    githubUrl: rawGithubUrl === null || rawGithubUrl === '' ? null : rawGithubUrl,
    published: rawPublished === 'true' || rawPublished === 'on' || rawPublished === '1',
  };

  // 5. Execute Application Use Case
  try {
    const useCase = CompositionRoot.getUpdateProjectUseCase();
    const result = await useCase.execute(id, rawInput);

    if (!result.success) {
      if (
        newUploadedThumbnailUrl &&
        (newUploadedThumbnailUrl.startsWith('/uploads/projects/') || isSupabaseStorageUrl(newUploadedThumbnailUrl))
      ) {
        await ProjectUploadService.deleteByUrl(newUploadedThumbnailUrl);
      }
      return {
        success: false,
        error: result.error || 'Validation failed. Please correct the highlighted fields.',
        errors: result.errors,
        timestamp: Date.now(),
      };
    }

    // Clean up old uploaded file if replaced or removed
    if (
      shouldCleanupOldFile &&
      existing.thumbnailUrl &&
      (existing.thumbnailUrl.startsWith('/uploads/projects/') || isSupabaseStorageUrl(existing.thumbnailUrl)) &&
      existing.thumbnailUrl !== finalThumbnailUrl
    ) {
      await ProjectUploadService.deleteByUrl(existing.thumbnailUrl);
    }

    revalidatePath('/admin/projects');
    revalidatePath(`/admin/projects/${id}`);
    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: 'Project updated successfully.',
      id,
      timestamp: Date.now(),
    };
  } catch (err) {
    if (
      newUploadedThumbnailUrl &&
      (newUploadedThumbnailUrl.startsWith('/uploads/projects/') || isSupabaseStorageUrl(newUploadedThumbnailUrl))
    ) {
      await ProjectUploadService.deleteByUrl(newUploadedThumbnailUrl);
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred while updating project.',
      timestamp: Date.now(),
    };
  }
}

/**
 * Server Action: Delete Project
 * Deletes associated uploaded thumbnail file from disk if it was stored in /uploads/projects/.
 */
export async function deleteProjectAction(id: string): Promise<ActionResult> {
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
      error: 'Project ID is required.',
      timestamp: Date.now(),
    };
  }

  try {
    const repo = CompositionRoot.getProjectRepository();
    const existing = await repo.getById(id);

    const useCase = CompositionRoot.getDeleteProjectUseCase();
    const result = await useCase.execute(id);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to delete project.',
        timestamp: Date.now(),
      };
    }

    // Delete associated uploaded thumbnail file from disk/storage
    if (
      existing?.thumbnailUrl &&
      (existing.thumbnailUrl.startsWith('/uploads/projects/') || isSupabaseStorageUrl(existing.thumbnailUrl))
    ) {
      await ProjectUploadService.deleteByUrl(existing.thumbnailUrl);
    }

    revalidatePath('/admin/projects');
    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: 'Project deleted successfully.',
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred while deleting project.',
      timestamp: Date.now(),
    };
  }
}

/**
 * Server Action: Reorder Projects
 */
export async function reorderProjectsAction(orderedIds: string[]): Promise<ActionResult> {
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
      error: 'orderedIds must be an array of project IDs.',
      timestamp: Date.now(),
    };
  }

  try {
    const useCase = CompositionRoot.getReorderProjectsUseCase();
    const result = await useCase.execute(orderedIds);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to reorder projects.',
        timestamp: Date.now(),
      };
    }

    revalidatePath('/admin/projects');
    revalidatePath('/admin');
    revalidatePath('/');

    return {
      success: true,
      message: 'Projects reordered successfully.',
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred while reordering projects.',
      timestamp: Date.now(),
    };
  }
}
