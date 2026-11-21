// app/admin/(dashboard)/roles/page.tsx
// Module 3: Roles Management (Clean Architecture Presentation Layer)

import { connection } from 'next/server';
import { CompositionRoot } from '../../../../src/infrastructure/composition-root';
import { RoleListClient } from './RoleListClient';

export const instant = false;

export default async function RolesPage() {
  await connection();
  const getRolesUseCase = CompositionRoot.getGetRolesUseCase();
  const roles = await getRolesUseCase.execute();

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <header className="pb-5 border-b border-[var(--border-subtle)] flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase font-mono tracking-widest text-[var(--accent-cobalt)]">
            Hero Section
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mt-1">
            Roles Management
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 max-w-2xl leading-relaxed">
            Manage cycling engineering specializations, primary role designations, and presentation ordering for the hero header.
          </p>
        </div>
      </header>

      {/* Main Collection View */}
      <RoleListClient initialRoles={roles} />
    </div>
  );
}
