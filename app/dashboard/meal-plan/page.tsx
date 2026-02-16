import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { mealPlans, recipes } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { createMealPlan } from "./actions";
import { ViewMode } from "@/components/meal-plan/meal-plan-calendar";
import MealPlanCalendar from "@/components/meal-plan/meal-plan-calendar";

function getWeek(weekOffset: number = 0) {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));

  // Apply week offset
  monday.setDate(monday.getDate() + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { startDate: monday, endDate: sunday };
}

export default async function MealPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; view?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const params = await searchParams;
  const weekOffset = parseInt(params.week ?? "0");
  const { startDate, endDate } = getWeek(weekOffset);
  const viewMode = (params.view ?? "calendar") as ViewMode;

  let mealPlan = await db.query.mealPlans.findFirst({
    where: and(
      eq(mealPlans.userId, user.id),
      gte(mealPlans.startDate, startDate),
      lte(mealPlans.endDate, endDate),
    ),
    with: {
      mealPlanRecipes: {
        with: { recipe: true },
        orderBy: (mpr, { asc }) => [asc(mpr.order)],
      },
      groceryList: {
        with: {
          items: {
            orderBy: (gli, { asc }) => [asc(gli.order)],
          },
        },
      },
    },
  });

  if (!mealPlan) {
    const week = `Week of ${startDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })}`;

    const newPlan = await createMealPlan({ startDate, endDate, name: week });

    mealPlan = await db.query.mealPlans.findFirst({
      where: eq(mealPlans.id, newPlan.id),
      with: {
        mealPlanRecipes: {
          with: { recipe: true },
          orderBy: (mpr, { asc }) => [asc(mpr.order)],
        },
        groceryList: {
          with: {
            items: {
              orderBy: (gli, { asc }) => [asc(gli.order)],
            },
          },
        },
      },
    });
  }

  const userRecipes = await db.query.recipes.findMany({
    where: eq(recipes.userId, user.id),
    orderBy: (recipesTable, { desc }) => [desc(recipesTable.createdAt)],
    limit: 50,
  });

  return (
    <div className="container mx-auto px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Meal Planning</h1>
        <p className="text-muted-foreground">
          Drag recipes onto your calendar — or click Add
        </p>
      </div>

      <MealPlanCalendar
        mealPlan={mealPlan!}
        recipes={userRecipes}
        startDate={startDate}
        endDate={endDate}
        weekOffset={weekOffset}
        viewMode={viewMode}
      />
    </div>
  );
}
