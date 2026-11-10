// app/admin/components/AuthGate.tsx
// Authoritative Server-Side Authentication Gate for Admin Shell

import { redirect } from 'next/navigation';
import { verifySession, UnauthorizedException } from '../../../src/infrastructure/auth/dal';
import type { ReactNode } from 'react';

interface AuthGateProps {
  readonly children: ReactNode;
}

/**
 * Server-side authorization boundary wrapping protected admin layout content.
 * Guarantees that AdminShell and nested children are NEVER evaluated or rendered
 * unless DAL verifySession() resolves with an authoritative valid session.
 */
export async function AuthGate({ children }: AuthGateProps) {
  try {
    await verifySession();
  } catch (error) {
    if (error instanceof UnauthorizedException) {
      redirect('/admin/login');
    }
    throw error;
  }

  return <>{children}</>;
}
