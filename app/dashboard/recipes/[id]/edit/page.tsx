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
import { recipeImageSrc } from "@/lib/recipe-image";

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

  // Fetch recipe
  const recipe = await db.query.recipes.findFirst({
    where: and(eq(recipes.id, id), eq(recipes.userId, user.id)),
    with: {
      ingredients: {
        orderBy: (ingredients, { asc }) => [asc(ingredients.order)],
      },
      instructions: {
        orderBy: (instructions, { asc }) => [asc(instructions.order)],
      },
      images: {
        orderBy: (images, { asc }) => [asc(images.order)],
      },
    },
  });

  if (!recipe) {
    notFound();
  }

  // Normalize existing images
  const existingImages =
    recipe.images.length > 0
      ? recipe.images
          .map((img) => ({
            id: img.id,
            imageUrl: recipeImageSrc(img.imageUrl),
          }))
          .filter(
            (img): img is { id: number; imageUrl: string } => !!img.imageUrl,
          )
      : recipe.imageUrl
        ? [
            {
              id: "legacy",
              imageUrl: recipeImageSrc(recipe.imageUrl),
            },
          ].filter(
            (img): img is { id: string; imageUrl: string } => !!img.imageUrl,
          )
        : [];

  // Format ingredients for textarea
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

  // Bind action
  const updateRecipeWithId = updateRecipe.bind(null, recipe.id);

  return (
    <div className="min-h-screen">
      <form action={updateRecipeWithId}>
        <RecipeImagesPickerSlots existingImages={existingImages} />

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
            {/* Basic Info */}
            <div className={spacing.form}>
              <h2 className={text.h2}>Basic Information</h2>

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

              {/* Servings / Prep / Cook */}
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

              {/* Difficulty / Cuisine / Category */}
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

            {/* Ingredients */}
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
                  className={cn(input.base, "resize-none")}
                />
              </div>
            </div>

            {/* Instructions */}
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
                  className={cn(input.base, "resize-none")}
                />
              </div>
            </div>

            {/* Nutrition */}
            <div className={spacing.form}>
              <h2 className={text.h2}>
                Nutrition Info{" "}
                <span className="text-text-muted font-normal text-sm">
                  (Optional)
                </span>
              </h2>

              <div className="grid grid-cols-4 gap-4">
                <Input
                  id="calories"
                  name="calories"
                  type="number"
                  min="0"
                  defaultValue={recipe.calories || ""}
                  placeholder="Calories"
                  className={input.base}
                />

                <Input
                  id="protein"
                  name="protein"
                  type="number"
                  min="0"
                  defaultValue={recipe.protein || ""}
                  placeholder="Protein"
                  className={input.base}
                />

                <Input
                  id="carbs"
                  name="carbs"
                  type="number"
                  min="0"
                  defaultValue={recipe.carbs || ""}
                  placeholder="Carbs"
                  className={input.base}
                />

                <Input
                  id="fat"
                  name="fat"
                  type="number"
                  min="0"
                  defaultValue={recipe.fat || ""}
                  placeholder="Fat"
                  className={input.base}
                />
              </div>
            </div>

            {/* Source / Notes */}
            <div className={spacing.form}>
              <h2 className={text.h2}>Additional Info</h2>

              <Input
                id="source"
                name="source"
                defaultValue={recipe.source || ""}
                placeholder="Recipe source"
                className={input.base}
              />

              <Textarea
                id="notes"
                name="notes"
                rows={4}
                defaultValue={recipe.notes || ""}
                placeholder="Notes"
                className={cn(input.base, "resize-none")}
              />
            </div>

            {/* Buttons */}
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
