// app/admin/(dashboard)/account/page.tsx
// Module 13: Administrator Account Settings (Clean Architecture Presentation Layer)

import { connection } from 'next/server';
import { verifySession } from '../../../../src/infrastructure/auth/dal';
import { CompositionRoot } from '../../../../src/infrastructure/composition-root';
import { AccountSettingsClient } from './AccountSettingsClient';

export const instant = false;

export default async function AccountSettingsPage() {
  await connection();
  const session = await verifySession();
  const getAdminAccountUseCase = CompositionRoot.getGetAdminAccountUseCase();
  const account = await getAdminAccountUseCase.execute(session.userId);

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <header className="pb-5 border-b border-[var(--border-subtle)]">
        <p className="text-xs uppercase font-mono tracking-widest text-[var(--accent-cobalt)]">
          System
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mt-1">
          Account Settings
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1.5 max-w-2xl leading-relaxed">
          Manage administrator profile, secure credential updates, and atomic session invalidation. Guarded by single-admin architecture.
        </p>
      </header>

      {/* Account Management View */}
      <AccountSettingsClient account={account} fallbackSession={session} />
    </div>
  );
}
