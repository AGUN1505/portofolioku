// app/admin/(dashboard)/projects/error.tsx
'use client';

interface ErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function ProjectsError({ error, reset }: ErrorProps) {
  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-[var(--border-subtle)]">
        <p className="text-xs uppercase font-mono tracking-widest text-red-600">Error</p>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mt-1">
          Failed to load Projects
        </h1>
      </div>
      <div className="bg-red-50 border border-red-300 p-6 space-y-4">
        <p className="font-mono text-xs text-red-900">
          An error occurred while loading or rendering the projects module.
        </p>
        {error.digest && (
          <p className="font-mono text-[11px] text-red-700">Error Digest: {error.digest}</p>
        )}
        <div>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-red-600 text-white text-xs font-mono uppercase tracking-wider hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
