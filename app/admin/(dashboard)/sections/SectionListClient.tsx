// app/admin/(dashboard)/sections/SectionListClient.tsx
// Swiss International Styled Section Order Client Component
// Implements optimistic UI reordering, move Up/Down buttons, keyboard accessibility, and status feedback.

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { SectionConfig } from '../../../../src/domain/entities/section-config';
import { reorderSectionConfigsAction } from './actions';

interface SectionListClientProps {
  readonly initialSections: readonly SectionConfig[];
}

interface StatusFeedback {
  readonly type: 'success' | 'error';
  readonly message: string;
}

export function SectionListClient({ initialSections }: SectionListClientProps) {
  const router = useRouter();
  const [sections, setSections] = useState<readonly SectionConfig[]>(initialSections);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<StatusFeedback | null>(null);


  const handleReorder = (currentIndex: number, direction: 'up' | 'down') => {
    if (isPending) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const previousSections = sections;
    const reordered = [...sections];
    const temp = reordered[currentIndex];
    reordered[currentIndex] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    // Optimistically update order numbering
    const updated = reordered.map((item, index) => ({
      ...item,
      order: index + 1,
    }));

    setSections(updated);
    setFeedback(null);

    const orderedIds = updated.map((s) => s.id);

    startTransition(async () => {
      const result = await reorderSectionConfigsAction(orderedIds);
      if (result.success) {
        setFeedback({
          type: 'success',
          message: 'Section order updated successfully.',
        });
        router.refresh();
      } else {
        setSections(previousSections);
        setFeedback({
          type: 'error',
          message: result.error || 'Failed to update section order.',
        });
      }
    });
  };

  const handleRowKeyDown = (
    e: React.KeyboardEvent<HTMLTableRowElement>,
    index: number
  ) => {
    if (e.altKey && e.key === 'ArrowUp') {
      e.preventDefault();
      handleReorder(index, 'up');
    } else if (e.altKey && e.key === 'ArrowDown') {
      e.preventDefault();
      handleReorder(index, 'down');
    }
  };

  return (
    <section
      aria-label="Section Order Management"
      className="space-y-6"
    >
      {/* Status Feedback Banner */}
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`p-4 border flex items-center justify-between transition-colors ${
            feedback.type === 'success'
              ? 'bg-[#F0FDF4] border-[#86EFAC] text-[#15803D]'
              : 'bg-[#FEF2F2] border-[#FECACA] text-[#B91C1C]'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider">
              {feedback.type === 'success' ? '[STATUS: OK]' : '[STATUS: ERROR]'}
            </span>
            <span className="text-xs">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            aria-label="Close status feedback"
            className="text-xs font-mono uppercase font-bold tracking-wider hover:underline"
          >
            [Close]
          </button>
        </div>
      )}

      {/* Swiss Architectural Guidelines Card */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[11px] uppercase tracking-widest text-[var(--accent-cobalt)] font-semibold">
            ARCHITECTURAL SPECIFICATION // ORDER PROTOCOL
          </p>
          <span className="font-mono text-[10px] text-[var(--text-secondary)] uppercase">
            Strict Ascending Flow
          </span>
        </div>
        <p className="text-[var(--text-primary)] leading-relaxed">
          The sequence below determines the vertical rendering hierarchy of the public portfolio.
          Reordering takes effect immediately and updates server-side cache tags across all entrypoints.
        </p>
        <p className="font-mono text-[11px] text-[var(--text-secondary)]">
          KEYBOARD ACCESS: Focus any row and press{' '}
          <kbd className="px-1.5 py-0.5 bg-white border border-[var(--border-subtle)] rounded-none text-[10px] text-[var(--text-primary)]">
            Alt+Up
          </kbd>{' '}
          or{' '}
          <kbd className="px-1.5 py-0.5 bg-white border border-[var(--border-subtle)] rounded-none text-[10px] text-[var(--text-primary)]">
            Alt+Down
          </kbd>{' '}
          to swap positions.
        </p>
      </div>

      {/* Main Collection Table */}
      {sections.length === 0 ? (
        <div className="bg-white border border-[var(--border-subtle)] p-12 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-secondary)]">
            No Section Configurations Found
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-2">
            Run the database seed script to initialize default portfolio sections.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[var(--border-subtle)] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-secondary)]">
                Configured Sections: {sections.length}
              </span>
              {isPending && (
                <span className="font-mono text-[11px] text-[var(--accent-cobalt)] uppercase tracking-wider animate-pulse">
                  ● Synchronizing order...
                </span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">
                  <th scope="col" className="py-3 px-4 w-28 text-center">
                    Sequence
                  </th>
                  <th scope="col" className="py-3 px-4">
                    Section Identity
                  </th>
                  <th scope="col" className="py-3 px-4 w-32 font-mono">
                    System Key
                  </th>
                  <th scope="col" className="py-3 px-4 w-28 text-center font-mono">
                    Status
                  </th>
                  <th scope="col" className="py-3 px-4 w-36 text-right font-mono">
                    Position Controls
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-xs">
                {sections.map((section, index) => {
                  const isFirst = index === 0;
                  const isLast = index === sections.length - 1;
                  const formattedIndex = String(index + 1).padStart(2, '0');

                  return (
                    <tr
                      key={section.id}
                      tabIndex={0}
                      onKeyDown={(e) => handleRowKeyDown(e, index)}
                      className="hover:bg-[var(--bg-primary)] focus:bg-[var(--bg-primary)] focus:outline-hidden focus:ring-1 focus:ring-inset focus:ring-[var(--accent-cobalt)] transition-colors group"
                      aria-label={`${section.label}, position ${index + 1} of ${sections.length}`}
                    >
                      {/* Sequence / Order Badge */}
                      <td className="py-4 px-4 text-center">
                        <span className="font-mono text-xs font-bold px-2 py-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
                          {formattedIndex}
                        </span>
                      </td>

                      {/* Section Title & Description */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-[var(--text-primary)] text-sm tracking-tight">
                            {section.label}
                          </span>
                          <span className="text-[11px] text-[var(--text-secondary)] mt-0.5 font-mono">
                            ID: {section.id}
                          </span>
                        </div>
                      </td>

                      {/* System Key Badge */}
                      <td className="py-4 px-4">
                        <span className="font-mono text-[11px] px-2 py-0.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] uppercase tracking-wider">
                          {section.key}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`font-mono text-[10px] px-2 py-0.5 border uppercase tracking-wider ${
                            section.enabled
                              ? 'bg-[#F0FDF4] border-[#86EFAC] text-[#15803D]'
                              : 'bg-[#F3F4F6] border-[#D1D5DB] text-[#6B7280]'
                          }`}
                        >
                          {section.enabled ? 'ACTIVE' : 'DISABLED'}
                        </span>
                      </td>

                      {/* Move Up / Down Buttons */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleReorder(index, 'up')}
                            disabled={isFirst || isPending}
                            aria-label={`Move ${section.label} up`}
                            title={isFirst ? 'Top position reached' : 'Move Up (Alt+Up)'}
                            className="px-2.5 py-1.5 text-xs font-mono font-bold border border-[var(--border-subtle)] bg-white hover:bg-[var(--bg-surface)] active:bg-[#EAE7E0] disabled:opacity-30 disabled:cursor-not-allowed focus:outline-hidden focus:ring-2 focus:ring-[var(--accent-cobalt)] transition-colors leading-none"
                          >
                            <span aria-hidden="true" className="mr-1">▲</span>
                            <span>UP</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReorder(index, 'down')}
                            disabled={isLast || isPending}
                            aria-label={`Move ${section.label} down`}
                            title={isLast ? 'Bottom position reached' : 'Move Down (Alt+Down)'}
                            className="px-2.5 py-1.5 text-xs font-mono font-bold border border-[var(--border-subtle)] bg-white hover:bg-[var(--bg-surface)] active:bg-[#EAE7E0] disabled:opacity-30 disabled:cursor-not-allowed focus:outline-hidden focus:ring-2 focus:ring-[var(--accent-cobalt)] transition-colors leading-none"
                          >
                            <span aria-hidden="true" className="mr-1">▼</span>
                            <span>DN</span>
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
    </section>
  );
}
