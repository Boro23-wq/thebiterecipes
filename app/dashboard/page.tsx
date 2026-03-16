import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { recipes, categories } from "@/db/schema";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { RecipeCard } from "@/components/recipe-card";
import { CategoryCard } from "@/components/category-card";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/ui/card-wrapper";
import { getCookingStats } from "@/app/dashboard/actions";
import { Flame, TrendingUp, Trophy, ChefHat } from "lucide-react";
import { CookingStatsChart } from "@/components/cooking-stats-chart";
import RecipeDiscovery from "@/components/recipe-discovery";
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
  // COOKING STATS
  // ================================

  const cookingStats = await getCookingStats();

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
      {/* Stats */}
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] md:grid md:grid-cols-3 lg:grid-cols-5">
        {/* Total Recipes */}
        <StatsCard className="min-w-44 snap-start shrink-0 md:min-w-0 md:shrink">
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
        <StatsCard className="min-w-44 snap-start shrink-0 md:min-w-0 md:shrink">
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
        <StatsCard className="min-w-44 snap-start shrink-0 md:min-w-0 md:shrink">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-secondary">
              Avg Cook Time
            </span>
            <Clock className={cn(icon.small, icon.brand)} />
          </div>
          <div className={text.statValue}>{avgTime ? `${avgTime}m` : "--"}</div>
          <p className={cn(text.muted, "mt-1")}>Minutes per recipe</p>
        </StatsCard>

        {/* Times Cooked */}
        <StatsCard className="min-w-44 snap-start shrink-0 md:min-w-0 md:shrink">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-secondary">
              Times Cooked
            </span>
            <Flame className={cn(icon.small, icon.brand)} />
          </div>
          <div className={text.statValue}>
            {cookingStats?.totalCompleted ?? 0}
          </div>
          <p className={cn(text.muted, "mt-1")}>
            {cookingStats?.thisWeekCount ?? 0} this week
          </p>
        </StatsCard>

        {/* Quick Add */}
        <div className="min-w-44 snap-start shrink-0 md:min-w-0 md:shrink flex flex-col justify-between bg-brand-200 hover:bg-brand-300 border border-border-brand-light transition-colors p-4 rounded-sm cursor-pointer">
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
          RECIPE DISCOVERY
      ================================= */}

      <div className={spacing.card}>
        <RecipeDiscovery />
      </div>

      {/* ================================
          COOKING ACTIVITY
      ================================= */}

      {cookingStats && cookingStats.totalCompleted > 0 && (
        <div className={spacing.card}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={text.h3}>Cooking Activity</h2>
              <p className={cn(text.muted, "mt-0.5")}>
                Your cooking journey over the last 30 days
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Chart */}
            <div className="lg:col-span-2 bg-white border border-brand-200 rounded-sm p-5">
              <CookingStatsChart dailyActivity={cookingStats.dailyActivity} />
            </div>

            {/* Most Cooked */}
            <div className="bg-white border border-brand-200 rounded-sm p-5">
              <h3
                className={cn(
                  text.body,
                  "font-semibold mb-4 flex items-center gap-2",
                )}
              >
                <Trophy className="w-4 h-4 text-brand" />
                Most Cooked
              </h3>

              <div className="space-y-3">
                {cookingStats.mostCooked.map((item, idx) => (
                  <Link
                    key={item.recipeId}
                    href={`/dashboard/recipes/${item.recipeId}`}
                    className="flex items-center gap-3 group"
                  >
                    <span
                      className={cn(
                        "w-6 h-6 rounded-sm flex items-center justify-center text-xs font-bold shrink-0",
                        idx === 0
                          ? "bg-brand text-white"
                          : "bg-brand-100 text-brand",
                      )}
                    >
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate group-hover:text-brand transition-colors">
                        {item.title}
                      </p>
                      <p className="text-xs text-text-muted">
                        Cooked {item.cookCount}{" "}
                        {item.cookCount === 1 ? "time" : "times"}
                      </p>
                    </div>
                  </Link>
                ))}

                {cookingStats.mostCooked.length === 0 && (
                  <p className={cn(text.muted, "text-center py-4")}>
                    Cook some recipes to see your favorites here!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Quick stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-linear-to-br from-brand-50 to-brand-100 border border-brand-200 rounded-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-sm bg-brand/10 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-brand" />
                </div>
              </div>
              <p className="text-2xl font-bold text-text-primary">
                {cookingStats.totalCompleted}
              </p>
              <p className="text-xs text-text-secondary mt-0.5">Total Cooks</p>
              {cookingStats.totalCompleted >= 10 && (
                <span className="inline-block mt-2 text-[10px] font-semibold bg-brand/10 text-brand px-1.5 py-0.5 rounded-sm">
                  Home Chef
                </span>
              )}
              {cookingStats.totalCompleted >= 50 && (
                <span className="inline-block mt-2 text-[10px] font-semibold bg-brand/10 text-brand px-1.5 py-0.5 rounded-sm">
                  Master Chef
                </span>
              )}
            </div>

            <div className="bg-linear-to-br from-brand-50 to-brand-100 border border-brand-200 rounded-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-sm bg-brand/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-brand" />
                </div>
              </div>
              <p className="text-2xl font-bold text-text-primary">
                {cookingStats.thisWeekCount}
              </p>
              <p className="text-xs text-text-secondary mt-0.5">This Week</p>
              {cookingStats.thisWeekCount >= 3 && (
                <span className="inline-block mt-2 text-[10px] font-semibold bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded-sm">
                  On a streak!
                </span>
              )}
            </div>

            <div className="bg-linear-to-br from-brand-50 to-brand-100 border border-brand-200 rounded-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-sm bg-brand/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-brand" />
                </div>
              </div>
              <p className="text-2xl font-bold text-text-primary">
                {cookingStats.totalCookingMinutes >= 60
                  ? `${Math.floor(cookingStats.totalCookingMinutes / 60)}h ${cookingStats.totalCookingMinutes % 60}m`
                  : `${cookingStats.totalCookingMinutes}m`}
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                Time in Kitchen
              </p>
            </div>

            <div className="bg-linear-to-br from-brand-50 to-brand-100 border border-brand-200 rounded-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-sm bg-brand/10 flex items-center justify-center">
                  <ChefHat className="w-4 h-4 text-brand" />
                </div>
              </div>
              <p className="text-2xl font-bold text-text-primary">
                {cookingStats.completionRate}%
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                Completion Rate
              </p>
              <div className="mt-2 h-1.5 bg-brand-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand rounded-full transition-all"
                  style={{ width: `${cookingStats.completionRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

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
