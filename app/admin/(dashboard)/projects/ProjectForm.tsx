// app/admin/(dashboard)/projects/ProjectForm.tsx
'use client';

import { useActionState, useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createProjectAction, updateProjectAction, type ProjectFormState } from './actions';
import type { ProjectRecord } from '../../../../src/domain/entities/project-record';

interface ProjectFormProps {
  readonly mode: 'create' | 'edit';
  readonly initialData?: ProjectRecord;
}

const initialState: ProjectFormState = {
  success: false,
};

export function ProjectForm({ mode, initialData }: ProjectFormProps) {
  const router = useRouter();

  // Bind update action with ID if edit mode
  const boundAction =
    mode === 'edit' && initialData
      ? updateProjectAction.bind(null, initialData.id)
      : createProjectAction;

  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  // If creation was successful, redirect after brief delay or user interaction
  useEffect(() => {
    if (state.success && mode === 'create') {
      const timer = setTimeout(() => {
        router.push('/admin/projects');
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [state.success, mode, router]);

  const defaultTechnologies = initialData?.technologies
    ? initialData.technologies.join(', ')
    : '';

  // Local File Upload & Preview State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [directUrl, setDirectUrl] = useState<string>(initialData?.thumbnailUrl ?? '');
  const [isImageRemoved, setIsImageRemoved] = useState<boolean>(false);
  const [fileClientError, setFileClientError] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Clean up object URL when previewUrl changes or on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Handle local file selection with instant object URL preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileClientError(null);
    setImageLoadError(false);

    if (!file) {
      return;
    }

    // 5MB client-side boundary check
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setFileClientError(`File exceeds 5MB size limit (${(file.size / (1024 * 1024)).toFixed(2)} MB).`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
    setIsImageRemoved(false);
  };

  // Handle removing thumbnail (clears local selection and marks as removed)
  const handleRemoveImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setDirectUrl('');
    setIsImageRemoved(true);
    setImageLoadError(false);
    setFileClientError(null);
  };

  // Handle restoring saved initial thumbnail
  const handleRestoreInitial = () => {
    setIsImageRemoved(false);
    setDirectUrl(initialData?.thumbnailUrl ?? '');
    setImageLoadError(false);
    setFileClientError(null);
  };

  // Handle direct fallback URL input change
  const handleDirectUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDirectUrl(val);
    setImageLoadError(false);
    if (isImageRemoved && val.trim().length > 0) {
      setIsImageRemoved(false);
    }
  };

  // Active preview source: local object URL takes priority, then fallback direct URL if not removed
  const previewSource = previewUrl ?? (!isImageRemoved && directUrl.trim().length > 0 ? directUrl.trim() : null);

  return (
    <form action={formAction} encType="multipart/form-data" className="space-y-6">
      {/* Feedback Alerts */}
      {state.success && (
        <div
          role="status"
          className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-mono"
        >
          <span className="font-bold mr-2">SUCCESS:</span>
          {state.message || (mode === 'create' ? 'Project created successfully.' : 'Project updated successfully.')}
          {mode === 'create' && (
            <span className="block mt-1 text-emerald-700">Redirecting to projects list...</span>
          )}
        </div>
      )}

      {state.error && (
        <div
          role="alert"
          className="p-4 bg-red-50 border border-red-300 text-red-900 text-xs font-mono"
        >
          <span className="font-bold mr-2">ERROR:</span>
          {state.error}
        </div>
      )}

      {/* Mode & Metadata Header (Edit mode only) */}
      {mode === 'edit' && initialData && (
        <div className="p-3 bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[var(--text-secondary)]">
          <div>
            <span>ID: </span>
            <strong className="text-[var(--text-primary)]">{initialData.id}</strong>
            <span className="mx-2">•</span>
            <span>Display Order: </span>
            <strong className="text-[var(--text-primary)]">#{initialData.order}</strong>
          </div>
          <div>
            <span>Published At: </span>
            <strong className="text-[var(--text-primary)]">
              {initialData.publishedAt ? new Date(initialData.publishedAt).toLocaleString() : 'Not published'}
            </strong>
          </div>
        </div>
      )}

      {/* Field: Title */}
      <div className="space-y-1.5">
        <label
          htmlFor="project-title"
          className="block text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold"
        >
          Project Title <span className="text-[var(--accent-cobalt)]">*</span>
        </label>
        <input
          id="project-title"
          name="title"
          type="text"
          defaultValue={initialData?.title ?? ''}
          disabled={isPending}
          required
          placeholder="e.g. Water Reminder App"
          className="w-full px-3 py-2 bg-white border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-sans focus:outline-none focus:border-[var(--accent-cobalt)] disabled:opacity-60"
        />
        {state.errors?.title && (
          <p className="text-[11px] font-mono text-red-600 mt-1">{state.errors.title}</p>
        )}
      </div>

      {/* Field: Category */}
      <div className="space-y-1.5">
        <label
          htmlFor="project-category"
          className="block text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold"
        >
          Category <span className="text-[var(--accent-cobalt)]">*</span>
        </label>
        <input
          id="project-category"
          name="category"
          type="text"
          defaultValue={initialData?.category ?? ''}
          disabled={isPending}
          required
          placeholder="e.g. Mobile & REST API System"
          className="w-full px-3 py-2 bg-white border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-sans focus:outline-none focus:border-[var(--accent-cobalt)] disabled:opacity-60"
        />
        {state.errors?.category && (
          <p className="text-[11px] font-mono text-red-600 mt-1">{state.errors.category}</p>
        )}
      </div>

      {/* Field: Description */}
      <div className="space-y-1.5">
        <label
          htmlFor="project-description"
          className="block text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold"
        >
          Description <span className="text-[var(--accent-cobalt)]">*</span>
        </label>
        <textarea
          id="project-description"
          name="description"
          rows={4}
          defaultValue={initialData?.description ?? ''}
          disabled={isPending}
          required
          placeholder="Comprehensive project summary or technical case study narrative..."
          className="w-full px-3 py-2 bg-white border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-sans focus:outline-none focus:border-[var(--accent-cobalt)] disabled:opacity-60 leading-relaxed"
        />
        {state.errors?.description && (
          <p className="text-[11px] font-mono text-red-600 mt-1">{state.errors.description}</p>
        )}
      </div>

      {/* Field: Technologies */}
      <div className="space-y-1.5">
        <label
          htmlFor="project-technologies"
          className="block text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold"
        >
          Technologies <span className="text-[var(--accent-cobalt)]">*</span>
          <span className="text-[11px] font-normal lowercase tracking-normal text-[var(--text-secondary)] ml-2">
            (comma-separated, up to 20 tags)
          </span>
        </label>
        <input
          id="project-technologies"
          name="technologies"
          type="text"
          defaultValue={defaultTechnologies}
          disabled={isPending}
          required
          placeholder="Flutter, Laravel, REST API, PostgreSQL"
          className="w-full px-3 py-2 bg-white border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-sans focus:outline-none focus:border-[var(--accent-cobalt)] disabled:opacity-60"
        />
        {state.errors?.technologies && (
          <p className="text-[11px] font-mono text-red-600 mt-1">{state.errors.technologies}</p>
        )}
      </div>

      {/* Two-Column Grid for Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Field: Project URL */}
        <div className="space-y-1.5">
          <label
            htmlFor="project-projectUrl"
            className="block text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold"
          >
            Live Demo / Project URL
            <span className="text-[11px] font-normal lowercase tracking-normal text-[var(--text-secondary)] ml-1">
              (optional)
            </span>
          </label>
          <input
            id="project-projectUrl"
            name="projectUrl"
            type="url"
            defaultValue={initialData?.projectUrl ?? ''}
            disabled={isPending}
            placeholder="https://example.com"
            className="w-full px-3 py-2 bg-white border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-sans focus:outline-none focus:border-[var(--accent-cobalt)] disabled:opacity-60"
          />
          {state.errors?.projectUrl && (
            <p className="text-[11px] font-mono text-red-600 mt-1">{state.errors.projectUrl}</p>
          )}
        </div>

        {/* Field: GitHub URL */}
        <div className="space-y-1.5">
          <label
            htmlFor="project-githubUrl"
            className="block text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold"
          >
            Repository URL
            <span className="text-[11px] font-normal lowercase tracking-normal text-[var(--text-secondary)] ml-1">
              (optional)
            </span>
          </label>
          <input
            id="project-githubUrl"
            name="githubUrl"
            type="url"
            defaultValue={initialData?.githubUrl ?? ''}
            disabled={isPending}
            placeholder="https://github.com/agunfirmansyah/..."
            className="w-full px-3 py-2 bg-white border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-sans focus:outline-none focus:border-[var(--accent-cobalt)] disabled:opacity-60"
          />
          {state.errors?.githubUrl && (
            <p className="text-[11px] font-mono text-red-600 mt-1">{state.errors.githubUrl}</p>
          )}
        </div>
      </div>

      {/* Field: Project Thumbnail (Local File Upload & Fallback Direct URL) */}
      <div className="p-4 bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-4">
        {/* Section Header Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2.5">
          <div>
            <label
              htmlFor="project-thumbnailFile"
              className="block text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold"
            >
              Project Thumbnail
            </label>
            <p className="text-[11px] font-mono text-[var(--text-secondary)] mt-0.5">
              Upload local image or supply fallback URL. Supported formats: PNG, JPEG, WEBP, GIF, SVG (Max 5MB).
            </p>
          </div>
          {/* Status Badge */}
          {previewSource ? (
            <span
              className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 border ${
                selectedFile
                  ? 'border-[var(--accent-cobalt)] text-[var(--accent-cobalt)] bg-blue-50/50'
                  : 'border-[var(--border-subtle)] text-[var(--text-primary)] bg-white'
              }`}
            >
              {selectedFile ? '● Local File Staged' : '● Saved Thumbnail'}
            </span>
          ) : isImageRemoved ? (
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 border border-red-300 text-red-600 bg-red-50">
              ● Marked for Removal
            </span>
          ) : (
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 border border-[var(--border-subtle)] text-[var(--text-secondary)] bg-white">
              No Image
            </span>
          )}
        </div>

        {/* Removed Notification (when editing existing image and marked removed) */}
        {isImageRemoved && initialData?.thumbnailUrl && (
          <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-mono flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-bold mr-1.5">[REMOVED]</span>
              <span>Thumbnail image will be deleted upon saving.</span>
            </div>
            <button
              type="button"
              onClick={handleRestoreInitial}
              disabled={isPending}
              className="px-2.5 py-1 text-[11px] font-mono uppercase border border-amber-400 bg-white hover:bg-amber-100 text-amber-900 transition-colors"
            >
              Undo / Restore Image
            </button>
          </div>
        )}

        {/* Visual Preview Box */}
        {previewSource && (
          <div className="space-y-2">
            <div className="relative max-w-md w-full aspect-video bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-hidden flex items-center justify-center">
              {imageLoadError ? (
                <div className="p-4 text-center space-y-1 font-mono text-xs text-[var(--text-secondary)]">
                  <span className="block text-red-600 font-bold uppercase">Image Preview Failed</span>
                  <span className="block text-[10px] text-[var(--text-secondary)] break-all max-w-xs">
                    {previewSource}
                  </span>
                </div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={previewSource}
                  alt="Project thumbnail preview"
                  onError={() => setImageLoadError(true)}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* File / URL Metadata and Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="text-[11px] text-[var(--text-secondary)] truncate max-w-xs sm:max-w-md">
                {selectedFile ? (
                  <span>
                    <strong className="text-[var(--text-primary)]">{selectedFile.name}</strong>{' '}
                    ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                ) : (
                  <span className="truncate">
                    Current: <strong className="text-[var(--text-primary)]">{previewSource}</strong>
                  </span>
                )}
              </div>

              {/* Action Buttons: Replace & Remove */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isPending}
                  className="px-2.5 py-1 text-[11px] font-mono uppercase border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--text-primary)] hover:bg-white transition-colors"
                >
                  {selectedFile ? 'Change File' : 'Replace Image'}
                </button>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={isPending}
                  className="px-2.5 py-1 text-[11px] font-mono uppercase border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Local File Input */}
        <div className="space-y-1.5">
          <label
            htmlFor="project-thumbnailFile"
            className="block text-xs font-mono uppercase tracking-wider text-[var(--text-secondary)] font-medium"
          >
            Upload Local File
          </label>
          <input
            ref={fileInputRef}
            id="project-thumbnailFile"
            name="thumbnailFile"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            disabled={isPending}
            onChange={handleFileChange}
            className="w-full text-xs font-mono text-[var(--text-secondary)] file:mr-3 file:py-1.5 file:px-3 file:border file:border-[var(--border-subtle)] file:text-xs file:font-mono file:bg-white file:text-[var(--text-primary)] hover:file:bg-[var(--bg-primary)] cursor-pointer focus:outline-none focus:border-[var(--accent-cobalt)]"
          />
          {fileClientError && (
            <p className="text-[11px] font-mono text-red-600 mt-1">{fileClientError}</p>
          )}
          {state.errors?.thumbnailFile && (
            <p className="text-[11px] font-mono text-red-600 mt-1">{state.errors.thumbnailFile}</p>
          )}
        </div>

        {/* Fallback Direct URL Input */}
        <div className="pt-3 border-t border-[var(--border-subtle)] space-y-1.5">
          <label
            htmlFor="project-thumbnailUrl"
            className="block text-xs font-mono uppercase tracking-wider text-[var(--text-secondary)] font-medium"
          >
            Fallback Direct URL / Path
            <span className="text-[11px] font-normal lowercase tracking-normal text-[var(--text-secondary)] ml-1">
              (optional: /images/... or https://)
            </span>
          </label>
          <input
            id="project-thumbnailUrl"
            name="thumbnailUrl"
            type="text"
            value={directUrl}
            onChange={handleDirectUrlChange}
            disabled={isPending}
            placeholder="/images/projects/water-reminder.png"
            className="w-full px-3 py-2 bg-white border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-sans focus:outline-none focus:border-[var(--accent-cobalt)] disabled:opacity-60"
          />
          {state.errors?.thumbnailUrl && (
            <p className="text-[11px] font-mono text-red-600 mt-1">{state.errors.thumbnailUrl}</p>
          )}
        </div>
      </div>

      {/* Field: Published Toggle */}
      <div className="pt-2 border-t border-[var(--border-subtle)]">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="published"
            value="true"
            defaultChecked={initialData?.published ?? false}
            disabled={isPending}
            className="mt-0.5 h-4 w-4 border-[var(--border-subtle)] text-[var(--accent-cobalt)] focus:ring-[var(--accent-cobalt)]"
          />
          <div>
            <span className="block text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold">
              Published on Public Portfolio
            </span>
            <span className="block text-xs text-[var(--text-secondary)] mt-0.5">
              When checked, this project is visible to public visitors. Publication timestamp is managed automatically.
            </span>
          </div>
        </label>
      </div>

      {/* Actions Bar */}
      <div className="pt-5 border-t border-[var(--border-subtle)] flex items-center justify-between">
        <Link
          href="/admin/projects"
          className="px-4 py-2 text-xs font-mono tracking-wider uppercase border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2 bg-[var(--text-primary)] text-white text-xs font-mono tracking-widest uppercase hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isPending ? (
            <>
              <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
              <span>Saving...</span>
            </>
          ) : (
            <span>{mode === 'create' ? 'Create Project' : 'Save Changes'}</span>
          )}
        </button>
      </div>
    </form>
  );
}
