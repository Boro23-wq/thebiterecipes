"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { recipes, recipeIngredients, recipeInstructions } from "@/db/schema";
import { redirect } from "next/navigation";

export async function createRecipe(formData: FormData) {
  const user = await currentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const title = formData.get("title") as string;
  const ingredientsText = formData.get("ingredients") as string;
  const instructionsText = formData.get("instructions") as string;

  // Parse ingredients (split by newline)
  const ingredientsList = ingredientsText
    .split("\n")
    .map((i) => i.trim())
    .filter(Boolean);

  // Parse instructions (split by newline)
  const instructionsList = instructionsText
    .split("\n")
    .map((i) => i.trim())
    .filter(Boolean);

  // Insert recipe
  const [recipe] = await db
    .insert(recipes)
    .values({
      userId: user.id,
      title,
    })
    .returning();

  // Insert ingredients
  await db.insert(recipeIngredients).values(
    ingredientsList.map((ingredient, index) => ({
      recipeId: recipe.id,
      ingredient,
      order: index + 1,
    })),
  );

  // Insert instructions
  await db.insert(recipeInstructions).values(
    instructionsList.map((step, index) => ({
      recipeId: recipe.id,
      step,
      order: index + 1,
    })),
  );

  redirect("/dashboard");
}
