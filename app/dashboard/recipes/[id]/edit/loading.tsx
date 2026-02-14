export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center gap-2 rounded-full bg-white border border-border-light px-4 py-2 shadow-sm">
        <div className="h-4 w-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-text-secondary">Loading…</span>
      </div>
    </div>
  );
}
