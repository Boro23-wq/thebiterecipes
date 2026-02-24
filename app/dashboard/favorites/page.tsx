import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { RecipeCard } from "@/components/recipe-card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import Link from "next/link";

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
      <div className="relative overflow-hidden rounded-sm border border-border-light bg-background">
        {/* subtle brand glow */}
        <div className="pointer-events-none absolute -top-20 -right-24 h-56 w-56 rounded-full bg-brand-100 blur-3xl opacity-70" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-brand-100 blur-3xl opacity-60" />

        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-3 mb-4">
                <div className="min-w-0">
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-sm bg-brand-100">
                    <Heart className="h-7 w-7 text-brand" />
                  </div>

                  <div className="flex items-center gap-3">
                    <h1 className="truncate text-2xl font-semibold tracking-tight text-text-primary">
                      Favorites
                    </h1>
                  </div>

                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
                    The recipes you love most, all in one place.
                  </p>
                </div>
              </div>

              {/* Stats row (same structure) */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-secondary inline-flex items-center rounded-sm px-3 py-1 text-sm">
                  <span className="font-medium text-white">
                    {favoriteRecipes.length}
                  </span>
                  <span className="ml-1 text-white">
                    {favoriteRecipes.length === 1 ? "recipe" : "recipes"}
                  </span>
                </div>

                <div className="h-5 w-px bg-border-light hidden sm:block" />

                <p className="text-sm text-text-muted">
                  Tap the heart on any recipe to save it here.
                </p>
              </div>
            </div>
          </div>
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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {favoriteRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} {...recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
