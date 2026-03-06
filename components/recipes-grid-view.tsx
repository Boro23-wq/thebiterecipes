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
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { fetchFilteredRecipes } from "@/app/dashboard/recipes/actions";
import { removeRecipeFromCategory } from "@/app/dashboard/categories/actions";
import { toggleFavorite } from "@/app/dashboard/recipes/actions";

type ViewMode = "grid" | "compact";

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

  const [nextCursor, setNextCursor] = useState<{
    createdAt: string;
    id: string;
  } | null>(() => {
    if (initialRecipes.length >= RECIPES_PER_PAGE) {
      const last = initialRecipes[initialRecipes.length - 1];
      return {
        createdAt:
          typeof last.createdAt === "string"
            ? last.createdAt
            : last.createdAt.toISOString(),
        id: last.id,
      };
    }
    return null;
  });

  useEffect(() => {
    setRecipes(initialRecipes);
  }, [initialRecipes]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const hasMore = Boolean(nextCursor);

  const loadMore = useCallback(() => {
    if (!nextCursor || isPending) return;

    startTransition(async () => {
      const res = await fetchFilteredRecipes({
        categoryId,
        favoritesOnly,
        cursor: nextCursor,
        limit: RECIPES_PER_PAGE,
      });

      setRecipes((prev) => [...prev, ...res.items]);
      setNextCursor(res.nextCursor);
    });
  }, [nextCursor, isPending, categoryId, favoritesOnly]);

  // infinite scroll
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

  async function handleRemoveFromCategory(recipeId: string) {
    if (!categoryId) return;

    await removeRecipeFromCategory(recipeId, categoryId);

    setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
  }

  async function handleUnfavorite(recipeId: string) {
    await toggleFavorite(recipeId);

    setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
  }

  return (
    <div className="space-y-4">
      {/* header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">
          {recipes.length} of {totalCount}{" "}
          {totalCount === 1 ? "recipe" : "recipes"}
        </p>

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

      {/* empty */}
      {recipes.length === 0 && !isPending && (
        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border-light rounded-sm">
          <p className="text-sm text-text-muted">No recipes found.</p>
        </div>
      )}

      {/* GRID VIEW */}
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
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
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

      {/* COMPACT VIEW */}
      {viewMode === "compact" && recipes.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {recipes.map((recipe) => (
              <div key={recipe.id} className="relative">
                <Link
                  href={`/dashboard/recipes/${recipe.id}`}
                  className="group flex items-center gap-3 bg-white rounded-sm p-3 hover:border-brand-200 hover:shadow-sm transition-all border border-border-brand-light"
                >
                  <div className="w-16 h-16 bg-brand-50 rounded-sm shrink-0 flex items-center justify-center overflow-hidden relative">
                    {recipe.imageUrl ? (
                      <Image
                        src={recipe.imageUrl}
                        alt={recipe.title}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-brand/20" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-text-primary truncate">
                      {recipe.title}
                    </h3>

                    <div className="flex items-center gap-3 text-[10px] text-text-muted mt-1">
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
              </div>
            ))}
          </div>

          {isPending && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <CompactRecipeSkeleton key={i} />
              ))}
            </div>
          )}
        </>
      )}

      {hasMore && <div ref={sentinelRef} className="h-10" />}
    </div>
  );
}
