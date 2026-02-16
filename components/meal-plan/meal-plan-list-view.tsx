// components/meal-plan/meal-plan-list-view.tsx
"use client";

import { format } from "date-fns";
import { Clock, Users, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { removeRecipeFromMealPlan } from "@/app/dashboard/meal-plan/actions";
import { MealPlan } from "@/app/dashboard/meal-plan/types";

const MEAL_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

const MEAL_COLORS: Record<string, string> = {
  breakfast: "bg-amber-100 text-amber-800",
  lunch: "bg-sky-100 text-sky-800",
  dinner: "bg-violet-100 text-violet-800",
  snack: "bg-emerald-100 text-emerald-800",
};

export default function MealPlanListView({
  mealPlan,
  days,
}: {
  mealPlan: MealPlan;
  days: Date[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleRemove = async (mealPlanRecipeId: string) => {
    try {
      await removeRecipeFromMealPlan(mealPlanRecipeId);
      startTransition(() => router.refresh());
    } catch (error) {
      console.error("Failed to remove recipe:", error);
    }
  };

  const recipesByDay = days.map((day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const dayRecipes = (mealPlan.mealPlanRecipes || []).filter(
      (mpr) => format(new Date(mpr.date), "yyyy-MM-dd") === dayStr,
    );

    return {
      date: day,
      recipes: dayRecipes,
    };
  });

  const daysWithRecipes = recipesByDay.filter((d) => d.recipes.length > 0);

  if (daysWithRecipes.length === 0) {
    return (
      <div className="rounded-sm border border-dashed border-border-brand-subtle bg-brand-50 p-12 text-center">
        <p className="text-sm text-muted-foreground">
          No meals planned yet. Add recipes to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {daysWithRecipes.map(({ date, recipes }) => {
        const isToday =
          format(new Date(), "yyyy-MM-dd") === format(date, "yyyy-MM-dd");

        return (
          <div
            key={date.toISOString()}
            className="rounded-sm border border-border-brand-light bg-white/60 overflow-hidden"
          >
            {/* Day Header */}
            <div
              className={`px-4 py-2 border-b border-border-brand-light ${
                isToday
                  ? "bg-brand text-white font-semibold"
                  : "bg-brand-100 text-foreground"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold">
                    {format(date, "EEEE")}
                  </span>
                  <span className="text-sm ml-2 opacity-80">
                    {format(date, "MMM d")}
                  </span>
                </div>
                {isToday && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-sm bg-white/20">
                    Today
                  </span>
                )}
              </div>
            </div>

            {/* Meals */}
            <div className="divide-y divide-border-brand-light">
              {recipes.map((mpr) => (
                <div
                  key={mpr.id}
                  className="p-3 hover:bg-muted/20 transition group"
                >
                  <div className="flex items-start gap-3">
                    {/* Recipe Image */}
                    {mpr.recipe.imageUrl && (
                      <div className="relative h-16 w-16 rounded-sm overflow-hidden bg-muted shrink-0">
                        <Image
                          src={mpr.recipe.imageUrl}
                          alt={mpr.recipe.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}

                    {/* Recipe Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span
                            className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-sm mb-1 ${
                              MEAL_COLORS[mpr.mealType]
                            }`}
                          >
                            {MEAL_LABELS[mpr.mealType]}
                          </span>
                          <h3 className="font-semibold text-sm leading-tight">
                            {mpr.recipe.title}
                          </h3>
                        </div>

                        <button
                          onClick={() => handleRemove(mpr.id)}
                          disabled={pending}
                          className="p-1 hover:bg-muted rounded-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          aria-label="Remove"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        {mpr.recipe.totalTime && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {mpr.recipe.totalTime}m
                          </span>
                        )}
                        {(mpr.customServings || mpr.recipe.servings) && (
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {mpr.customServings || mpr.recipe.servings}
                          </span>
                        )}
                        {mpr.customServings &&
                          mpr.customServings !== mpr.recipe.servings && (
                            <span className="inline-flex items-center rounded-sm bg-[#FF6B35]/10 text-[#FF6B35] px-1.5 py-0.5 font-semibold">
                              custom
                            </span>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
