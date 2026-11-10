// app/admin/(dashboard)/loading.tsx
// Swiss minimal wireframe loading state for Admin Shell

export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="pb-5 border-b border-[var(--border-subtle)] space-y-2">
        <div className="h-3 w-28 bg-[var(--border-subtle)]" />
        <div className="h-7 w-64 bg-[var(--border-subtle)]" />
        <div className="h-3 w-96 bg-[var(--border-subtle)]" />
      </div>

      <div className="p-6 bg-white border border-[var(--border-subtle)] space-y-4">
        <div className="h-4 w-48 bg-[var(--border-subtle)]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-20 bg-[var(--bg-surface)] border border-[var(--border-subtle)]" />
          <div className="h-20 bg-[var(--bg-surface)] border border-[var(--border-subtle)]" />
          <div className="h-20 bg-[var(--bg-surface)] border border-[var(--border-subtle)]" />
          <div className="h-20 bg-[var(--bg-surface)] border border-[var(--border-subtle)]" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 bg-white border border-[var(--border-subtle)]" />
        ))}
      </div>

      <div className="h-48 bg-white border border-[var(--border-subtle)]" />
    </div>
  );
}
