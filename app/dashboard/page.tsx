import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { recipes, categories } from "@/db/schema";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { RecipeCard } from "@/components/recipe-card";
import { CategoryCard } from "@/components/category-card";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/ui/card-wrapper";
import { BookOpen, Plus, Heart, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { spacing, text, layout, icon } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) redirect("/sign-in");

  // ================================
  // STATS
  // ================================

  const [{ totalRecipes }] = await db
    .select({ totalRecipes: count() })
    .from(recipes)
    .where(eq(recipes.userId, user.id));

  const [{ favoriteRecipes }] = await db
    .select({ favoriteRecipes: count() })
    .from(recipes)
    .where(and(eq(recipes.userId, user.id), eq(recipes.isFavorite, true)));

  const [{ avgTime }] = await db
    .select({
      avgTime: sql<number>`ROUND(AVG(${recipes.totalTime}))`,
    })
    .from(recipes)
    .where(eq(recipes.userId, user.id));

  // ================================
  // PINNED CATEGORIES
  // ================================

  const pinnedCategories = await db.query.categories.findMany({
    where: and(eq(categories.userId, user.id), eq(categories.isPinned, true)),
    orderBy: [desc(categories.createdAt)],
    limit: 5,
    with: {
      recipeCategories: {
        with: {
          recipe: {
            columns: {
              id: true,
              imageUrl: true,
            },
          },
        },
        limit: 4,
      },
    },
  });

  // ================================
  // STARTER RECIPES (seeded)
  // ================================

  const starterRecipes = await db
    .select()
    .from(recipes)
    .where(and(eq(recipes.userId, user.id), eq(recipes.isSeeded, true)))
    .orderBy(desc(recipes.createdAt))
    .limit(10);

  // ================================
  // RECENT RECIPES
  // ================================

  const recentRecipes = await db
    .select()
    .from(recipes)
    .where(and(eq(recipes.userId, user.id), eq(recipes.isSeeded, false)))
    .orderBy(desc(recipes.createdAt))
    .limit(6);

  return (
    <div className={spacing.section}>
      {/* Header */}
      <div>
        <h1 className={text.h1}>Welcome back, {user.firstName || "Chef"}!</h1>
        <p className={cn(text.small, "mt-0.5")}>
          Here&apos;s an overview of your recipe collection
        </p>
      </div>

      {/* Stats */}
      <div className={layout.grid4}>
        {/* Total Recipes */}
        <StatsCard>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-secondary">
              Total Recipes
            </span>
            <BookOpen className={cn(icon.small, icon.brand)} />
          </div>
          <div className={text.statValue}>{totalRecipes}</div>
          <p className={cn(text.muted, "mt-1")}>In your collection</p>
        </StatsCard>

        {/* Favorites */}
        <StatsCard>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-secondary">
              Favorites
            </span>
            <Heart className={cn(icon.small, icon.brand)} />
          </div>
          <div className={text.statValue}>{favoriteRecipes}</div>
          <p className={cn(text.muted, "mt-1")}>Marked as favorite</p>
        </StatsCard>

        {/* Avg Cook Time */}
        <StatsCard>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-secondary">
              Avg Cook Time
            </span>
            <Clock className={cn(icon.small, icon.brand)} />
          </div>
          <div className={text.statValue}>{avgTime ? `${avgTime}m` : "--"}</div>
          <p className={cn(text.muted, "mt-1")}>Minutes per recipe</p>
        </StatsCard>

        {/* Quick Add */}
        <div className="flex flex-col justify-between bg-brand-200 hover:bg-brand-300 border border-border-brand-light transition-colors p-4 rounded-sm cursor-pointer">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-secondary">
              Quick Action
            </span>
            <Plus className={cn(icon.small, icon.brand)} />
          </div>

          <Button variant="brand" size="sm" asChild className="w-full">
            <Link href="/dashboard/recipes/new">
              <Plus />
              Add Recipe
            </Link>
          </Button>
        </div>
      </div>

      {/* ================================
          STARTER RECIPES
      ================================= */}

      {starterRecipes.length > 0 && (
        <div className={spacing.card}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={text.h3}>Starter Recipes</h2>
              <p className={cn(text.muted, "mt-0.5")}>
                Recipes curated just for you
              </p>
            </div>
          </div>

          <div className="relative -mr-6 md:mx-0">
            {/* <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-linear-to-l from-white to-transparent z-10 md:hidden" /> */}

            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-6 md:px-0 md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {starterRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="min-w-65 snap-start md:min-w-0 self-stretch"
                >
                  <RecipeCard {...recipe} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================================
          PINNED CATEGORIES
      ================================= */}

      {pinnedCategories.length > 0 && (
        <div className={spacing.card}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={text.h3}>Pinned Categories</h2>
              <p className={cn(text.muted, "mt-0.5")}>
                Quick access to your favorite collections
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              asChild
              className="cursor-pointer"
            >
              <Link href="/dashboard/categories">
                View All
                <ArrowRight className={icon.small} />
              </Link>
            </Button>
          </div>

          <div className="relative -mr-6 md:mx-0">
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-linear-to-l from-white to-transparent z-10 md:hidden" />

            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-6 md:px-0 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {pinnedCategories.map((category) => (
                <div
                  key={category.id}
                  className="min-w-65 snap-start md:min-w-0 self-stretch"
                >
                  <CategoryCard
                    id={category.id}
                    name={category.name}
                    description={category.description}
                    isPinned={category.isPinned}
                    recipeCount={category.recipeCategories.length}
                    recipeImages={category.recipeCategories.map(
                      (rc) => rc.recipe.imageUrl,
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================================
          RECENT RECIPES
      ================================= */}

      <div className={spacing.card}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className={text.h3}>Recent Recipes</h2>
            <p className={cn(text.muted, "mt-0.5")}>
              Your latest culinary creations
            </p>
          </div>

          <Button variant="ghost" size="sm" asChild className="cursor-pointer">
            <Link href="/dashboard/recipes">
              View All
              <ArrowRight className={icon.small} />
            </Link>
          </Button>
        </div>

        {recentRecipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-border-light rounded-sm">
            <div className="rounded-sm bg-brand-100 p-2.5 mb-3">
              <Plus className={cn(icon.medium, icon.brand)} />
            </div>

            <h3 className={cn(text.body, "font-semibold mb-0.5")}>
              No recipes yet
            </h3>

            <p className={cn(text.small, "mb-3")}>
              Recipes you add will appear here.
            </p>

            <Button variant="brand" size="sm" asChild>
              <Link href="/dashboard/recipes/new">
                <Plus />
                Add Recipe
              </Link>
            </Button>
          </div>
        ) : (
          <div className={layout.grid3}>
            {recentRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} {...recipe} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
