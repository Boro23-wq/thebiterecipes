import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createRecipe } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { text, spacing, input, layout } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { RecipeImagesPickerSlots } from "@/components/recipe-images-picker";
import { FormSubmitButton } from "@/components/form-submit";

export default async function NewRecipePage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen">
      <form action={createRecipe}>
        <RecipeImagesPickerSlots />

        {/* Form Content */}
        <div className={cn(layout.containerSmall, "py-6", spacing.section)}>
          {/* Header */}
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">
              Add New Recipe
            </h1>
            <p className={cn(text.small, "mt-1")}>
              Fill in the details below to create your recipe
            </p>
          </div>

          <div className={spacing.section}>
            {/* Basic Info Section */}
            <div className={spacing.form}>
              <h2 className={text.h2}>Basic Information</h2>

              {/* Title */}
              <div className={spacing.tight}>
                <Label htmlFor="title" className={text.label}>
                  Recipe Title *
                </Label>
                <Input
                  id="title"
                  name="title"
                  required
                  placeholder="e.g. Grandma's Pasta"
                  className={input.base}
                />
              </div>

              {/* Description */}
              <div className={spacing.tight}>
                <Label htmlFor="description" className={text.label}>
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={3}
                  placeholder="Short summary of the recipe..."
                  className={cn(input.base, "resize-none")}
                />
                <p className={text.muted}>
                  A short description shown at the top of the recipe.
                </p>
              </div>

              {/* Grid for Servings, Prep Time, Cook Time */}
              <div className="grid grid-cols-3 gap-4">
                <div className={spacing.tight}>
                  <Label htmlFor="servings" className={text.label}>
                    Servings
                  </Label>
                  <Input
                    id="servings"
                    name="servings"
                    type="number"
                    min="1"
                    placeholder="4"
                    className={input.base}
                  />
                </div>

                <div className={spacing.tight}>
                  <Label htmlFor="prepTime" className={text.label}>
                    Prep Time (min)
                  </Label>
                  <Input
                    id="prepTime"
                    name="prepTime"
                    type="number"
                    min="0"
                    placeholder="15"
                    className={input.base}
                  />
                </div>

                <div className={spacing.tight}>
                  <Label htmlFor="cookTime" className={text.label}>
                    Cook Time (min)
                  </Label>
                  <Input
                    id="cookTime"
                    name="cookTime"
                    type="number"
                    min="0"
                    placeholder="30"
                    className={input.base}
                  />
                </div>
              </div>

              {/* Grid for Difficulty, Cuisine, Category */}
              <div className="grid grid-cols-3 gap-4">
                <div className={spacing.tight}>
                  <Label htmlFor="difficulty" className={text.label}>
                    Difficulty
                  </Label>
                  <select
                    id="difficulty"
                    name="difficulty"
                    className={cn(
                      "w-full px-3 py-2 text-sm border rounded-sm focus:outline-none",
                      input.base,
                    )}
                  >
                    <option value="">Select...</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div className={spacing.tight}>
                  <Label htmlFor="cuisine" className={text.label}>
                    Cuisine
                  </Label>
                  <Input
                    id="cuisine"
                    name="cuisine"
                    placeholder="e.g. Italian"
                    className={input.base}
                  />
                </div>

                <div className={spacing.tight}>
                  <Label htmlFor="category" className={text.label}>
                    Category
                  </Label>
                  <Input
                    id="category"
                    name="category"
                    placeholder="e.g. Dinner"
                    className={input.base}
                  />
                </div>
              </div>
            </div>

            {/* Ingredients Section */}
            <div className={spacing.form}>
              <h2 className={text.h2}>Ingredients</h2>
              <div className={spacing.tight}>
                <Label htmlFor="ingredients" className={text.label}>
                  Ingredients List *
                </Label>
                <Textarea
                  id="ingredients"
                  name="ingredients"
                  required
                  rows={8}
                  placeholder="Enter each ingredient on a new line&#10;e.g.&#10;2 cups pasta&#10;4 eggs&#10;1 cup parmesan cheese"
                  className={cn(input.base, "resize-none")}
                />
                <p className={text.muted}>
                  Enter one ingredient per line. Include quantities for best
                  results.
                </p>
              </div>
            </div>

            {/* Instructions Section */}
            <div className={spacing.form}>
              <h2 className={text.h2}>Instructions</h2>
              <div className={spacing.tight}>
                <Label htmlFor="instructions" className={text.label}>
                  Cooking Steps *
                </Label>
                <Textarea
                  id="instructions"
                  name="instructions"
                  required
                  rows={10}
                  placeholder="Enter each step on a new line&#10;e.g.&#10;1. Boil pasta in salted water&#10;2. Cook bacon until crispy&#10;3. Mix eggs with cheese"
                  className={cn(input.base, "resize-none")}
                />
                <p className={text.muted}>
                  Enter one step per line. Number them for clarity.
                </p>
              </div>
            </div>

            {/* Nutrition (Optional) */}
            <div className={spacing.form}>
              <h2 className={text.h2}>
                Nutrition Info{" "}
                <span className="text-text-muted font-normal text-sm">
                  (Optional)
                </span>
              </h2>
              <div className="grid grid-cols-4 gap-4">
                <div className={spacing.tight}>
                  <Label htmlFor="calories" className={text.label}>
                    Calories
                  </Label>
                  <Input
                    id="calories"
                    name="calories"
                    type="number"
                    min="0"
                    placeholder="350"
                    className={input.base}
                  />
                </div>

                <div className={spacing.tight}>
                  <Label htmlFor="protein" className={text.label}>
                    Protein (g)
                  </Label>
                  <Input
                    id="protein"
                    name="protein"
                    type="number"
                    min="0"
                    placeholder="25"
                    className={input.base}
                  />
                </div>

                <div className={spacing.tight}>
                  <Label htmlFor="carbs" className={text.label}>
                    Carbs (g)
                  </Label>
                  <Input
                    id="carbs"
                    name="carbs"
                    type="number"
                    min="0"
                    placeholder="45"
                    className={input.base}
                  />
                </div>

                <div className={spacing.tight}>
                  <Label htmlFor="fat" className={text.label}>
                    Fat (g)
                  </Label>
                  <Input
                    id="fat"
                    name="fat"
                    type="number"
                    min="0"
                    placeholder="12"
                    className={input.base}
                  />
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className={spacing.form}>
              <h2 className={text.h2}>
                Additional Info{" "}
                <span className="text-text-muted font-normal text-sm">
                  (Optional)
                </span>
              </h2>

              <div className={spacing.tight}>
                <Label htmlFor="source" className={text.label}>
                  Source
                </Label>
                <Input
                  id="source"
                  name="source"
                  placeholder="e.g. Family Recipe, Food Network"
                  className={input.base}
                />
              </div>

              <div className={spacing.tight}>
                <Label htmlFor="notes" className={text.label}>
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  placeholder="Any additional tips or modifications..."
                  className={cn(input.base, "resize-none")}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <FormSubmitButton loadingText="Saving recipe...">
                  Save Recipe
                </FormSubmitButton>
                <Button type="button" variant="outline" asChild>
                  <Link href="/dashboard">Cancel</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
