// app/admin/(dashboard)/projects/actions.ts
// Server Actions for Projects CMS module (Create, Update, Delete, Reorder)
// Enforces strict server-side session authorization via DAL verifySession() and DTO validation.

'use server';

import { revalidatePath } from 'next/cache';
import { verifySession, UnauthorizedException } from '../../../../src/infrastructure/auth/dal';
import { CompositionRoot } from '../../../../src/infrastructure/composition-root';

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
 */
export async function createProjectAction(
  _prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
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

  // 2. Extract whitelist fields only (ignore id, createdAt, updatedAt, publishedAt)
  const technologiesRaw = formData.get('technologies');
  const technologies = parseTechnologies(technologiesRaw);

  const rawThumbnail = formData.get('thumbnailUrl');
  const rawProjectUrl = formData.get('projectUrl');
  const rawGithubUrl = formData.get('githubUrl');
  const rawPublished = formData.get('published');

  const rawInput: Record<string, unknown> = {
    title: formData.get('title'),
    category: formData.get('category'),
    description: formData.get('description'),
    technologies,
    thumbnailUrl: rawThumbnail === null || rawThumbnail === '' ? null : rawThumbnail,
    projectUrl: rawProjectUrl === null || rawProjectUrl === '' ? null : rawProjectUrl,
    githubUrl: rawGithubUrl === null || rawGithubUrl === '' ? null : rawGithubUrl,
    published: rawPublished === 'true' || rawPublished === 'on' || rawPublished === '1',
  };

  // 3. Execute Application Use Case
  try {
    const useCase = CompositionRoot.getCreateProjectUseCase();
    const result = await useCase.execute(rawInput);

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Validation failed. Please correct the highlighted fields.',
        errors: result.errors,
        timestamp: Date.now(),
      };
    }

    revalidatePath('/admin/projects');
    revalidatePath('/admin');

    return {
      success: true,
      message: 'Project created successfully.',
      id: result.data.id,
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred while creating project.',
      timestamp: Date.now(),
    };
  }
}

/**
 * Server Action: Update Project
 */
export async function updateProjectAction(
  id: string,
  _prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
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

  // 2. Extract whitelist fields only
  const technologiesRaw = formData.get('technologies');
  const technologies = parseTechnologies(technologiesRaw);

  const rawThumbnail = formData.get('thumbnailUrl');
  const rawProjectUrl = formData.get('projectUrl');
  const rawGithubUrl = formData.get('githubUrl');
  const rawPublished = formData.get('published');

  const rawInput: Record<string, unknown> = {
    title: formData.get('title'),
    category: formData.get('category'),
    description: formData.get('description'),
    technologies,
    thumbnailUrl: rawThumbnail === null || rawThumbnail === '' ? null : rawThumbnail,
    projectUrl: rawProjectUrl === null || rawProjectUrl === '' ? null : rawProjectUrl,
    githubUrl: rawGithubUrl === null || rawGithubUrl === '' ? null : rawGithubUrl,
    published: rawPublished === 'true' || rawPublished === 'on' || rawPublished === '1',
  };

  // 3. Execute Application Use Case
  try {
    const useCase = CompositionRoot.getUpdateProjectUseCase();
    const result = await useCase.execute(id, rawInput);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Validation failed. Please correct the highlighted fields.',
        errors: result.errors,
        timestamp: Date.now(),
      };
    }

    revalidatePath('/admin/projects');
    revalidatePath(`/admin/projects/${id}`);
    revalidatePath('/admin');

    return {
      success: true,
      message: 'Project updated successfully.',
      id,
      timestamp: Date.now(),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred while updating project.',
      timestamp: Date.now(),
    };
  }
}

/**
 * Server Action: Delete Project
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
    const useCase = CompositionRoot.getDeleteProjectUseCase();
    const result = await useCase.execute(id);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to delete project.',
        timestamp: Date.now(),
      };
    }

    revalidatePath('/admin/projects');
    revalidatePath('/admin');

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
