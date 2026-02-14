import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { recipes, categories } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { RecipeCard } from "@/components/recipe-card";
import { CategoryCard } from "@/components/category-card";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/ui/card-wrapper";
import {
  BookOpen,
  Plus,
  Heart,
  Clock,
  ArrowRight,
  FolderOpen,
} from "lucide-react";
import Link from "next/link";
import { spacing, text, layout, icon } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch pinned categories
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

  // Fetch recent recipes
  const userRecipes = await db
    .select()
    .from(recipes)
    .where(eq(recipes.userId, user.id))
    .orderBy(desc(recipes.createdAt))
    .limit(6);

  const totalRecipes = userRecipes.length;
  const favoriteRecipes = userRecipes.filter((r) => r.isFavorite).length;

  const recipesWithTime = userRecipes.filter((r) => r.totalTime);
  const avgTime =
    recipesWithTime.length > 0
      ? Math.round(
          recipesWithTime.reduce((sum, r) => sum + (r.totalTime || 0), 0) /
            recipesWithTime.length,
        )
      : 0;

  return (
    <div className={spacing.section}>
      {/* Header */}
      <div>
        <h1 className={text.h1}>Welcome back, {user.firstName || "Chef"}!</h1>
        <p className={cn(text.small, "mt-0.5")}>
          Here&apos;s an overview of your recipe collection
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className={layout.grid4}>
        {/* Total Recipes */}
        <StatsCard>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-secondary">
              Total Recipes
            </span>
            <BookOpen className={cn(icon.small, icon.brand)} />
          </div>
          <div className={text.h1}>{totalRecipes}</div>
          <p className={cn(text.muted, "mt-0.5")}>In your collection</p>
        </StatsCard>

        {/* Favorites */}
        <StatsCard>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-secondary">
              Favorites
            </span>
            <Heart className={cn(icon.small, icon.brand)} />
          </div>
          <div className={text.h1}>{favoriteRecipes}</div>
          <p className={cn(text.muted, "mt-0.5")}>Marked as favorite</p>
        </StatsCard>

        {/* Average Cook Time */}
        <StatsCard>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-secondary">
              Avg Cook Time
            </span>
            <Clock className={cn(icon.small, icon.brand)} />
          </div>
          <div className={text.h1}>{avgTime > 0 ? `${avgTime}m` : "--"}</div>
          <p className={cn(text.muted, "mt-0.5")}>Minutes per recipe</p>
        </StatsCard>

        {/* Quick Action */}
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

      {/* Pinned Categories Section */}
      {pinnedCategories.length > 0 && (
        <div className={spacing.card}>
          <div className="flex items-center justify-between mb-4">
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
              className="text-brand hover:text-brand hover:bg-brand-50 cursor-pointer"
            >
              <Link href="/dashboard/categories">
                <FolderOpen className={icon.small} />
                View All
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {pinnedCategories.map((category) => (
              <CategoryCard
                key={category.id}
                id={category.id}
                name={category.name}
                description={category.description}
                isPinned={category.isPinned}
                recipeCount={category.recipeCategories.length}
                recipeImages={category.recipeCategories.map(
                  (rc) => rc.recipe.imageUrl,
                )}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent Recipes Section */}
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

        {userRecipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-border-light rounded-sm">
            <div className="rounded-sm bg-brand-100 p-2.5 mb-3">
              <Plus className={cn(icon.medium, icon.brand)} />
            </div>
            <h3 className={cn(text.body, "font-semibold mb-0.5")}>
              No recipes yet
            </h3>
            <p className={cn(text.small, "mb-3")}>
              Let&apos;s add your first recipe!
            </p>
            <Button
              variant="brand"
              size="sm"
              asChild
              className="cursor-pointer"
            >
              <Link href="/dashboard/recipes/new">
                <Plus />
                Add Recipe
              </Link>
            </Button>
          </div>
        ) : (
          <div className={layout.grid3}>
            {userRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                id={recipe.id}
                title={recipe.title}
                imageUrl={recipe.imageUrl}
                prepTime={recipe.prepTime}
                cookTime={recipe.cookTime}
                totalTime={recipe.totalTime}
                servings={recipe.servings}
                difficulty={recipe.difficulty}
                cuisine={recipe.cuisine}
                category={recipe.category}
                calories={recipe.calories}
                isFavorite={recipe.isFavorite}
                rating={recipe.rating}
                createdAt={recipe.createdAt}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
