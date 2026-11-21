// app/admin/components/AdminUserSection.tsx
// Displays authenticated admin user session metadata and sign out trigger

import Link from 'next/link';
import { connection } from 'next/server';
import { verifySession } from '../../../src/infrastructure/auth/dal';
import { logoutAction } from '../login/actions';

export async function AdminUserSection() {
  await connection();
  let session = null;
  try {
    session = await verifySession();
  } catch {
    // If session verification fails, AuthGate will handle redirection
    return null;
  }

  return (
    <div className="border-t border-[var(--border-subtle)] p-4 bg-white/50 space-y-3 text-xs font-mono">
      <div className="flex items-center justify-between">
        <div className="truncate">
          <p className="text-[10px] uppercase text-[var(--text-secondary)] tracking-wider">
            Logged In As
          </p>
          <p className="font-semibold text-[var(--text-primary)] truncate">
            {session.username}
          </p>
        </div>
        <span className="text-[10px] px-2 py-0.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
          v{session.sessionVersion}
        </span>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
        <Link
          href="/"
          className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline underline-offset-2 transition-colors font-sans"
        >
          ← Public Site
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-[10px] uppercase tracking-wider bg-[var(--text-primary)] hover:bg-black text-white px-2.5 py-1 transition-colors"
          >
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );
}
