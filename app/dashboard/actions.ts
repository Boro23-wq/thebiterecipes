"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { cookSessions, recipes } from "@/db/schema";
import { eq, and, desc, sql, gte } from "drizzle-orm";

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
