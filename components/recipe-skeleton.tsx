export function RecipeCardSkeleton() {
  return (
    <div className="overflow-hidden h-full rounded-sm bg-white border border-border-brand-light animate-pulse">
      {/* Image skeleton */}
      <div className="h-52 w-full bg-brand-100" />

      <div className="p-4 space-y-3 bg-brand-50">
        {/* Title */}
        <div className="h-5 bg-brand-200 rounded w-3/4" />

        {/* Cuisine */}
        <div className="h-4 bg-brand-200 rounded w-1/2" />

        {/* Metrics */}
        <div className="flex items-center gap-3">
          <div className="h-3 bg-brand-200 rounded w-16" />
          <div className="h-3 bg-brand-200 rounded w-12" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-brand-200">
          <div className="h-3 bg-brand-200 rounded w-20" />
          <div className="h-3 bg-brand-200 rounded w-12" />
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
        <div className="h-4 bg-brand-200 rounded w-3/4" />
        <div className="flex gap-2">
          <div className="h-3 bg-brand-200 rounded w-16" />
          <div className="h-3 bg-brand-200 rounded w-12" />
        </div>
      </div>
    </div>
  );
}
