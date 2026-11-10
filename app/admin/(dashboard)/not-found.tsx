// app/admin/(dashboard)/not-found.tsx
// Swiss 404 handler for unmatched admin routes

import Link from 'next/link';

export default function AdminNotFound() {
  return (
    <div className="space-y-6">
      <header className="pb-5 border-b border-[var(--border-subtle)]">
        <p className="text-xs uppercase font-mono tracking-widest text-[var(--accent-cobalt)]">
          404 • Not Found
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mt-1">
          Route Does Not Exist
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          The requested administrative module or view could not be located in this CMS deployment.
        </p>
      </header>

      <div className="p-5 bg-white border border-[var(--border-subtle)] space-y-4">
        <p className="text-xs text-[var(--text-secondary)] font-mono leading-relaxed">
          Please check the URL or use the navigation sidebar to access one of the 13 dedicated administrative sections.
        </p>

        <div className="pt-2">
          <Link
            href="/admin"
            className="text-xs font-mono uppercase tracking-wider bg-[var(--text-primary)] hover:bg-black text-white px-3 py-1.5 transition-colors inline-block"
          >
            ← Back to Dashboard Hub
          </Link>
        </div>
      </div>
    </div>
  );
}
