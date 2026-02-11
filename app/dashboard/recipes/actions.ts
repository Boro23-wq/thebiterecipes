"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { recipes, recipeIngredients, recipeInstructions } from "@/db/schema";
import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Helper function to parse ingredient line into amount and ingredient
function parseIngredient(line: string): {
  amount: string | null;
  ingredient: string;
} {
  // Match pattern: number/fraction + optional unit + rest
  // Examples: "2 cups pasta", "1/2 tsp salt", "4 eggs", "Fresh thyme"
  const match = line.match(
    /^([\d\/\.\s]+(cups?|cup|tablespoons?|tbsp|teaspoons?|tsp|ounces?|oz|pounds?|lbs?|lb|grams?|g|kilograms?|kg|milliliters?|ml|liters?|l|pinch|dash|cloves?|pieces?|slices?)?)\s+(.+)$/i,
  );

  if (match) {
    return {
      amount: match[1].trim(),
      ingredient: match[3].trim(),
    };
  }

  // If no amount found, check if it starts with a number
  const simpleMatch = line.match(/^([\d\/\.\s]+)\s+(.+)$/);
  if (simpleMatch) {
    return {
      amount: simpleMatch[1].trim(),
      ingredient: simpleMatch[2].trim(),
    };
  }

  // No amount found, entire line is ingredient
  return {
    amount: null,
    ingredient: line.trim(),
  };
}

export async function createRecipe(formData: FormData) {
  const user = await currentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const title = formData.get("title") as string;
  const servings = formData.get("servings") as string;
  const prepTime = formData.get("prepTime") as string;
  const cookTime = formData.get("cookTime") as string;
  const difficulty = formData.get("difficulty") as string;
  const cuisine = formData.get("cuisine") as string;
  const category = formData.get("category") as string;
  const calories = formData.get("calories") as string;
  const protein = formData.get("protein") as string;
  const carbs = formData.get("carbs") as string;
  const fat = formData.get("fat") as string;
  const source = formData.get("source") as string;
  const notes = formData.get("notes") as string;
  const ingredientsText = formData.get("ingredients") as string;
  const instructionsText = formData.get("instructions") as string;

  const ingredientsList = ingredientsText
    .split("\n")
    .map((i) => i.trim())
    .filter(Boolean);

  const instructionsList = instructionsText
    .split("\n")
    .map((i) => i.trim())
    .filter(Boolean);

  // Calculate total time
  const totalTime = (parseInt(prepTime) || 0) + (parseInt(cookTime) || 0);

  const [recipe] = await db
    .insert(recipes)
    .values({
      userId: user.id,
      title,
      servings: servings ? parseInt(servings) : null,
      prepTime: prepTime ? parseInt(prepTime) : null,
      cookTime: cookTime ? parseInt(cookTime) : null,
      totalTime: totalTime || null,
      difficulty: difficulty || null,
      cuisine: cuisine || null,
      category: category || null,
      calories: calories ? parseInt(calories) : null,
      protein: protein ? parseInt(protein) : null,
      carbs: carbs ? parseInt(carbs) : null,
      fat: fat ? parseInt(fat) : null,
      source: source || null,
      notes: notes || null,
    })
    .returning();

  await db.insert(recipeIngredients).values(
    ingredientsList.map((line, index) => {
      const { amount, ingredient } = parseIngredient(line);
      return {
        recipeId: recipe.id,
        amount,
        ingredient,
        order: index + 1,
      };
    }),
  );

  await db.insert(recipeInstructions).values(
    instructionsList.map((step, index) => ({
      recipeId: recipe.id,
      step,
      order: index + 1,
    })),
  );

  redirect("/dashboard");
}

export async function updateRecipe(recipeId: string, formData: FormData) {
  const user = await currentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const title = formData.get("title") as string;
  const servings = formData.get("servings") as string;
  const prepTime = formData.get("prepTime") as string;
  const cookTime = formData.get("cookTime") as string;
  const difficulty = formData.get("difficulty") as string;
  const cuisine = formData.get("cuisine") as string;
  const category = formData.get("category") as string;
  const calories = formData.get("calories") as string;
  const protein = formData.get("protein") as string;
  const carbs = formData.get("carbs") as string;
  const fat = formData.get("fat") as string;
  const source = formData.get("source") as string;
  const notes = formData.get("notes") as string;
  const ingredientsText = formData.get("ingredients") as string;
  const instructionsText = formData.get("instructions") as string;

  const ingredientsList = ingredientsText
    .split("\n")
    .map((i) => i.trim())
    .filter(Boolean);

  const instructionsList = instructionsText
    .split("\n")
    .map((i) => i.trim())
    .filter(Boolean);

  // Calculate total time
  const totalTime = (parseInt(prepTime) || 0) + (parseInt(cookTime) || 0);

  // Update recipe
  await db
    .update(recipes)
    .set({
      title,
      servings: servings ? parseInt(servings) : null,
      prepTime: prepTime ? parseInt(prepTime) : null,
      cookTime: cookTime ? parseInt(cookTime) : null,
      totalTime: totalTime || null,
      difficulty: difficulty || null,
      cuisine: cuisine || null,
      category: category || null,
      calories: calories ? parseInt(calories) : null,
      protein: protein ? parseInt(protein) : null,
      carbs: carbs ? parseInt(carbs) : null,
      fat: fat ? parseInt(fat) : null,
      source: source || null,
      notes: notes || null,
      updatedAt: new Date(),
    })
    .where(eq(recipes.id, recipeId));

  // Delete old ingredients and instructions
  await db
    .delete(recipeIngredients)
    .where(eq(recipeIngredients.recipeId, recipeId));
  await db
    .delete(recipeInstructions)
    .where(eq(recipeInstructions.recipeId, recipeId));

  // Insert new ingredients
  await db.insert(recipeIngredients).values(
    ingredientsList.map((line, index) => {
      const { amount, ingredient } = parseIngredient(line);
      return {
        recipeId,
        amount,
        ingredient,
        order: index + 1,
      };
    }),
  );

  // Insert new instructions
  await db.insert(recipeInstructions).values(
    instructionsList.map((step, index) => ({
      recipeId,
      step,
      order: index + 1,
    })),
  );

  redirect(`/dashboard/recipes/${recipeId}`);
}

export async function loadMoreRecipes(offset: number, limit: number = 25) {
  const user = await currentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const moreRecipes = await db.query.recipes.findMany({
    where: eq(recipes.userId, user.id),
    orderBy: (recipes, { desc }) => [desc(recipes.createdAt)],
    limit: limit,
    offset: offset,
  });

  return moreRecipes;
}

export async function toggleFavorite(recipeId: string) {
  const user = await currentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Get current recipe
  const recipe = await db.query.recipes.findFirst({
    where: and(eq(recipes.id, recipeId), eq(recipes.userId, user.id)),
  });

  if (!recipe) {
    throw new Error("Recipe not found");
  }

  // Toggle favorite
  await db
    .update(recipes)
    .set({
      isFavorite: !recipe.isFavorite,
    })
    .where(eq(recipes.id, recipeId));

  // Revalidate all relevant paths
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/recipes");
  revalidatePath("/dashboard/favorites");
  revalidatePath(`/dashboard/recipes/${recipeId}`);

  return { isFavorite: !recipe.isFavorite };
}
