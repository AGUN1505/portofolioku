// app/admin/components/ModulePlaceholder.tsx
// Informative Swiss placeholder component for CMS modules pending implementation

import Link from 'next/link';

interface SubRoute {
  readonly label: string;
  readonly href: string;
}

interface ModulePlaceholderProps {
  readonly title: string;
  readonly section: string;
  readonly description: string;
  readonly modelName: string;
  readonly recordType: 'Singleton' | 'Collection';
  readonly expectedRecords: number;
  readonly plannedPhase: string;
  readonly subRoutes?: readonly SubRoute[];
}

export function ModulePlaceholder({
  title,
  section,
  description,
  modelName,
  recordType,
  expectedRecords,
  plannedPhase,
  subRoutes,
}: ModulePlaceholderProps) {
  return (
    <div className="space-y-6">
      {/* Module Header */}
      <header className="pb-5 border-b border-[var(--border-subtle)]">
        <p className="text-xs uppercase font-mono tracking-widest text-[var(--accent-cobalt)]">
          {section}
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mt-1">
          {title}
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1.5 max-w-2xl leading-relaxed">
          {description}
        </p>
      </header>

      {/* Status Notice Banner */}
      <div className="p-4 bg-white border border-[var(--border-subtle)] space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--accent-cobalt)] font-semibold">
            ● Architectural Route Active
          </span>
          <span className="font-mono text-[10px] px-2 py-0.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
            Phase 2 Read-Only Guardrail
          </span>
        </div>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          This dedicated route (<code className="font-mono text-[var(--text-primary)]">{title}</code>) is fully registered and wired into the Admin Shell navigation. In accordance with Stage 10.4 Phase 2 safety constraints, content mutation forms and CRUD operations are scheduled for implementation in subsequent phases to maintain zero risk of unintended database writes.
        </p>
      </div>

      {/* Module Specifications Table */}
      <div className="bg-white border border-[var(--border-subtle)] p-5">
        <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold pb-3 border-b border-[var(--border-subtle)] mb-4">
          Module Technical Specifications
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-xs font-mono">
          <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]/50">
            <dt className="text-[var(--text-secondary)]">Prisma Model:</dt>
            <dd className="font-semibold text-[var(--text-primary)]">{modelName}</dd>
          </div>
          <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]/50">
            <dt className="text-[var(--text-secondary)]">Record Structure:</dt>
            <dd className="text-[var(--text-primary)]">{recordType}</dd>
          </div>
          <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]/50">
            <dt className="text-[var(--text-secondary)]">Baseline Records:</dt>
            <dd className="text-[var(--text-primary)]">{expectedRecords} in database</dd>
          </div>
          <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]/50">
            <dt className="text-[var(--text-secondary)]">Scheduled Phase:</dt>
            <dd className="text-[var(--accent-cobalt)] font-semibold">{plannedPhase}</dd>
          </div>
        </dl>
      </div>

      {/* Sub-routes Links (e.g. for Projects) */}
      {subRoutes && subRoutes.length > 0 && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4 space-y-2">
          <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">
            Sub-Route Structure Placeholders
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {subRoutes.map((sub) => (
              <Link
                key={sub.href}
                href={sub.href}
                className="text-xs font-mono px-3 py-1.5 bg-white border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--accent-cobalt)] transition-colors"
              >
                {sub.label} →
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-4 flex items-center justify-between border-t border-[var(--border-subtle)]">
        <Link
          href="/admin"
          className="text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors underline underline-offset-4"
        >
          ← Return to Dashboard Overview
        </Link>
        <span className="text-[10px] font-mono text-[var(--text-secondary)]">
          Database writes disabled in Phase 2
        </span>
      </div>
    </div>
  );
}
