"use client";

import { useMemo, useState, useTransition } from "react";
import { X, Clock, Users, Plus } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  addRecipeToMealPlan,
  removeRecipeFromMealPlan,
} from "@/app/dashboard/meal-plan/actions";
import {
  MealPlanRecipe,
  MealType,
  Recipe,
} from "@/app/dashboard/meal-plan/types";
import RecipePickerDialog from "./recipe-picker-dialog";
import { Button } from "../ui/button";

interface MealSlotProps {
  date: Date;
  mealType: MealType;
  label: string;
  color: string;
  mealPlanId: string;
  recipes: MealPlanRecipe[];
  allRecipes: Recipe[];
}

export default function MealSlot({
  date,
  mealType,
  label,
  color,
  mealPlanId,
  recipes,
  allRecipes,
}: MealSlotProps) {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [pending, startTransition] = useTransition();
  const [openPicker, setOpenPicker] = useState(false);

  const hasRecipes = recipes.length > 0;

  const canAcceptDrop = (e: React.DragEvent) =>
    e.dataTransfer.types.includes("recipeId") ||
    e.dataTransfer.types.includes("text/plain");

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const recipeId =
      e.dataTransfer.getData("recipeId") ||
      e.dataTransfer.getData("text/plain");
    if (!recipeId) return;

    try {
      await addRecipeToMealPlan({ mealPlanId, recipeId, date, mealType });
      startTransition(() => router.refresh());
    } catch (error) {
      console.error("Failed to add recipe:", error);
    }
  };

  const handleRemove = async (mealPlanRecipeId: string) => {
    try {
      await removeRecipeFromMealPlan(mealPlanRecipeId);
      startTransition(() => router.refresh());
    } catch (error) {
      console.error("Failed to remove recipe:", error);
    }
  };

  const slotClass = useMemo(() => {
    if (isDragging) return "border-[#FF6B35] bg-[#FF6B35]/5";
    if (hasRecipes) return color;
    return "border-dashed border-muted-foreground/20 bg-muted/20";
  }, [isDragging, hasRecipes, color]);

  return (
    <div
      onDragOver={(e) => {
        if (!canAcceptDrop(e)) return;
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`min-h-27 rounded-sm border border-border-brand-light transition-all ${slotClass}`}
    >
      {/* Header */}
      <div className="px-2 py-2 mb-0.5 flex items-center justify-between">
        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
          {label}
        </div>

        {/* Non-drag option
        <button
          type="button"
          onClick={() => setOpenPicker(true)}
          className="inline-flex items-center gap-1 rounded-sm px-1.5 py-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground hover:bg-white/60 transition"
        >
          <Plus className="h-3 w-3" />
          Add
        </button> */}
      </div>

      {/* Empty State */}
      {!hasRecipes ? (
        <div className="px-2 pb-2">
          <button
            type="button"
            onClick={() => setOpenPicker(true)}
            className="w-full rounded-sm border border-dashed border-border-brand-light bg-white/40 hover:bg-white/60 transition p-2 flex items-center justify-center cursor-pointer"
            aria-label={`Add recipe to ${label}`}
          >
            <Plus className="h-4 w-4 text-brand" />
          </button>
        </div>
      ) : (
        <div className="px-2 pb-2 space-y-1.5">
          {recipes.map((mpr) => (
            <div
              key={mpr.id}
              className="group relative bg-white/90 rounded-sm border border-black/5 hover:bg-white transition overflow-hidden"
            >
              {mpr.recipe.imageUrl && (
                <div className="relative w-full h-20 bg-muted">
                  <Image
                    src={mpr.recipe.imageUrl}
                    alt={mpr.recipe.title}
                    fill
                    className="object-cover"
                  />

                  <Button
                    onClick={() => handleRemove(mpr.id)}
                    variant="destructive-light"
                    size="icon-xs"
                    className="absolute top-1 right-1 h-4.5 w-4.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    aria-label="Remove"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}

              <div className="p-2">
                <p className="text-xs font-semibold line-clamp-1 leading-tight">
                  {mpr.recipe.title}
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                  {mpr.recipe.totalTime ? (
                    <span className="inline-flex items-center gap-1 rounded-sm bg-muted px-1.5 py-0.5">
                      <Clock className="h-3 w-3" />
                      {mpr.recipe.totalTime}m
                    </span>
                  ) : null}

                  {mpr.customServings || mpr.recipe.servings ? (
                    <span className="inline-flex items-center gap-1 rounded-sm bg-muted px-1.5 py-0.5">
                      <Users className="h-3 w-3" />
                      {mpr.customServings || mpr.recipe.servings}
                    </span>
                  ) : null}

                  {mpr.customServings &&
                  mpr.customServings !== mpr.recipe.servings ? (
                    <span className="inline-flex items-center rounded-sm bg-[#FF6B35]/10 text-[#FF6B35] px-1.5 py-0.5 font-semibold">
                      custom
                    </span>
                  ) : null}
                </div>

                {!mpr.recipe.imageUrl && (
                  <Button
                    onClick={() => handleRemove(mpr.id)}
                    variant="destructive-light"
                    size="icon-xs"
                    className="absolute top-1 right-1 h-4.5 w-4.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    aria-label="Remove"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <RecipePickerDialog
        open={openPicker}
        onOpenChange={setOpenPicker}
        title={`Add to ${label}`}
        mealPlanId={mealPlanId}
        date={date}
        mealType={mealType}
        recipes={allRecipes}
        disabled={pending}
      />
    </div>
  );
}
