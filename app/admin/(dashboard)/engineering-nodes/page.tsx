// app/admin/(dashboard)/engineering-nodes/page.tsx
// Module 4: Engineering Nodes Management (Clean Architecture Presentation Layer)

import { connection } from 'next/server';
import { CompositionRoot } from '../../../../src/infrastructure/composition-root';
import { EngineeringNodeListClient } from './EngineeringNodeListClient';

export const instant = false;

export default async function EngineeringNodesPage() {
  await connection();
  const getEngineeringNodesUseCase = CompositionRoot.getGetEngineeringNodesUseCase();
  const nodes = await getEngineeringNodesUseCase.execute();

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <header className="pb-5 border-b border-[var(--border-subtle)] flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase font-mono tracking-widest text-[var(--accent-cobalt)]">
            Hero Schematic
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mt-1">
            Engineering Nodes Management
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 max-w-2xl leading-relaxed">
            Manage technical schematic nodes, system architecture highlights, nullable tech stacks, and sequence ordering.
          </p>
        </div>
      </header>

      {/* Main Collection View */}
      <EngineeringNodeListClient initialNodes={nodes} />
    </div>
  );
}
