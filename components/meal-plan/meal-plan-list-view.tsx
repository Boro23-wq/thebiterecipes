"use client";

import { format } from "date-fns";
import { Clock, Users, X, Plus } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { removeRecipeFromMealPlan } from "@/app/dashboard/meal-plan/actions";
import { MealPlan, MealType, Recipe } from "@/app/dashboard/meal-plan/types";
import RecipePickerDialog from "./recipe-picker-dialog";
import { Button } from "@/components/ui/button";

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

const MEAL_COLORS: Record<MealType, string> = {
  breakfast: "bg-amber-100 text-amber-800",
  lunch: "bg-sky-100 text-sky-800",
  dinner: "bg-violet-100 text-violet-800",
  snack: "bg-emerald-100 text-emerald-800",
};

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export default function MealPlanListView({
  mealPlan,
  days,
  recipes,
}: {
  mealPlan: MealPlan;
  days: Date[];
  recipes: Recipe[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // picker state (reusing RecipePickerDialog)
  const [openPicker, setOpenPicker] = useState(false);
  const [pickerDay, setPickerDay] = useState<Date | null>(null);
  const [pickerMealType, setPickerMealType] = useState<MealType>("dinner");

  function openAdd(day: Date, mealType: MealType = "dinner") {
    setPickerDay(day);
    setPickerMealType(mealType);
    setOpenPicker(true);
  }

  const handleRemove = async (mealPlanRecipeId: string) => {
    try {
      await removeRecipeFromMealPlan(mealPlanRecipeId);
      startTransition(() => router.refresh());
    } catch (error) {
      console.error("Failed to remove recipe:", error);
    }
  };

  const recipesByDay = useMemo(() => {
    return days.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayRecipes = (mealPlan.mealPlanRecipes || []).filter(
        (mpr) => format(new Date(mpr.date), "yyyy-MM-dd") === dayStr,
      );

      return { date: day, recipes: dayRecipes };
    });
  }, [days, mealPlan.mealPlanRecipes]);

  // ✅ render ALL days so list view can add meals even when empty
  return (
    <>
      <div className="space-y-4">
        {recipesByDay.map(({ date, recipes: dayMeals }) => {
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
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-sm font-semibold">
                      {format(date, "EEEE")}
                    </span>
                    <span className="text-sm ml-2 opacity-80">
                      {format(date, "MMM d")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isToday && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-sm bg-white/20">
                        Today
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Body */}
              {dayMeals.length === 0 ? (
                <div className="p-4">
                  <div className="rounded-sm border border-dashed border-border-brand-subtle bg-brand-50 p-4">
                    <p className="text-sm text-muted-foreground">
                      Nothing planned yet.
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {MEAL_TYPES.map((mt) => (
                        <button
                          key={mt}
                          type="button"
                          onClick={() => openAdd(date, mt)}
                          className={[
                            "inline-flex items-center gap-1.5",
                            "rounded-sm border border-border-light",
                            "bg-white/70 hover:bg-white transition",
                            "px-2.5 py-1.5 text-xs font-semibold cursor-pointer",
                          ].join(" ")}
                        >
                          <Plus className="h-3.5 w-3.5 text-brand" />
                          Add {MEAL_LABELS[mt]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-border-brand-light">
                  {dayMeals.map((mpr) => (
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
                                  MEAL_COLORS[mpr.mealType as MealType]
                                }`}
                              >
                                {MEAL_LABELS[mpr.mealType as MealType]}
                              </span>

                              <h3 className="font-semibold text-sm leading-tight">
                                {mpr.recipe.title}
                              </h3>
                            </div>

                            <Button
                              onClick={() => handleRemove(mpr.id)}
                              disabled={pending}
                              variant="destructive"
                              size="xs"
                              className="rounded-sm opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity cursor-pointer"
                              aria-label="Remove"
                            >
                              <X />
                            </Button>
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

                  {/* Optional: quick add row at bottom when there are already meals */}
                  <div className="p-3">
                    <div className="flex flex-wrap gap-2">
                      {MEAL_TYPES.map((mt) => (
                        <button
                          key={mt}
                          type="button"
                          onClick={() => openAdd(date, mt)}
                          className={[
                            "inline-flex items-center gap-1.5",
                            "rounded-sm border border-border-light",
                            "bg-white/70 hover:bg-white transition",
                            "px-2.5 py-1.5 text-xs font-semibold cursor-pointer",
                          ].join(" ")}
                        >
                          <Plus className="h-3.5 w-3.5 text-brand" />
                          Add {MEAL_LABELS[mt]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <RecipePickerDialog
        open={openPicker}
        onOpenChange={setOpenPicker}
        title={`Add to ${MEAL_LABELS[pickerMealType]}`}
        mealPlanId={mealPlan.id}
        date={pickerDay ?? days[0]}
        mealType={pickerMealType}
        recipes={recipes}
        disabled={pending}
      />
    </>
  );
}
