"use client";

import { format } from "date-fns";
import MealSlot from "./meal-slot";
import {
  MealPlanRecipe,
  MealType,
  Recipe,
} from "@/app/dashboard/meal-plan/types";

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number")
    return new Date(value);
  return new Date(String(value));
}

const MEAL_TYPES: Array<{ type: MealType; label: string; color: string }> = [
  {
    type: "breakfast",
    label: "Breakfast",
    color: "bg-amber-50 border-amber-200",
  },
  { type: "lunch", label: "Lunch", color: "bg-sky-50 border-sky-200" },
  { type: "dinner", label: "Dinner", color: "bg-violet-50 border-violet-200" },
  { type: "snack", label: "Snack", color: "bg-emerald-50 border-emerald-200" },
];

interface DayColumnProps {
  date: Date;
  mealPlanId: string;
  mealPlanRecipes: MealPlanRecipe[];
  allRecipes: Recipe[];
}

export default function DayColumn({
  date,
  mealPlanId,
  mealPlanRecipes,
  allRecipes,
}: DayColumnProps) {
  const isToday =
    format(new Date(), "yyyy-MM-dd") === format(date, "yyyy-MM-dd");

  const dayRecipes = mealPlanRecipes.filter((mpr) => {
    const mprDay = format(toDate(mpr.date), "yyyy-MM-dd");
    const colDay = format(date, "yyyy-MM-dd");
    return mprDay === colDay;
  });

  return (
    <div className="rounded-sm bg-brand-200 border border-border-brand-light backdrop-blur p-2 space-y-2">
      {/* Day Header */}
      <div
        className={`text-center py-2 rounded-sm ${
          isToday
            ? "bg-[#FF6B35] text-white border-[#FF6B35]"
            : "bg-white border-border"
        }`}
      >
        <div
          className={`text-[10px] font-semibold uppercase tracking-wide ${
            isToday ? "text-white/90" : "text-muted-foreground"
          }`}
        >
          {format(date, "EEE")}
        </div>
        <div className="text-xl font-bold leading-none">
          {format(date, "d")}
        </div>
      </div>

      {/* Meal Slots */}
      <div className="space-y-2">
        {MEAL_TYPES.map(({ type, label, color }) => (
          <MealSlot
            key={type}
            date={date}
            mealType={type}
            label={label}
            color={color}
            mealPlanId={mealPlanId}
            recipes={dayRecipes.filter((mpr) => mpr.mealType === type)}
            allRecipes={allRecipes}
          />
        ))}
      </div>
    </div>
  );
}
