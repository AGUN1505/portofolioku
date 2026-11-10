// app/admin/(dashboard)/experiences/loading.tsx
export default function ExperiencesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="pb-5 border-b border-[var(--border-subtle)] space-y-2">
        <div className="h-3 w-24 bg-[var(--bg-surface)]" />
        <div className="h-7 w-64 bg-[var(--bg-surface)]" />
        <div className="h-4 w-96 bg-[var(--bg-surface)]" />
      </div>
      <div className="bg-white border border-[var(--border-subtle)] p-8 text-center text-xs font-mono text-[var(--text-secondary)]">
        Loading experiences chronology...
      </div>
    </div>
  );
}
