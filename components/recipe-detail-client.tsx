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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IngredientsList } from "@/components/ingredients-list";
import { cn } from "@/lib/utils";
import { text, icon, spacing } from "@/lib/design-tokens";

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
  const [servingMultiplier, setServingMultiplier] = useState(1);

  const scaledServings = recipe.servings
    ? Math.round(recipe.servings * servingMultiplier)
    : null;

  return (
    <>
      {/* Recipe Overview Section */}
      <section className="mb-8">
        <div className="bg-white shadow-xs rounded-md p-6">
          <h3 className={cn(text.h2, "flex items-center gap-2 mb-6")}>
            <span className="w-1 h-6 bg-brand" />
            Nutrition & Details
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {recipe.totalTime && (
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

            {recipe.servings && (
              <div className="flex flex-col gap-1 p-3 bg-brand-100 rounded-sm">
                <div className="flex items-center gap-2 text-text-secondary">
                  <Users className={icon.base} />
                  <span className="text-xs">Servings</span>
                </div>
                <span className="text-lg font-semibold text-text-primary">
                  {scaledServings}
                  {servingMultiplier !== 1 && (
                    <span className="text-sm text-text-secondary ml-1">
                      ({servingMultiplier}x)
                    </span>
                  )}
                </span>
              </div>
            )}

            {recipe.calories && (
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

            {recipe.protein && (
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

            {recipe.carbs && (
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

            {recipe.fat && (
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

            {recipe.rating && (
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
        </div>
      </section>

      {/* Tabs Section */}
      <Tabs defaultValue="ingredients" className="w-full">
        <TabsList className="grid w-full grid-cols-3 gap-1.5 rounded-md bg-brand-300 p-1.5">
          <TabsTrigger
            value="ingredients"
            className="data-[state=active]:bg-brand data-[state=active]:text-white cursor-pointer"
          >
            Ingredients
          </TabsTrigger>

          <TabsTrigger
            value="instructions"
            className="data-[state=active]:bg-brand data-[state=active]:text-white cursor-pointer"
          >
            Instructions
          </TabsTrigger>

          <TabsTrigger
            value="notes"
            className="data-[state=active]:bg-brand data-[state=active]:text-white cursor-pointer"
          >
            Notes
          </TabsTrigger>
        </TabsList>

        {/* Ingredients Tab */}
        <TabsContent value="ingredients" className="mt-6">
          <CardSm className="border border-border-brand-light p-6">
            <IngredientsList
              ingredients={ingredients}
              baseServings={recipe.servings || 4}
              multiplier={servingMultiplier}
              onMultiplierChange={setServingMultiplier}
            />
          </CardSm>
        </TabsContent>

        {/* Instructions Tab */}
        <TabsContent value="instructions" className="mt-6">
          <CardSm className="border border-border-brand-light p-6">
            <h3 className={cn(text.h2, "mb-8 flex items-center gap-2")}>
              <span className="w-1 h-6 bg-brand" />
              Instructions
            </h3>
            <ol className={spacing.cardLarge}>
              {instructions.map((inst) => (
                <li key={inst.id} className="flex gap-4">
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
          </CardSm>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="mt-6">
          <CardSm className="border border-border-brand-light p-6">
            <h3 className={cn(text.h2, "mb-8 flex items-center gap-2")}>
              <span className="w-1 h-6 bg-brand" />
              Notes
            </h3>
            {recipe.notes ? (
              <p
                className={cn(
                  text.body,
                  "leading-relaxed bg-brand-100 p-4 rounded-sm whitespace-pre-wrap",
                )}
              >
                {recipe.notes}
              </p>
            ) : (
              <p className="text-sm text-text-muted italic">
                No notes added yet
              </p>
            )}
          </CardSm>
        </TabsContent>
      </Tabs>
    </>
  );
}
