"use client";

import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import { RecipeCard } from "@/components/recipe-card";
import {
  RecipeCardSkeleton,
  CompactRecipeSkeleton,
} from "@/components/recipe-skeleton";
import ViewSwitcher from "@/components/view-switcher";
import {
  LayoutGrid,
  List,
  Users,
  ImageIcon,
  Flame,
  MinusCircle,
  Search,
  X,
  Heart,
  Clock,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "@/components/ui/select";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fetchFilteredRecipes } from "@/app/dashboard/recipes/actions";
import { removeRecipeFromCategory } from "@/app/dashboard/categories/actions";
import { toggleFavorite } from "@/app/dashboard/recipes/actions";

import type { RecipeSortBy } from "@/app/dashboard/recipes/actions";

type ViewMode = "grid" | "compact";

type FilteredCursor =
  | { createdAt: string; id: string }
  | { title: string; id: string }
  | { timeKey: number; id: string }
  | null;

interface Recipe {
  id: string;
  title: string;
  imageUrl?: string | null;
  prepTime?: number | null;
  cookTime?: number | null;
  totalTime?: number | null;
  servings?: number | null;
  difficulty?: string | null;
  cuisine?: string | null;
  category?: string | null;
  calories?: number | null;
  isFavorite?: boolean | null;
  rating?: number | null;
  createdAt: Date;
}

interface RecipeGridViewProps {
  initialRecipes: Recipe[];
  totalCount: number;
  categoryId?: string;
  favoritesOnly?: boolean;
  context?: "category" | "favorites";
}

/* ── debounce hook ── */
function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);

  return debounced;
}

export function RecipeGridView({
  initialRecipes,
  totalCount,
  categoryId,
  favoritesOnly = false,
  context,
}: RecipeGridViewProps) {
  const RECIPES_PER_PAGE = 24;

  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [isPending, startTransition] = useTransition();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  /* ── search + sort state ── */
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<RecipeSortBy>("recent");
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  const [totalCountState, setTotalCountState] = useState(totalCount);
  const [filteredCount, setFilteredCount] = useState(totalCount);
  const [nextCursor, setNextCursor] = useState<FilteredCursor>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const hasMore = Boolean(nextCursor);
  const isFiltering = debouncedSearch.length > 0 || sortBy !== "recent";

  const sortLabels: Record<RecipeSortBy, string> = {
    recent: "Most Recent",
    title: "Alphabetical",
    rating: "Highest Rated",
    time: "Quickest",
  };

  /* ── Re-fetch when search/sort changes ── */
  useEffect(() => {
    if (!debouncedSearch && sortBy === "recent") {
      // Reset to SSR data
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRecipes(initialRecipes);
      setFilteredCount(totalCount);
      setTotalCountState(totalCount);
      setNextCursor(
        initialRecipes.length >= RECIPES_PER_PAGE
          ? {
              createdAt:
                typeof initialRecipes[initialRecipes.length - 1].createdAt ===
                "string"
                  ? (initialRecipes[initialRecipes.length - 1]
                      .createdAt as unknown as string)
                  : initialRecipes[
                      initialRecipes.length - 1
                    ].createdAt.toISOString(),
              id: initialRecipes[initialRecipes.length - 1].id,
            }
          : null,
      );
      return;
    }

    startTransition(async () => {
      const res = await fetchFilteredRecipes({
        categoryId,
        favoritesOnly,
        q: debouncedSearch,
        sortBy,
        cursor: null,
        limit: RECIPES_PER_PAGE,
      });

      setRecipes(res.items);
      setFilteredCount(res.totalCount);
      setTotalCountState(res.totalCount);
      setNextCursor(res.nextCursor);
    });
  }, [
    debouncedSearch,
    sortBy,
    categoryId,
    favoritesOnly,
    initialRecipes,
    totalCount,
  ]);

  /* ── Load more (infinite scroll) ── */
  const loadMore = useCallback(() => {
    if (!nextCursor || isPending) return;

    startTransition(async () => {
      const res = await fetchFilteredRecipes({
        categoryId,
        favoritesOnly,
        q: debouncedSearch,
        sortBy,
        cursor: nextCursor,
        limit: RECIPES_PER_PAGE,
      });

      setRecipes((prev) => [...prev, ...res.items]);
      setNextCursor(res.nextCursor);
    });
  }, [
    nextCursor,
    isPending,
    categoryId,
    favoritesOnly,
    debouncedSearch,
    sortBy,
  ]);

  /* ── Intersection observer ── */
  useEffect(() => {
    if (!hasMore || isPending) return;
    const el = sentinelRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { rootMargin: "700px 0px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, isPending, loadMore]);

  /* ── Context actions ── */
  async function handleRemoveFromCategory(recipeId: string) {
    if (!categoryId) return;
    await removeRecipeFromCategory(recipeId, categoryId);
    setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
  }

  // async function handleUnfavorite(recipeId: string) {
  //   await toggleFavorite(recipeId);
  //   setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
  // }

  return (
    <div className="space-y-4">
      {/* ── toolbar: search + sort + count + view switcher ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            placeholder="Search recipes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "pl-10 pr-10 bg-white h-10",
              "border border-border-light",
              "focus:border-brand focus:ring-brand",
            )}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchQuery("")}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-text-muted hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Sort + View switcher — always side by side */}
        <div className="flex gap-3">
          <Select
            value={sortBy}
            onValueChange={(v) => setSortBy(v as RecipeSortBy)}
          >
            <SelectTrigger
              className={cn(
                "flex-1 sm:w-48 cursor-pointer",
                "sm:shrink-0",
                "h-10! py-0! px-3",
                "flex items-center justify-between",
                "border border-border-light bg-white",
                "hover:border-border-light hover:bg-white",
                "focus:border-brand focus:ring-brand",
              )}
            >
              <span className="truncate text-sm leading-none">
                {sortLabels[sortBy] ?? "Sort by"}
              </span>
            </SelectTrigger>

            <SelectContent
              side="bottom"
              align="start"
              sideOffset={6}
              position="popper"
              className="border border-border-light bg-white shadow-xs"
            >
              <SelectGroup>
                <SelectLabel className="text-xs text-text-muted">
                  Sort by
                </SelectLabel>
                <SelectItem className="cursor-pointer" value="recent">
                  Most Recent
                </SelectItem>
                <SelectItem className="cursor-pointer" value="title">
                  Alphabetical
                </SelectItem>
                <SelectItem className="cursor-pointer" value="time">
                  Quickest
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <ViewSwitcher
            mode="onClick"
            currentView={viewMode}
            onViewChange={(view) => setViewMode(view as ViewMode)}
            options={[
              { value: "grid", icon: LayoutGrid, label: "Grid View" },
              { value: "compact", icon: List, label: "Compact View" },
            ]}
          />
        </div>
      </div>
      {/* ── Count line ── */}
      <p className="text-sm text-text-muted">
        {recipes.length} of {isFiltering ? filteredCount : totalCountState}{" "}
        {(isFiltering ? filteredCount : totalCountState) === 1
          ? "recipe"
          : "recipes"}
      </p>

      {/* ── Empty state ── */}
      {recipes.length === 0 && !isPending && (
        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border-light rounded-sm">
          <Search className="h-12 w-12 text-brand/30 mb-4" />
          <h3 className="text-base font-semibold mb-1">No recipes found</h3>
          <p className="text-sm text-text-secondary mb-4">
            Try adjusting your search or sorting
          </p>
          {isFiltering && (
            <Button
              onClick={() => {
                setSearchQuery("");
                setSortBy("recent");
              }}
              variant="brand-light"
              className="cursor-pointer"
            >
              Clear search & sort
            </Button>
          )}
        </div>
      )}

      {/* ── GRID VIEW ── */}
      {viewMode === "grid" && recipes.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                {...recipe}
                actions={
                  context === "category" ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="text"
                            size="icon"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRemoveFromCategory(recipe.id);
                            }}
                            className="h-8 w-8 text-text-muted hover:text-destructive"
                          >
                            <MinusCircle className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Remove from category</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : null
                }
              />
            ))}
          </div>

          {isPending && (
            <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 mt-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <RecipeCardSkeleton key={i} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── COMPACT VIEW ── */}
      {viewMode === "compact" && recipes.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {recipes.map((recipe) => {
              const isFav = recipe.isFavorite ?? false;

              return (
                <div key={recipe.id} className="relative">
                  <Link
                    href={`/dashboard/recipes/${recipe.id}`}
                    className="flex items-center gap-3 rounded-sm p-2.5 bg-white border border-border-brand-light hover:border-brand-400 transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="w-14 h-14 rounded-sm shrink-0 overflow-hidden bg-brand/5 flex items-center justify-center">
                      {recipe.imageUrl ? (
                        <Image
                          src={recipe.imageUrl}
                          alt={recipe.title}
                          width={56}
                          height={56}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-5 w-5 text-brand/20" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-text-primary truncate pr-14">
                        {recipe.title}
                      </h3>

                      <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                        {!!recipe.totalTime && recipe.totalTime > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {recipe.totalTime}m
                          </span>
                        )}
                        {!!recipe.servings && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {recipe.servings}
                          </span>
                        )}
                        {!!recipe.calories && (
                          <span className="flex items-center gap-1">
                            <Flame className="h-3 w-3" />
                            {recipe.calories}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>

                  {/* Actions — always visible */}
                  <div className="absolute top-2 right-2 flex items-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="text"
                            size="icon"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleFavorite(recipe.id);
                              setRecipes((prev) =>
                                context === "favorites"
                                  ? prev.filter((r) => r.id !== recipe.id)
                                  : prev.map((r) =>
                                      r.id === recipe.id
                                        ? { ...r, isFavorite: !r.isFavorite }
                                        : r,
                                    ),
                              );
                            }}
                            className="h-7 w-7 cursor-pointer"
                          >
                            <Heart
                              className={cn(
                                "h-3.5 w-3.5",
                                isFav ? "text-brand fill-brand" : "text-brand",
                              )}
                            />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{isFav ? "Unfavorite" : "Favorite"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {context === "category" && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="text"
                              size="icon"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleRemoveFromCategory(recipe.id);
                              }}
                              className="h-8 w-8 text-text-muted cursor-pointer hover:text-destructive"
                            >
                              <MinusCircle className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Remove from category</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {isPending && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 mt-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <CompactRecipeSkeleton key={i} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Sentinel + loading pill ── */}
      {hasMore && <div ref={sentinelRef} className="h-10" />}

      {hasMore && isPending && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-2 rounded-full bg-white border border-border-light px-4 py-2 shadow-sm">
            <div className="h-4 w-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-text-secondary">
              Loading more recipes…
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
