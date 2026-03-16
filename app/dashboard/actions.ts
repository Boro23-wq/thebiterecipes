"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import {
  cookSessions,
  recipes,
  recipeIngredients,
  recipeInstructions,
} from "@/db/schema";
import { eq, and, sql, gte } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";

interface DiscoveryImport {
  title: string;
  description?: string;
  servings?: number;
  prepTime?: number;
  cookTime?: number;
  cuisine?: string;
  category?: string;
  calories?: number;
  protein?: number;
  imageUrl?: string;
  ingredients: Array<string | { amount?: string; name: string }>;
  instructions: string[];
}

export async function getCookingStats() {
  const { userId } = await auth();
  if (!userId) return null;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Total sessions
  const [totals] = await db
    .select({
      totalSessions: sql<number>`count(*)::int`,
      completedSessions: sql<number>`count(*) filter (where ${cookSessions.status} = 'completed')::int`,
      totalCookingTime: sql<number>`coalesce(sum(${cookSessions.durationSeconds}) filter (where ${cookSessions.status} = 'completed'), 0)::int`,
    })
    .from(cookSessions)
    .where(eq(cookSessions.userId, userId));

  // This week's sessions
  const [thisWeek] = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(cookSessions)
    .where(
      and(
        eq(cookSessions.userId, userId),
        eq(cookSessions.status, "completed"),
        gte(cookSessions.startedAt, sevenDaysAgo),
      ),
    );

  // Most cooked recipes (top 5)
  const mostCooked = await db
    .select({
      recipeId: cookSessions.recipeId,
      title: recipes.title,
      imageUrl: recipes.imageUrl,
      cookCount: sql<number>`count(*)::int`,
      lastCooked: sql<string>`max(${cookSessions.startedAt})`,
    })
    .from(cookSessions)
    .innerJoin(recipes, eq(cookSessions.recipeId, recipes.id))
    .where(
      and(
        eq(cookSessions.userId, userId),
        eq(cookSessions.status, "completed"),
      ),
    )
    .groupBy(cookSessions.recipeId, recipes.title, recipes.imageUrl)
    .orderBy(sql`count(*) desc`)
    .limit(5);

  // Daily cooking activity (last 30 days)
  const dailyActivity = await db
    .select({
      date: sql<string>`date_trunc('day', ${cookSessions.startedAt})::date::text`,
      count: sql<number>`count(*)::int`,
    })
    .from(cookSessions)
    .where(
      and(
        eq(cookSessions.userId, userId),
        eq(cookSessions.status, "completed"),
        gte(cookSessions.startedAt, thirtyDaysAgo),
      ),
    )
    .groupBy(sql`date_trunc('day', ${cookSessions.startedAt})`)
    .orderBy(sql`date_trunc('day', ${cookSessions.startedAt})`);

  // Completion rate
  const completionRate =
    totals.totalSessions > 0
      ? Math.round((totals.completedSessions / totals.totalSessions) * 100)
      : 0;

  return {
    totalCompleted: totals.completedSessions,
    totalCookingMinutes: Math.round(totals.totalCookingTime / 60),
    thisWeekCount: thisWeek.count,
    completionRate,
    mostCooked,
    dailyActivity,
  };
}

export async function importRecipeFromDiscovery(data: DiscoveryImport) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const totalTime =
    data.prepTime && data.cookTime
      ? data.prepTime + data.cookTime
      : (data.cookTime ?? data.prepTime ?? undefined);

  const [recipe] = await db
    .insert(recipes)
    .values({
      userId: user.id,
      title: data.title,
      description: data.description,
      servings: data.servings,
      prepTime: data.prepTime,
      cookTime: data.cookTime,
      totalTime,
      cuisine: data.cuisine,
      category: data.category,
      imageUrl: data.imageUrl,
      calories: data.calories,
      protein: data.protein,
      source: "AI Discovery",
      isSeeded: false,
    })
    .returning({ id: recipes.id });

  if (data.ingredients.length > 0) {
    await db.insert(recipeIngredients).values(
      data.ingredients.map((ing, idx) => {
        if (typeof ing === "string") {
          // Saved/seed recipes come as strings
          return {
            recipeId: recipe.id,
            ingredient: ing,
            amount: null,
            order: idx,
          };
        }
        // AI recipes come as { amount, name }
        return {
          recipeId: recipe.id,
          ingredient: ing.name,
          amount: ing.amount || null,
          order: idx,
        };
      }),
    );
  }

  if (data.instructions.length > 0) {
    await db.insert(recipeInstructions).values(
      data.instructions.map((step, idx) => ({
        recipeId: recipe.id,
        step,
        order: idx,
      })),
    );
  }

  return { id: recipe.id };
}
