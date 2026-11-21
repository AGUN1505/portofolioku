// app/admin/(dashboard)/certificates/CertificateListClient.tsx
'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  createCertificateAction,
  updateCertificateAction,
  deleteCertificateAction,
  reorderCertificatesAction,
  type ActionFormState,
} from './actions';
import type { Certificate } from '../../../../src/domain/entities/certificate';

interface CertificateListClientProps {
  readonly initialCertificates: readonly Certificate[];
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

function formatDateForInput(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

export function CertificateListClient({ initialCertificates }: CertificateListClientProps) {
  const router = useRouter();
  const [certificates, setCertificates] = useState<readonly Certificate[]>(initialCertificates);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState<Certificate | null>(null);
  const [certificateToDelete, setCertificateToDelete] = useState<Certificate | null>(null);

  // Form states & errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [modalError, setModalError] = useState<string | null>(null);

  // Local file selection preview names
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const createFileInputRef = useRef<HTMLInputElement | null>(null);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);

  const isAnyModalOpen =
    isCreateOpen || editingCertificate !== null || certificateToDelete !== null;

  // Window Escape key handler
  useEffect(() => {
    if (!isAnyModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isPending) {
        setIsCreateOpen(false);
        setEditingCertificate(null);
        setCertificateToDelete(null);
        setSelectedFileName(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAnyModalOpen, isPending]);

  // Reorder handler
  const handleReorder = (currentIndex: number, direction: 'up' | 'down') => {
    if (isPending) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= certificates.length) return;

    const reordered = [...certificates];
    const temp = reordered[currentIndex];
    reordered[currentIndex] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    setCertificates(reordered);
    setFeedback(null);

    const orderedIds = reordered.map((c) => c.id);

    startTransition(async () => {
      const result = await reorderCertificatesAction(orderedIds);
      if (result.success) {
        setFeedback({ type: 'success', message: 'Certificate order updated successfully.' });
        router.refresh();
      } else {
        setCertificates(initialCertificates);
        setFeedback({
          type: 'error',
          message: result.error || 'Failed to update certificate order.',
        });
      }
    });
  };

  // Delete handler
  const confirmDelete = () => {
    if (!certificateToDelete || isPending) return;
    const { id, title } = certificateToDelete;

    startTransition(async () => {
      const result = await deleteCertificateAction(id);
      if (result.success) {
        setCertificates((prev) => prev.filter((c) => c.id !== id));
        setFeedback({
          type: 'success',
          message: `Certificate "${title}" deleted successfully.`,
        });
        setCertificateToDelete(null);
        router.refresh();
      } else {
        setFeedback({
          type: 'error',
          message: result.error || `Failed to delete certificate "${title}".`,
        });
        setCertificateToDelete(null);
      }
    });
  };

  // Create submission
  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormErrors({});
    setModalError(null);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result: ActionFormState = await createCertificateAction({ success: false }, formData);
      if (result.success) {
        const createdCertificate = result.data;
        if (createdCertificate) {
          setCertificates((prev) =>
            [...prev, createdCertificate].sort((a, b) => a.order - b.order)
          );
        }
        setFeedback({ type: 'success', message: 'Certificate created successfully.' });
        setIsCreateOpen(false);
        setSelectedFileName(null);
        router.refresh();
      } else {
        setModalError(result.error || 'Failed to create certificate.');
        if (result.errors) setFormErrors(result.errors);
      }
    });
  };

  // Edit submission
  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCertificate) return;
    setFormErrors({});
    setModalError(null);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result: ActionFormState = await updateCertificateAction(
        editingCertificate.id,
        { success: false },
        formData
      );
      if (result.success) {
        const updatedCertificate = result.data;
        if (updatedCertificate) {
          setCertificates((prev) =>
            prev.map((c) => (c.id === updatedCertificate.id ? updatedCertificate : c))
          );
        }
        setFeedback({ type: 'success', message: 'Certificate updated successfully.' });
        setEditingCertificate(null);
        setSelectedFileName(null);
        router.refresh();
      } else {
        setModalError(result.error || 'Failed to update certificate.');
        if (result.errors) setFormErrors(result.errors);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Action Notification Banner */}
      {feedback && (
        <div
          role="alert"
          className={`p-4 text-xs font-mono border flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-[#EBF7EE] text-[#1B5E20] border-[#A5D6A7]'
              : 'bg-[#FDEDEC] text-[#B71C1C] border-[#F5C6CB]'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs uppercase font-bold hover:underline"
          >
            [Close]
          </button>
        </div>
      )}

      {/* Verification & Storage Policy Note */}
      <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
        <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-primary)] font-semibold block mb-1">
          Authentic Credential Policy
        </span>
        Certificates are securely persisted to local storage (<code className="font-mono text-[var(--text-primary)]">/public/uploads/certificates/</code>) with magic-byte header inspection and MIME verification (PDF, PNG, JPEG, WEBP). External credential links are verified upon submission.
      </div>

      {/* Main Table / Empty State */}
      {certificates.length === 0 ? (
        <div className="bg-white border border-[var(--border-subtle)] p-12 text-center space-y-3">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-secondary)]">
            No Certificates Configured
          </p>
          <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
            When 0 certificates exist, the public portfolio gracefully omits the credentials section without placeholder entries. Add your first certified credential below.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setFormErrors({});
                setModalError(null);
                setSelectedFileName(null);
                setIsCreateOpen(true);
              }}
              className="px-5 py-2.5 bg-[var(--text-primary)] text-white text-xs font-mono tracking-widest uppercase hover:bg-black transition-colors"
            >
              + Create First Certificate
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[var(--border-subtle)] overflow-hidden">
          <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
            <span className="font-mono text-xs uppercase text-[var(--text-secondary)]">
              Total Certificates: {certificates.length}
            </span>
            <button
              type="button"
              onClick={() => {
                setFormErrors({});
                setModalError(null);
                setSelectedFileName(null);
                setIsCreateOpen(true);
              }}
              className="px-4 py-2 bg-[var(--text-primary)] text-white text-xs font-mono tracking-widest uppercase hover:bg-black transition-colors"
            >
              + Add Certificate
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">
                  <th scope="col" className="py-3 px-4 w-24 text-center">
                    Order
                  </th>
                  <th scope="col" className="py-3 px-4">
                    Title &amp; Issuer
                  </th>
                  <th scope="col" className="py-3 px-4 w-36">
                    Issue Date
                  </th>
                  <th scope="col" className="py-3 px-4 w-44">
                    Credential ID
                  </th>
                  <th scope="col" className="py-3 px-4 w-32 text-center">
                    Document
                  </th>
                  <th scope="col" className="py-3 px-4 w-40 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-xs">
                {certificates.map((cert, index) => {
                  const isFirst = index === 0;
                  const isLast = index === certificates.length - 1;
                  const isPdf = cert.fileUrl.toLowerCase().endsWith('.pdf');

                  return (
                    <tr key={cert.id} className="hover:bg-[var(--bg-primary)] transition-colors">
                      {/* Order Controls */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">
                            #{cert.order}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleReorder(index, 'up')}
                              disabled={isFirst || isPending}
                              aria-label={`Move certificate "${cert.title}" up`}
                              title="Move Up"
                              className="p-1 text-[11px] border border-[var(--border-subtle)] bg-white hover:bg-[var(--bg-surface)] disabled:opacity-30 disabled:cursor-not-allowed leading-none"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReorder(index, 'down')}
                              disabled={isLast || isPending}
                              aria-label={`Move certificate "${cert.title}" down`}
                              title="Move Down"
                              className="p-1 text-[11px] border border-[var(--border-subtle)] bg-white hover:bg-[var(--bg-surface)] disabled:opacity-30 disabled:cursor-not-allowed leading-none"
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Title & Issuer */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="font-semibold text-sm text-[var(--text-primary)]">
                            {cert.title}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs px-2 py-0.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--accent-cobalt)] font-medium">
                              {cert.issuer}
                            </span>
                            <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                              ID: {cert.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Issue Date */}
                      <td className="py-4 px-4 font-mono text-xs text-[var(--text-secondary)]">
                        {formatDate(cert.issueDate)}
                      </td>

                      {/* Credential ID & Link */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          {cert.credentialId ? (
                            <span className="font-mono text-xs text-[var(--text-primary)] break-all">
                              {cert.credentialId}
                            </span>
                          ) : (
                            <span className="font-mono text-xs text-[var(--text-secondary)] italic">
                              —
                            </span>
                          )}
                          {cert.credentialUrl && (
                            <div>
                              <a
                                href={cert.credentialUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] font-mono text-[var(--accent-cobalt)] hover:underline inline-flex items-center gap-0.5"
                              >
                                Verify Link ↗
                              </a>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Document Badge / Link */}
                      <td className="py-4 px-4 text-center">
                        <a
                          href={cert.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--accent-cobalt)] text-[var(--text-primary)] transition-colors"
                        >
                          <span className="font-semibold text-[var(--accent-cobalt)]">
                            {isPdf ? 'PDF' : 'IMG'}
                          </span>
                          <span>↗</span>
                        </a>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setFormErrors({});
                              setModalError(null);
                              setSelectedFileName(null);
                              setEditingCertificate(cert);
                            }}
                            disabled={isPending}
                            className="px-3 py-1.5 text-xs font-mono uppercase border border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] transition-colors disabled:opacity-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setCertificateToDelete(cert)}
                            disabled={isPending}
                            className="px-3 py-1.5 text-xs font-mono uppercase text-[#B71C1C] border border-[#F5C6CB] hover:bg-[#FDEDEC] transition-colors disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-certificate-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="bg-white border border-[var(--border-subtle)] w-full max-w-lg p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h2
                id="create-certificate-modal-title"
                className="text-base font-bold text-[var(--text-primary)]"
              >
                Add New Certificate
              </h2>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-xs font-mono text-[var(--text-secondary)] hover:text-black"
              >
                [ESC]
              </button>
            </div>

            {modalError && (
              <div className="p-3 text-xs bg-[#FDEDEC] text-[#B71C1C] border border-[#F5C6CB]">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="create-cert-title"
                  className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1"
                >
                  Certificate Title * (e.g. &quot;Backend Systems Engineering with Go&quot;)
                </label>
                <input
                  id="create-cert-title"
                  name="title"
                  type="text"
                  required
                  maxLength={200}
                  placeholder="e.g. Cloud & Distributed Architecture"
                  className="w-full text-xs p-2.5 border border-[var(--border-subtle)] focus:border-[var(--accent-cobalt)] outline-none"
                />
                {formErrors.title && (
                  <p className="text-[11px] text-[#B71C1C] mt-1">{formErrors.title}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="create-cert-issuer"
                  className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1"
                >
                  Issuer Organization * (e.g. &quot;Linux Foundation&quot;, &quot;Dicoding&quot;)
                </label>
                <input
                  id="create-cert-issuer"
                  name="issuer"
                  type="text"
                  required
                  maxLength={200}
                  placeholder="e.g. Dicoding Indonesia"
                  className="w-full text-xs p-2.5 border border-[var(--border-subtle)] focus:border-[var(--accent-cobalt)] outline-none"
                />
                {formErrors.issuer && (
                  <p className="text-[11px] text-[#B71C1C] mt-1">{formErrors.issuer}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="create-cert-date"
                    className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1"
                  >
                    Issue Date (Optional)
                  </label>
                  <input
                    id="create-cert-date"
                    name="issueDate"
                    type="date"
                    className="w-full text-xs p-2.5 border border-[var(--border-subtle)] focus:border-[var(--accent-cobalt)] outline-none font-mono"
                  />
                  {formErrors.issueDate && (
                    <p className="text-[11px] text-[#B71C1C] mt-1">{formErrors.issueDate}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="create-cert-credential-id"
                    className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1"
                  >
                    Credential ID (Optional)
                  </label>
                  <input
                    id="create-cert-credential-id"
                    name="credentialId"
                    type="text"
                    maxLength={100}
                    placeholder="e.g. CERT-2026-X99"
                    className="w-full text-xs p-2.5 border border-[var(--border-subtle)] focus:border-[var(--accent-cobalt)] outline-none font-mono"
                  />
                  {formErrors.credentialId && (
                    <p className="text-[11px] text-[#B71C1C] mt-1">{formErrors.credentialId}</p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="create-cert-credential-url"
                  className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1"
                >
                  Credential Verification URL (Optional)
                </label>
                <input
                  id="create-cert-credential-url"
                  name="credentialUrl"
                  type="url"
                  placeholder="https://verify.example.org/credential/..."
                  className="w-full text-xs p-2.5 border border-[var(--border-subtle)] focus:border-[var(--accent-cobalt)] outline-none"
                />
                {formErrors.credentialUrl && (
                  <p className="text-[11px] text-[#B71C1C] mt-1">{formErrors.credentialUrl}</p>
                )}
              </div>

              {/* Certificate File Upload Input */}
              <div className="p-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2">
                <label
                  htmlFor="create-cert-file"
                  className="block text-xs font-mono uppercase text-[var(--text-primary)] font-semibold"
                >
                  Upload Certificate File * (PDF, PNG, JPG, WEBP — Max 5MB)
                </label>
                <input
                  ref={createFileInputRef}
                  id="create-cert-file"
                  name="file"
                  type="file"
                  required
                  accept=".pdf,application/pdf,image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    setSelectedFileName(f ? `${f.name} (${(f.size / 1024).toFixed(1)} KB)` : null);
                  }}
                  className="w-full text-xs font-mono text-[var(--text-secondary)] file:mr-3 file:py-1.5 file:px-3 file:border file:border-[var(--border-subtle)] file:text-xs file:font-mono file:bg-white file:text-[var(--text-primary)] hover:file:bg-[var(--bg-primary)] cursor-pointer"
                />
                {selectedFileName && (
                  <p className="text-[11px] font-mono text-[var(--accent-cobalt)]">
                    Selected: {selectedFileName}
                  </p>
                )}
                {formErrors.file && (
                  <p className="text-[11px] text-[#B71C1C] mt-1">{formErrors.file}</p>
                )}
                {formErrors.fileUrl && (
                  <p className="text-[11px] text-[#B71C1C] mt-1">{formErrors.fileUrl}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setSelectedFileName(null);
                  }}
                  className="px-4 py-2 text-xs font-mono uppercase border border-[var(--border-subtle)] hover:bg-[var(--bg-surface)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 text-xs font-mono uppercase bg-[var(--text-primary)] text-white hover:bg-black disabled:opacity-50"
                >
                  {isPending ? 'Uploading & Creating...' : 'Create Certificate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingCertificate && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-certificate-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="bg-white border border-[var(--border-subtle)] w-full max-w-lg p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h2
                id="edit-certificate-modal-title"
                className="text-base font-bold text-[var(--text-primary)]"
              >
                Edit Certificate
              </h2>
              <button
                type="button"
                onClick={() => {
                  setEditingCertificate(null);
                  setSelectedFileName(null);
                }}
                className="text-xs font-mono text-[var(--text-secondary)] hover:text-black"
              >
                [ESC]
              </button>
            </div>

            {modalError && (
              <div className="p-3 text-xs bg-[#FDEDEC] text-[#B71C1C] border border-[#F5C6CB]">
                {modalError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="edit-cert-title"
                  className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1"
                >
                  Certificate Title *
                </label>
                <input
                  id="edit-cert-title"
                  name="title"
                  type="text"
                  required
                  maxLength={200}
                  defaultValue={editingCertificate.title}
                  className="w-full text-xs p-2.5 border border-[var(--border-subtle)] focus:border-[var(--accent-cobalt)] outline-none"
                />
                {formErrors.title && (
                  <p className="text-[11px] text-[#B71C1C] mt-1">{formErrors.title}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="edit-cert-issuer"
                  className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1"
                >
                  Issuer Organization *
                </label>
                <input
                  id="edit-cert-issuer"
                  name="issuer"
                  type="text"
                  required
                  maxLength={200}
                  defaultValue={editingCertificate.issuer}
                  className="w-full text-xs p-2.5 border border-[var(--border-subtle)] focus:border-[var(--accent-cobalt)] outline-none"
                />
                {formErrors.issuer && (
                  <p className="text-[11px] text-[#B71C1C] mt-1">{formErrors.issuer}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="edit-cert-date"
                    className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1"
                  >
                    Issue Date (Optional)
                  </label>
                  <input
                    id="edit-cert-date"
                    name="issueDate"
                    type="date"
                    defaultValue={formatDateForInput(editingCertificate.issueDate)}
                    className="w-full text-xs p-2.5 border border-[var(--border-subtle)] focus:border-[var(--accent-cobalt)] outline-none font-mono"
                  />
                  {formErrors.issueDate && (
                    <p className="text-[11px] text-[#B71C1C] mt-1">{formErrors.issueDate}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="edit-cert-credential-id"
                    className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1"
                  >
                    Credential ID (Optional)
                  </label>
                  <input
                    id="edit-cert-credential-id"
                    name="credentialId"
                    type="text"
                    maxLength={100}
                    defaultValue={editingCertificate.credentialId ?? ''}
                    placeholder="e.g. CERT-2026-X99"
                    className="w-full text-xs p-2.5 border border-[var(--border-subtle)] focus:border-[var(--accent-cobalt)] outline-none font-mono"
                  />
                  {formErrors.credentialId && (
                    <p className="text-[11px] text-[#B71C1C] mt-1">{formErrors.credentialId}</p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="edit-cert-credential-url"
                  className="block text-xs font-mono uppercase text-[var(--text-secondary)] mb-1"
                >
                  Credential Verification URL (Optional)
                </label>
                <input
                  id="edit-cert-credential-url"
                  name="credentialUrl"
                  type="url"
                  defaultValue={editingCertificate.credentialUrl ?? ''}
                  placeholder="https://verify.example.org/credential/..."
                  className="w-full text-xs p-2.5 border border-[var(--border-subtle)] focus:border-[var(--accent-cobalt)] outline-none"
                />
                {formErrors.credentialUrl && (
                  <p className="text-[11px] text-[#B71C1C] mt-1">{formErrors.credentialUrl}</p>
                )}
              </div>

              {/* Certificate File Replacement / Existing File */}
              <div className="p-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2">
                <label
                  htmlFor="edit-cert-file"
                  className="block text-xs font-mono uppercase text-[var(--text-primary)] font-semibold"
                >
                  Certificate File (Leave empty to retain existing file)
                </label>
                <div className="text-[11px] font-mono text-[var(--text-secondary)] flex items-center justify-between">
                  <span>Current: {editingCertificate.fileUrl}</span>
                  <a
                    href={editingCertificate.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--accent-cobalt)] hover:underline"
                  >
                    View Current ↗
                  </a>
                </div>
                <input
                  ref={editFileInputRef}
                  id="edit-cert-file"
                  name="file"
                  type="file"
                  accept=".pdf,application/pdf,image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    setSelectedFileName(f ? `${f.name} (${(f.size / 1024).toFixed(1)} KB)` : null);
                  }}
                  className="w-full text-xs font-mono text-[var(--text-secondary)] file:mr-3 file:py-1.5 file:px-3 file:border file:border-[var(--border-subtle)] file:text-xs file:font-mono file:bg-white file:text-[var(--text-primary)] hover:file:bg-[var(--bg-primary)] cursor-pointer"
                />
                {selectedFileName && (
                  <p className="text-[11px] font-mono text-[var(--accent-cobalt)]">
                    New File Selected: {selectedFileName}
                  </p>
                )}
                {formErrors.file && (
                  <p className="text-[11px] text-[#B71C1C] mt-1">{formErrors.file}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => {
                    setEditingCertificate(null);
                    setSelectedFileName(null);
                  }}
                  className="px-4 py-2 text-xs font-mono uppercase border border-[var(--border-subtle)] hover:bg-[var(--bg-surface)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 text-xs font-mono uppercase bg-[var(--text-primary)] text-white hover:bg-black disabled:opacity-50"
                >
                  {isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {certificateToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-certificate-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="bg-white border border-[var(--border-subtle)] w-full max-w-md p-6 space-y-4 shadow-xl">
            <h2
              id="delete-certificate-modal-title"
              className="text-base font-bold text-[#B71C1C]"
            >
              Confirm Delete Certificate
            </h2>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Are you sure you want to permanently delete certificate{' '}
              <strong className="text-[var(--text-primary)]">
                &quot;{certificateToDelete.title}&quot;
              </strong>{' '}
              issued by {certificateToDelete.issuer} (ID: {certificateToDelete.id})? The associated document file will also be removed. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setCertificateToDelete(null)}
                disabled={isPending}
                className="px-4 py-2 text-xs font-mono uppercase border border-[var(--border-subtle)] hover:bg-[var(--bg-surface)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isPending}
                className="px-4 py-2 text-xs font-mono uppercase bg-[#B71C1C] text-white hover:bg-red-800 disabled:opacity-50"
              >
                {isPending ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
