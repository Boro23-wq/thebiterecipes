import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { RecipeCard } from "@/components/recipe-card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import Link from "next/link";
import { RecipeGridView } from "@/components/recipes-grid-view";

export default async function FavoritesPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const favoriteRecipes = await db.query.recipes.findMany({
    where: and(eq(recipes.userId, user.id), eq(recipes.isFavorite, true)),
    orderBy: [desc(recipes.createdAt)],
  });

  return (
    <div className="space-y-6">
      {/* Hero / header card (same as category page) */}
      <div className="rounded-sm border border-border-brand-light bg-white overflow-hidden flex">
        <div className="w-1 shrink-0 bg-brand" />

        <div className="flex-1 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Heart className="h-5 w-5 shrink-0 text-brand fill-brand" />
              <h1 className="text-lg font-bold text-text-primary truncate">
                Favorites
              </h1>
            </div>

            <div className="shrink-0 ml-4 flex items-center gap-1.5 text-sm">
              <span className="font-bold text-brand">
                {favoriteRecipes.length}
              </span>
              <span className="text-text-muted">
                {favoriteRecipes.length === 1 ? "recipe" : "recipes"}
              </span>
            </div>
          </div>

          <p className="text-sm text-text-muted mt-1 pl-8 truncate">
            The recipes you love most, all in one place.
          </p>
        </div>
      </div>

      {/* Content header (same as category page) */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Recipes</h2>
          <p className="mt-1 text-sm text-text-secondary">
            {favoriteRecipes.length === 0
              ? "Nothing here yet — add some from your recipes."
              : "All recipes you’ve favorited."}
          </p>
        </div>

        <Button asChild variant="brand" className="cursor-pointer">
          <Link href="/dashboard/recipes">Browse Recipes</Link>
        </Button>
      </div>

      {/* Grid / Empty (same empty card style) */}
      {favoriteRecipes.length === 0 ? (
        <div className="relative overflow-hidden rounded-sm border border-border-light bg-background">
          <div className="pointer-events-none absolute -top-16 right-10 h-40 w-40 rounded-full bg-brand-100 blur-3xl opacity-60" />
          <div className="p-8 sm:p-10">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100">
                <Heart className="h-7 w-7 text-brand" />
              </div>

              <h3 className="text-xl font-semibold text-text-primary">
                No favorites yet
              </h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-text-secondary">
                Pick a recipe, then tap the heart icon to add it here.
              </p>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <Button asChild variant="brand" className="cursor-pointer">
                  <Link href="/dashboard/recipes">Browse Recipes</Link>
                </Button>
                <Button asChild variant="outline" className="cursor-pointer">
                  <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <RecipeGridView
          initialRecipes={favoriteRecipes}
          totalCount={favoriteRecipes.length}
          favoritesOnly
          context="favorites"
        />
      )}
    </div>
  );
}
