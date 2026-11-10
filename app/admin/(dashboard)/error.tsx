'use client';

// app/admin/(dashboard)/error.tsx
// Safe Swiss error boundary for Admin Shell (Prevents credential & stack trace leakage)

import { useEffect } from 'react';
import Link from 'next/link';

interface AdminErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function AdminError({ error, reset }: AdminErrorProps) {
  useEffect(() => {
    // Log safe error internally (without exposing sensitive tokens/credentials)
    console.error('Admin shell error captured:', error.message);
  }, [error]);

  return (
    <div className="space-y-6">
      <header className="pb-5 border-b border-[var(--border-subtle)]">
        <p className="text-xs uppercase font-mono tracking-widest text-red-600">
          ● System Error
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mt-1">
          Operational Failure
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          The requested administrative operation or view could not be rendered.
        </p>
      </header>

      <div className="p-5 bg-white border border-red-200 space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-wider text-red-700 font-semibold">
            Status: Error Encountered
          </span>
          {error.digest && (
            <span className="font-mono text-[10px] px-2 py-0.5 bg-red-50 border border-red-200 text-red-800">
              Digest: {error.digest}
            </span>
          )}
        </div>

        <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-mono">
          An unexpected error occurred while executing the server request. Raw exceptions and credentials have been redacted for security.
        </p>

        <div className="pt-2 flex items-center space-x-3">
          <button
            type="button"
            onClick={() => reset()}
            className="text-xs font-mono uppercase tracking-wider bg-[var(--text-primary)] hover:bg-black text-white px-3 py-1.5 transition-colors"
          >
            Retry Request
          </button>
          <Link
            href="/admin"
            className="text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline underline-offset-4"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
