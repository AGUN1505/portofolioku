// app/admin/(dashboard)/layout.tsx
// Authenticated Admin Shell Layout (Guarded by DAL AuthGate and React Suspense)

import { Suspense, type ReactNode } from 'react';
import { AuthGate } from '../components/AuthGate';
import { AdminShell } from '../components/AdminShell';
import { AdminUserSection } from '../components/AdminUserSection';
import AdminLoading from './loading';

export const instant = false;

export default function AdminDashboardLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AuthGate>
        <AdminShell
          userSection={
            <Suspense
              fallback={
                <div className="p-4 border-t border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-secondary)]">
                  Verifying session...
                </div>
              }
            >
              <AdminUserSection />
            </Suspense>
          }
        >
          {children}
        </AdminShell>
      </AuthGate>
    </Suspense>
  );
}
