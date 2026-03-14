"use client";

import { useEffect, useState } from "react";
import { X, ChefHat, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRecipesFromPantry } from "@/app/dashboard/pantry/actions";
import { cn } from "@/lib/utils";
import { text } from "@/lib/design-tokens";
import Link from "next/link";

interface WhatCanICookProps {
  onClose: () => void;
}

type RecipeMatch = {
  recipe: {
    id: string;
    title: string;
    imageUrl: string | null;
    totalTime: number | null;
    difficulty: string | null;
  };
  matchCount: number;
  matchPercent: number;
  missingIngredients: string[];
};

export default function WhatCanICook({ onClose }: WhatCanICookProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [matches, setMatches] = useState<RecipeMatch[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const result = await getRecipesFromPantry();
        setMatches(result.recipes as RecipeMatch[]);
      } catch (error) {
        console.error("Failed to get recipe matches:", error);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-sm sm:rounded-sm w-full sm:max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-brand-light">
          <div className="flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-brand" />
            <h2 className="text-lg font-semibold">What Can I Cook?</h2>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-bite">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-6 w-6 text-brand animate-spin mb-3" />
              <p className={text.muted}>Matching your pantry to recipes...</p>
            </div>
          ) : matches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ChefHat className="h-8 w-8 text-muted-foreground mb-3" />
              <h3 className={cn(text.body, "font-semibold mb-1")}>
                No matches found
              </h3>
              <p className={cn(text.small, "max-w-sm")}>
                Add more items to your pantry or more recipes to your collection
                to get suggestions.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((match) => (
                <Link
                  key={match.recipe.id}
                  href={`/dashboard/recipes/${match.recipe.id}`}
                  onClick={onClose}
                  className="block rounded-sm border border-border-brand-subtle hover:border-brand transition p-3 group"
                >
                  <div className="flex items-start gap-3">
                    {/* Image */}
                    {match.recipe.imageUrl ? (
                      <img
                        src={match.recipe.imageUrl}
                        alt={match.recipe.title}
                        className="w-16 h-16 rounded-sm object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-sm bg-brand-100 flex items-center justify-center shrink-0">
                        <ChefHat className="h-6 w-6 text-brand" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-text-primary truncate group-hover:text-brand transition-colors">
                          {match.recipe.title}
                        </h3>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-brand transition-colors" />
                      </div>

                      {/* Match bar */}
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-brand-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              match.matchPercent >= 80
                                ? "bg-green-500"
                                : match.matchPercent >= 50
                                  ? "bg-brand"
                                  : "bg-amber-400",
                            )}
                            style={{ width: `${match.matchPercent}%` }}
                          />
                        </div>
                        <span
                          className={cn(
                            "text-xs font-semibold",
                            match.matchPercent >= 80
                              ? "text-green-600"
                              : match.matchPercent >= 50
                                ? "text-brand"
                                : "text-amber-600",
                          )}
                        >
                          {match.matchPercent}%
                        </span>
                      </div>

                      {/* Missing ingredients */}
                      {match.missingIngredients.length > 0 && (
                        <p className="text-[11px] text-text-muted mt-1.5 line-clamp-1">
                          Missing:{" "}
                          {match.missingIngredients.slice(0, 3).join(", ")}
                          {match.missingIngredients.length > 3 &&
                            ` +${match.missingIngredients.length - 3}`}
                        </p>
                      )}

                      {/* Meta */}
                      <div className="flex items-center gap-3 mt-1">
                        {match.recipe.totalTime && (
                          <span className="text-[10px] text-text-muted">
                            {match.recipe.totalTime}m
                          </span>
                        )}
                        {match.recipe.difficulty && (
                          <span className="text-[10px] text-text-muted capitalize">
                            {match.recipe.difficulty}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
