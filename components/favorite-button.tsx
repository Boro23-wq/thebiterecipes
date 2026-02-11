"use client";

import * as React from "react";
import { Heart } from "lucide-react";
import { toggleFavorite } from "@/app/dashboard/recipes/actions";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const favoriteOptimisticCache = new Map<string, boolean>();

interface FavoriteButtonProps {
  recipeId: string;
  isFavorite: boolean | null | undefined;
  className?: string;
}

export function FavoriteButton({
  recipeId,
  isFavorite: initialFavorite,
  className,
}: FavoriteButtonProps) {
  const [isPending, startTransition] = useTransition();

  const serverValue = initialFavorite ?? false;
  const cached = favoriteOptimisticCache.get(recipeId);
  const [fav, setFav] = React.useState<boolean>(cached ?? serverValue);

  React.useEffect(() => {
    const nextServer = initialFavorite ?? false;
    const cachedNow = favoriteOptimisticCache.get(recipeId);

    if (cachedNow === undefined) {
      setFav(nextServer);
      return;
    }

    if (cachedNow === nextServer) {
      favoriteOptimisticCache.delete(recipeId);
      setFav(nextServer);
    } else {
      setFav(cachedNow);
    }
  }, [recipeId, initialFavorite]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const prev = fav;
    const next = !prev;

    setFav(next);
    favoriteOptimisticCache.set(recipeId, next);

    startTransition(async () => {
      try {
        await toggleFavorite(recipeId);
      } catch (err) {
        setFav(prev);
        favoriteOptimisticCache.set(recipeId, prev);
        console.error("Failed to toggle favorite:", err);
      }
    });
  };

  return (
    <Button
      onClick={handleToggle}
      disabled={isPending}
      variant="brand-light"
      size="sm"
      className={cn("cursor-pointer", className)}
      title={fav ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-colors",
          fav ? "fill-current text-brand" : "fill-none text-text-primary",
          "text-brand",
        )}
      />
    </Button>
  );
}
