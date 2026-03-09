"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import {
  onboardingProfiles,
  seedRecipes,
  seedRecipeIngredients,
  seedRecipeInstructions,
  recipes,
  recipeIngredients,
  recipeInstructions,
} from "@/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";

type OnboardingData = {
  dietary: string[];
  cuisines: string[];
  skillLevel: string;
  cookingTime: string;
};

export async function saveOnboardingProfile(data: OnboardingData) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  // 1. Save onboarding profile
  await db
    .insert(onboardingProfiles)
    .values({
      userId: user.id,
      dietaryRestrictions: data.dietary,
      cuisinePreferences: data.cuisines,
      skillLevel: data.skillLevel,
      cookingTime: data.cookingTime,
      onboardingCompleted: true,
      completedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: onboardingProfiles.userId,
      set: {
        dietaryRestrictions: data.dietary,
        cuisinePreferences: data.cuisines,
        skillLevel: data.skillLevel,
        cookingTime: data.cookingTime,
        onboardingCompleted: true,
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    });

  // 2. Prefill recipes based on preferences
  await prefillRecipes(user.id, data);
}

async function prefillRecipes(userId: string, data: OnboardingData) {
  const TARGET_COUNT = 18;

  // Fetch all seed recipes
  const allSeeds = await db.query.seedRecipes.findMany({
    with: {
      ingredients: { orderBy: (ing, { asc }) => [asc(ing.order)] },
      instructions: { orderBy: (inst, { asc }) => [asc(inst.order)] },
    },
  });

  // Score each seed recipe based on user preferences
  const scored = allSeeds.map((seed) => {
    let score = 0;

    // Cuisine match (highest priority)
    if (data.cuisines.includes(seed.cuisine)) {
      score += 10;
    }

    // Time preference match
    if (seed.timeCategory === data.cookingTime) {
      score += 5;
    }

    // Difficulty match
    if (seed.difficulty === data.skillLevel) {
      score += 4;
    }

    // Dietary compatibility
    // If user has dietary restrictions, recipe must not violate them
    if (data.dietary.length > 0) {
      const seedTags = (seed.dietaryTags as string[]) || [];
      const isCompatible = data.dietary.every((restriction) =>
        seedTags.includes(restriction),
      );
      if (isCompatible) {
        score += 8; // Big bonus for fully compatible
      } else {
        // Check partial compatibility
        const matchCount = data.dietary.filter((r) =>
          seedTags.includes(r),
        ).length;
        if (matchCount > 0) {
          score += matchCount * 2;
        }
      }
    } else {
      // No dietary restrictions — slight bonus for variety
      score += 2;
    }

    // Small random factor for variety
    score += Math.random() * 2;

    return { seed, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Ensure cuisine variety — pick top recipes but spread across cuisines
  const selected: typeof scored = [];
  const cuisineCounts: Record<string, number> = {};
  const maxPerCuisine = Math.ceil(TARGET_COUNT / data.cuisines.length) + 1;

  for (const item of scored) {
    if (selected.length >= TARGET_COUNT) break;

    const cuisine = item.seed.cuisine;
    const count = cuisineCounts[cuisine] || 0;

    // Allow more from preferred cuisines, fewer from others
    const limit = data.cuisines.includes(cuisine) ? maxPerCuisine : 2;

    if (count < limit) {
      selected.push(item);
      cuisineCounts[cuisine] = count + 1;
    }
  }

  // If we still need more, fill from remaining
  if (selected.length < TARGET_COUNT) {
    for (const item of scored) {
      if (selected.length >= TARGET_COUNT) break;
      if (!selected.includes(item)) {
        selected.push(item);
      }
    }
  }

  // 3. Copy selected seed recipes into user's recipes table
  for (const { seed } of selected) {
    const [newRecipe] = await db
      .insert(recipes)
      .values({
        userId,
        title: seed.title,
        description: seed.description,
        imageUrl: seed.imageUrl,
        servings: seed.servings,
        prepTime: seed.prepTime,
        cookTime: seed.cookTime,
        totalTime: seed.totalTime,
        difficulty: seed.difficulty,
        cuisine: seed.cuisine,
        calories: seed.calories,
        protein: seed.protein,
        carbs: seed.carbs,
        fat: seed.fat,
        source: seed.source || "Bite Starter Recipe",
        isSeeded: true,
      })
      .returning({ id: recipes.id });

    // Copy ingredients
    if (seed.ingredients.length > 0) {
      await db.insert(recipeIngredients).values(
        seed.ingredients.map((ing) => ({
          recipeId: newRecipe.id,
          ingredient: ing.ingredient,
          amount: ing.amount,
          order: ing.order,
        })),
      );
    }

    // Copy instructions
    if (seed.instructions.length > 0) {
      await db.insert(recipeInstructions).values(
        seed.instructions.map((inst) => ({
          recipeId: newRecipe.id,
          step: inst.step,
          order: inst.order,
        })),
      );
    }
  }
}

// Helper to check if user has completed onboarding
export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  const profile = await db.query.onboardingProfiles.findFirst({
    where: eq(onboardingProfiles.userId, userId),
    columns: { onboardingCompleted: true },
  });
  return profile?.onboardingCompleted ?? false;
}
