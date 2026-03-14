"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Loader2, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getRecipesFromPantry } from "@/app/dashboard/pantry/actions";
import { cn } from "@/lib/utils";
import { text } from "@/lib/design-tokens";
import Link from "next/link";
import Image from "next/image";

interface WhatCanICookProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
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

export default function WhatCanICook({
  open,
  onOpenChange,
}: WhatCanICookProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [matches, setMatches] = useState<RecipeMatch[]>([]);

  useEffect(() => {
    if (!open) return;

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
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <DialogHeader className="mb-1">
          <DialogTitle className="font-semibold">What can I cook?</DialogTitle>

          <DialogDescription>
            Recipes matched to the ingredients currently in your pantry.
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-3 scrollbar-bite">
          {/* Loading */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-6 w-6 text-brand animate-spin mb-3" />
              <p className={text.muted}>Matching your pantry to recipes...</p>
            </div>
          ) : matches.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <h3 className={cn(text.body, "font-semibold mb-1")}>
                No matches found
              </h3>

              <p className={cn(text.small, "max-w-sm")}>
                Add more items to your pantry or more recipes to your collection
                to get suggestions.
              </p>
            </div>
          ) : (
            /* Recipe list */
            matches.map((match) => (
              <Link
                key={match.recipe.id}
                href={`/dashboard/recipes/${match.recipe.id}`}
                onClick={() => onOpenChange(false)}
                className="block group mr-4"
              >
                <div className="rounded-sm border border-border-brand-subtle bg-brand-50 p-3 hover:bg-brand-200 hover transition">
                  <div className="flex items-start gap-3">
                    {/* Image */}
                    {match.recipe.imageUrl ? (
                      <div className="w-16 h-16 relative shrink-0">
                        <Image
                          src={match.recipe.imageUrl}
                          alt={match.recipe.title}
                          fill
                          sizes="64px"
                          className="rounded-sm object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-sm bg-brand-100 flex items-center justify-center shrink-0" />
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Title */}
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-text-primary truncate transition-colors">
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
                          <span className="flex items-center gap-1 text-[10px] text-text-muted">
                            <Clock className="h-3 w-3" />
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
                </div>
              </Link>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
