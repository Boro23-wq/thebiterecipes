"use client";

import { useState } from "react";
import {
  Users,
  Clock,
  TrendingUp,
  Star,
  Activity,
  Wheat,
  Droplet,
} from "lucide-react";
import { CardSm } from "@/components/ui/card-wrapper";
import { IngredientsList } from "@/components/ingredients-list";
import { cn } from "@/lib/utils";
import { text, icon, spacing } from "@/lib/design-tokens";
import { usePreferences } from "@/lib/preferences-context";

interface Ingredient {
  id: number;
  ingredient: string;
  amount?: string | null;
  order: number;
}

interface Instruction {
  id: number;
  step: string;
  order: number;
}

interface RecipeDetailClientProps {
  recipe: {
    servings?: number | null;
    totalTime?: number | null;
    calories?: number | null;
    protein?: number | null;
    carbs?: number | null;
    fat?: number | null;
    rating?: number | null;
    notes?: string | null;
  };
  ingredients: Ingredient[];
  instructions: Instruction[];
}

export function RecipeDetailClient({
  recipe,
  ingredients,
  instructions,
}: RecipeDetailClientProps) {
  const { defaultServings } = usePreferences();

  const baseServings = recipe.servings || defaultServings;
  const [currentServings, setCurrentServings] = useState(baseServings);
  const servingMultiplier = currentServings / baseServings;

  const [activeTab, setActiveTab] = useState<
    "ingredients" | "instructions" | "notes"
  >("ingredients");

  return (
    <>
      {/* Recipe Overview Section */}
      <section className="mb-8">
        <div className="bg-white shadow-sm shadow-black/10 rounded-md p-6">
          <h3 className={cn(text.h2, "flex items-center gap-2 mb-6")}>
            <span className="w-1 h-6 bg-brand" />
            Nutrition & Details
          </h3>

          {recipe.totalTime ||
          baseServings ||
          recipe.calories ||
          recipe.protein ||
          recipe.carbs ||
          recipe.fat ||
          recipe.rating ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {!!recipe.totalTime && (
                <div className="flex flex-col gap-1 p-3 bg-brand-100 rounded-sm">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Clock className={icon.base} />
                    <span className="text-xs">Total Time</span>
                  </div>
                  <span className="text-lg font-semibold text-text-primary">
                    {recipe.totalTime}m
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-1 p-3 bg-brand-100 rounded-sm">
                <div className="flex items-center gap-2 text-text-secondary">
                  <Users className={icon.base} />
                  <span className="text-xs">Servings</span>
                </div>
                <span className="text-lg font-semibold text-text-primary">
                  {currentServings}
                  {servingMultiplier !== 1 && (
                    <span className="text-sm text-text-secondary ml-1">
                      (
                      {servingMultiplier % 1 === 0
                        ? servingMultiplier
                        : servingMultiplier.toFixed(1)}
                      x)
                    </span>
                  )}
                </span>
              </div>

              {!!recipe.calories && (
                <div className="flex flex-col gap-1 p-3 bg-brand-100 rounded-sm">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <TrendingUp className={icon.base} />
                    <span className="text-xs">Calories</span>
                  </div>
                  <span className="text-lg font-semibold text-text-primary">
                    {Math.round(recipe.calories * servingMultiplier)}
                  </span>
                </div>
              )}

              {!!recipe.protein && (
                <div className="flex flex-col gap-1 p-3 bg-brand-100 rounded-sm">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Activity className={icon.base} />
                    <span className="text-xs">Protein</span>
                  </div>
                  <span className="text-lg font-semibold text-text-primary">
                    {Math.round(recipe.protein * servingMultiplier)}g
                  </span>
                </div>
              )}

              {!!recipe.carbs && (
                <div className="flex flex-col gap-1 p-3 bg-brand-100 rounded-sm">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Wheat className={icon.base} />
                    <span className="text-xs">Carbs</span>
                  </div>
                  <span className="text-lg font-semibold text-text-primary">
                    {Math.round(recipe.carbs * servingMultiplier)}g
                  </span>
                </div>
              )}

              {!!recipe.fat && (
                <div className="flex flex-col gap-1 p-3 bg-brand-100 rounded-sm">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Droplet className={icon.base} />
                    <span className="text-xs">Fat</span>
                  </div>
                  <span className="text-lg font-semibold text-text-primary">
                    {Math.round(recipe.fat * servingMultiplier)}g
                  </span>
                </div>
              )}

              {!!recipe.rating && (
                <div className="flex flex-col gap-1 p-3 bg-brand-highlight rounded-sm">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Star
                      className={cn(icon.base, "fill-[#F7B801] text-[#F7B801]")}
                    />
                    <span className="text-xs">Rating</span>
                  </div>
                  <span className="text-lg font-semibold text-text-primary">
                    {recipe.rating}/5
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-text-muted">
              No nutrition or timing info available for this recipe.
            </p>
          )}
        </div>
      </section>

      {/* Tab Buttons */}
      <div className="flex items-center bg-brand-100 rounded-sm p-0.5 w-fit mb-6">
        <button
          onClick={() => setActiveTab("ingredients")}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-sm transition-all cursor-pointer",
            activeTab === "ingredients"
              ? "bg-white text-text-primary shadow-sm"
              : "text-text-secondary hover:text-text-primary",
          )}
        >
          Ingredients
        </button>

        <button
          onClick={() => setActiveTab("instructions")}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-sm transition-all cursor-pointer",
            activeTab === "instructions"
              ? "bg-white text-text-primary shadow-sm"
              : "text-text-secondary hover:text-text-primary",
          )}
        >
          Instructions
        </button>

        <button
          onClick={() => setActiveTab("notes")}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-sm transition-all cursor-pointer",
            activeTab === "notes"
              ? "bg-white text-text-primary shadow-sm"
              : "text-text-secondary hover:text-text-primary",
          )}
        >
          Notes
        </button>
      </div>

      {/* Ingredients */}
      {activeTab === "ingredients" && (
        <CardSm className="shadow-sm shadow-black/10 p-6">
          {ingredients.length > 0 ? (
            <IngredientsList
              ingredients={ingredients}
              baseServings={baseServings}
              currentServings={currentServings}
              onServingsChange={setCurrentServings}
            />
          ) : (
            <>
              <h3 className={cn(text.h2, "flex items-center gap-2 mb-4")}>
                <span className="w-1 h-6 bg-brand" />
                Ingredients
              </h3>
              <p className="text-sm text-text-muted italic">
                No ingredients available for this recipe.
              </p>
            </>
          )}
        </CardSm>
      )}

      {/* Instructions */}
      {activeTab === "instructions" && (
        <CardSm className="shadow-sm shadow-black/10 p-6">
          <h3 className={cn(text.h2, "mb-8 flex items-center gap-2")}>
            <span className="w-1 h-6 bg-brand" />
            Instructions
          </h3>

          {instructions.length > 0 ? (
            <ol className={spacing.cardLarge}>
              {instructions.map((inst) => (
                <li key={inst.id} className="flex gap-4 wrap-break-word">
                  <span className="shrink-0 w-8 h-8 rounded-sm bg-brand text-white flex items-center justify-center text-sm font-semibold shadow-brand-focus">
                    {inst.order}
                  </span>
                  <span
                    className={cn(text.body, "flex-1 pt-1 leading-relaxed")}
                  >
                    {inst.step}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-text-muted italic">
              No instructions available for this recipe.
            </p>
          )}
        </CardSm>
      )}

      {/* Notes */}
      {activeTab === "notes" && (
        <CardSm className="shadow-sm shadow-black/10 p-6">
          <h3 className={cn(text.h2, "mb-8 flex items-center gap-2")}>
            <span className="w-1 h-6 bg-brand" />
            Notes
          </h3>

          {recipe.notes ? (
            <p
              className={cn(
                text.body,
                "leading-relaxed bg-brand-100 p-4 rounded-sm whitespace-pre-wrap wrap-break-word",
              )}
            >
              {recipe.notes}
            </p>
          ) : (
            <p className="text-sm text-text-muted italic">No notes added yet</p>
          )}
        </CardSm>
      )}
    </>
  );
}
