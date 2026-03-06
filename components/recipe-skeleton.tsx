export function RecipeCardSkeleton() {
  return (
    <div className="overflow-hidden h-full rounded-sm bg-white border border-border-brand-light animate-pulse">
      <div className="h-40 w-full bg-brand-100" />

      <div className="p-3 space-y-2 bg-brand-50/30">
        <div className="h-4 bg-brand-200 rounded-sm w-3/4" />
        <div className="h-3 bg-brand-200 rounded-sm w-1/2" />

        <div className="flex items-center justify-between pt-2 border-t border-brand-100">
          <div className="flex items-center gap-2">
            <div className="h-3 bg-brand-200 rounded-sm w-10" />
            <div className="h-3 bg-brand-200 rounded-sm w-10" />
          </div>
          <div className="h-3 bg-brand-200 rounded-sm w-14" />
        </div>
      </div>
    </div>
  );
}

export function CompactRecipeSkeleton() {
  return (
    <div className="flex gap-2.5 bg-white rounded-sm p-2.5 border border-border-brand-light animate-pulse">
      <div className="w-14 h-14 bg-brand-200 rounded-sm shrink-0" />

      <div className="flex-1 space-y-2">
        <div className="h-4 bg-brand-200 rounded-sm w-3/4" />
        <div className="flex gap-2">
          <div className="h-3 bg-brand-200 rounded-sm w-16" />
          <div className="h-3 bg-brand-200 rounded-sm w-12" />
        </div>
      </div>
    </div>
  );
}
