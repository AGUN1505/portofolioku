// app/admin/(dashboard)/domains/page.tsx
// Module 5: Engineering Domains Management (Clean Architecture Presentation Layer)

import { CompositionRoot } from '../../../../src/infrastructure/composition-root';
import { DomainListClient } from './DomainListClient';

export default async function DomainsPage() {
  const getDomainsUseCase = CompositionRoot.getGetDomainsUseCase();
  const domains = await getDomainsUseCase.execute();

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <header className="pb-5 border-b border-[var(--border-subtle)] flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase font-mono tracking-widest text-[var(--accent-cobalt)]">
            Engineering Practice
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mt-1">
            Domains Management
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 max-w-2xl leading-relaxed">
            Manage practice domains, string indices (&quot;01&quot;, &quot;02&quot;), title designations, and display ordering.
          </p>
        </div>
      </header>

      {/* Main Collection View */}
      <DomainListClient initialDomains={domains} />
    </div>
  );
}
