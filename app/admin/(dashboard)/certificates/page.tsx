// app/admin/(dashboard)/certificates/page.tsx
// Module 14: Certificates Management (Clean Architecture Presentation Layer)

import { Suspense } from 'react';
import { connection } from 'next/server';
import { CompositionRoot } from '../../../../src/infrastructure/composition-root';
import { CertificateListClient } from './CertificateListClient';
import AdminLoading from '../loading';

export const instant = false;

async function CertificatesContent() {
  await connection();
  const getCertificatesUseCase = CompositionRoot.getGetCertificatesUseCase();
  const certificates = await getCertificatesUseCase.execute();

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <header className="pb-5 border-b border-[var(--border-subtle)] flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase font-mono tracking-widest text-[var(--accent-cobalt)]">
            Work &amp; History
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mt-1">
            Certificates &amp; Credentials
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 max-w-2xl leading-relaxed">
            Manage certified technical credentials, course completion certificates, issuing organizations, and document uploads.
          </p>
        </div>
      </header>

      {/* Main Collection View */}
      <CertificateListClient initialCertificates={certificates} />
    </div>
  );
}

export default function CertificatesPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <CertificatesContent />
    </Suspense>
  );
}
