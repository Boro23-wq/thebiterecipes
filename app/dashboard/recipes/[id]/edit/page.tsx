import { currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { updateRecipe } from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { text, spacing, input, layout } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { RecipeImagesPickerSlots } from "@/components/recipe-images-picker";
import { FormSubmitButton } from "@/components/form-submit";

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { id } = await params;

  // Fetch recipe with ingredients and instructions
  const recipe = await db.query.recipes.findFirst({
    where: and(eq(recipes.id, id), eq(recipes.userId, user.id)),
    with: {
      ingredients: {
        orderBy: (ingredients, { asc }) => [asc(ingredients.order)],
      },
      instructions: {
        orderBy: (instructions, { asc }) => [asc(instructions.order)],
      },
      images: { orderBy: (images, { asc }) => [asc(images.order)] },
    },
  });

  if (!recipe) {
    notFound();
  }

  // Format ingredients for textarea (combine amount + ingredient)
  const ingredientsText = recipe.ingredients
    .map((ing) => {
      if (ing.amount) {
        return `${ing.amount} ${ing.ingredient}`;
      }
      return ing.ingredient;
    })
    .join("\n");

  // Format instructions for textarea
  const instructionsText = recipe.instructions
    .map((inst) => inst.step)
    .join("\n");

  // Create action with recipeId bound
  const updateRecipeWithId = updateRecipe.bind(null, recipe.id);

  return (
    <div className="min-h-screen">
      <form action={updateRecipeWithId}>
        <RecipeImagesPickerSlots
          existingImages={recipe.images.map((img) => ({
            id: img.id,
            imageUrl: img.imageUrl,
          }))}
        />

        {/* Form Content */}
        <div className={cn(layout.containerSmall, "py-6", spacing.section)}>
          {/* Header */}
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">
              Edit Recipe
            </h1>
            <p className={cn(text.small, "mt-1")}>
              Update your recipe details below
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
                  defaultValue={recipe.title}
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
                  defaultValue={recipe.description || ""}
                  placeholder="Short summary of the recipe..."
                  className={cn(input.base, "resize-none")}
                />
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
                    defaultValue={recipe.servings || ""}
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
                    defaultValue={recipe.prepTime || ""}
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
                    defaultValue={recipe.cookTime || ""}
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
                    defaultValue={recipe.difficulty || ""}
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
                    defaultValue={recipe.cuisine || ""}
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
                    defaultValue={recipe.category || ""}
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
                  defaultValue={ingredientsText}
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
                  defaultValue={instructionsText}
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
                    defaultValue={recipe.calories || ""}
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
                    defaultValue={recipe.protein || ""}
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
                    defaultValue={recipe.carbs || ""}
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
                    defaultValue={recipe.fat || ""}
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
                  defaultValue={recipe.source || ""}
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
                  defaultValue={recipe.notes || ""}
                  placeholder="Any additional tips or modifications..."
                  className={cn(input.base, "resize-none")}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <FormSubmitButton loadingText="Updating recipe...">
                Update Recipe
              </FormSubmitButton>
              <Button type="button" variant="outline" asChild>
                <Link href={`/dashboard/recipes/${recipe.id}`}>Cancel</Link>
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
