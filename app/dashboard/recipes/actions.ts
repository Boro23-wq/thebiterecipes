"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import {
  recipes,
  recipeIngredients,
  recipeInstructions,
  recipeImages,
} from "@/db/schema";
import { redirect } from "next/navigation";
import { ilike, desc, asc, sql, and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { UTApi } from "uploadthing/server";

// Helper function to parse ingredient line into amount and ingredient
function parseIngredient(line: string): {
  amount: string | null;
  ingredient: string;
} {
  const match = line.match(
    /^([\d\/\.\s]+(cups?|cup|tablespoons?|tbsp|teaspoons?|tsp|ounces?|oz|pounds?|lbs?|lb|grams?|g|kilograms?|kg|milliliters?|ml|liters?|l|pinch|dash|cloves?|pieces?|slices?)?)\s+(.+)$/i,
  );

  if (match) {
    return {
      amount: match[1].trim(),
      ingredient: match[3].trim(),
    };
  }

  const simpleMatch = line.match(/^([\d\/\.\s]+)\s+(.+)$/);
  if (simpleMatch) {
    return {
      amount: simpleMatch[1].trim(),
      ingredient: simpleMatch[2].trim(),
    };
  }

  return {
    amount: null,
    ingredient: line.trim(),
  };
}

/**
 * Uploads up to 3 images from multipart FormData ("images" field).
 * Returns hosted URLs in the same order they were submitted.
 */
async function uploadRecipeImagesFromFormData(
  formData: FormData,
): Promise<string[]> {
  const raw = formData.getAll("images");
  const files = raw.filter((v): v is File => v instanceof File);
  const picked = files.filter((f) => f.size > 0).slice(0, 3);

  if (picked.length === 0) return [];

  for (const f of picked) {
    if (!f.type.startsWith("image/")) {
      throw new Error(`File "${f.name}" is not an image.`);
    }
    if (f.size > 4 * 1024 * 1024) {
      throw new Error(`Image "${f.name}" is larger than 4MB.`);
    }
  }

  const utapi = new UTApi();
  const result = await utapi.uploadFiles(picked);
  const results = Array.isArray(result) ? result : [result];

  const urls: string[] = [];
  for (const r of results) {
    const url = r?.data?.url;
    if (url) urls.push(url);
    else console.error("UploadThing upload result:", r);
  }

  return urls;
}

async function assertOwnsRecipeOrThrow(userId: string, recipeId: string) {
  const recipe = await db.query.recipes.findFirst({
    where: and(eq(recipes.id, recipeId), eq(recipes.userId, userId)),
    columns: { id: true },
  });

  if (!recipe) throw new Error("Recipe not found");
}

/**
 * Production-ready image update behavior:
 * - Supports slot updates (imageSlot) so replacing 1 image doesn't wipe others.
 * - Supports clearing slots (clearSlot) so user can remove existing images.
 * - If no imageSlot provided (old UI), falls back to full replace behavior.
 *
 * Expected FormData (from your slot-based picker):
 * - images: File[] (only new files)
 * - imageSlot: string[] (slot indices 0..2, same order as files)
 * - clearSlot: string[] (slot indices 0..2 user cleared)
 */
async function applyRecipeImageChanges(params: {
  recipeId: string;
  userId: string;
  formData: FormData;
}) {
  const { recipeId, userId, formData } = params;

  // Owner enforcement for all image mutations
  await assertOwnsRecipeOrThrow(userId, recipeId);

  // Read slot metadata
  const slotVals = formData.getAll("imageSlot").map(String);
  const clearVals = formData.getAll("clearSlot").map(String);

  const slotIdxs = slotVals
    .map((v) => parseInt(v, 10))
    .filter((n) => Number.isFinite(n) && n >= 0 && n <= 2);

  const clearIdxs = clearVals
    .map((v) => parseInt(v, 10))
    .filter((n) => Number.isFinite(n) && n >= 0 && n <= 2);

  // Upload files (if any)
  const hostedImageUrls = await uploadRecipeImagesFromFormData(formData);

  // If user selected images but slot metadata is missing, treat as full replace (legacy UI)
  const shouldFallbackFullReplace =
    hostedImageUrls.length > 0 && slotIdxs.length === 0;

  // Load existing images
  const existing = await db.query.recipeImages.findMany({
    where: eq(recipeImages.recipeId, recipeId),
    orderBy: (images, { asc }) => [asc(images.order)],
  });

  const byOrder = new Map<number, string>();
  for (const img of existing) byOrder.set(img.order, img.imageUrl);

  // Apply clears
  for (const c of clearIdxs) byOrder.delete(c);

  if (shouldFallbackFullReplace) {
    // Full replace: wipe and use hostedImageUrls 0..n
    byOrder.clear();
    hostedImageUrls
      .slice(0, 3)
      .forEach((url, order) => byOrder.set(order, url));
  } else if (hostedImageUrls.length > 0) {
    // Slot merge: pair urls with slotIdxs (same order).
    // If mismatch, fall back to sequential assignment.
    if (slotIdxs.length !== hostedImageUrls.length) {
      hostedImageUrls
        .slice(0, 3)
        .forEach((url, order) => byOrder.set(order, url));
    } else {
      hostedImageUrls.forEach((url, i) => {
        const slot = slotIdxs[i];
        if (slot == null) return;
        byOrder.set(slot, url);
      });
    }
  }

  // Build final rows for orders 0..2 only
  const finalRows = [0, 1, 2]
    .map((order) => {
      const url = byOrder.get(order);
      return url ? { recipeId, imageUrl: url, order } : null;
    })
    .filter(Boolean) as { recipeId: string; imageUrl: string; order: number }[];

  // Only write if there were actual image operations (uploads or clears)
  const hasImageOps =
    hostedImageUrls.length > 0 ||
    clearIdxs.length > 0 ||
    shouldFallbackFullReplace;

  if (hasImageOps) {
    await db.delete(recipeImages).where(eq(recipeImages.recipeId, recipeId));
    if (finalRows.length > 0) await db.insert(recipeImages).values(finalRows);

    // Keep recipes.imageUrl in sync with primary image (order 0)
    await db
      .update(recipes)
      .set({
        imageUrl: finalRows[0]?.imageUrl ?? null,
        updatedAt: new Date(),
      })
      .where(and(eq(recipes.id, recipeId), eq(recipes.userId, userId)));
  }
}

export async function createRecipe(formData: FormData) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
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

  // Upload up to 3 images (create is always "full replace" into empty recipe)
  const hostedImageUrls = await uploadRecipeImagesFromFormData(formData);

  const ingredientsList = ingredientsText
    .split("\n")
    .map((i) => i.trim())
    .filter(Boolean);

  const instructionsList = instructionsText
    .split("\n")
    .map((i) => i.trim())
    .filter(Boolean);

  const totalTime = (parseInt(prepTime) || 0) + (parseInt(cookTime) || 0);

  const [recipe] = await db
    .insert(recipes)
    .values({
      userId: user.id,
      title,
      description: description || null,
      imageUrl: hostedImageUrls[0] || null,
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

  // Save images
  if (hostedImageUrls.length > 0) {
    await db.insert(recipeImages).values(
      hostedImageUrls.map((url, index) => ({
        recipeId: recipe.id,
        imageUrl: url,
        order: index,
      })),
    );
  }

  // Save ingredients
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

  // Save instructions
  await db.insert(recipeInstructions).values(
    instructionsList.map((step, index) => ({
      recipeId: recipe.id,
      step,
      order: index + 1,
    })),
  );

  revalidatePath("/dashboard/recipes");
  redirect(`/dashboard/recipes/${recipe.id}`);
}

export async function updateRecipe(recipeId: string, formData: FormData) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  // Owner enforcement (prevents updating others' recipes)
  await assertOwnsRecipeOrThrow(user.id, recipeId);

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
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

  const totalTime = (parseInt(prepTime) || 0) + (parseInt(cookTime) || 0);

  // Update recipe core fields (owner scoped)
  await db
    .update(recipes)
    .set({
      title,
      description: description || null,
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
    .where(and(eq(recipes.id, recipeId), eq(recipes.userId, user.id)));

  // Apply image changes (slot merge + clears + legacy fallback)
  await applyRecipeImageChanges({
    recipeId,
    userId: user.id,
    formData,
  });

  // Re-write ingredients/instructions (owner scoped deletes)
  await db
    .delete(recipeIngredients)
    .where(eq(recipeIngredients.recipeId, recipeId));
  await db
    .delete(recipeInstructions)
    .where(eq(recipeInstructions.recipeId, recipeId));

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

  await db.insert(recipeInstructions).values(
    instructionsList.map((step, index) => ({
      recipeId,
      step,
      order: index + 1,
    })),
  );

  revalidatePath("/dashboard/recipes");
  revalidatePath(`/dashboard/recipes/${recipeId}`);
  redirect(`/dashboard/recipes/${recipeId}`);
}

export type RecipeSortBy = "recent" | "title" | "rating" | "time";

export type RecipesCursor =
  | { sortBy: "recent"; createdAt: string; id: string }
  | { sortBy: "title"; title: string; id: string }
  | { sortBy: "rating"; ratingKey: number; id: string }
  | { sortBy: "time"; timeKey: number; id: string };

export async function searchRecipes(input: {
  q?: string;
  sortBy?: RecipeSortBy;
  cuisines?: string[];
  difficulties?: string[];
  categories?: string[];
  favoritesOnly?: boolean;
  cursor?: RecipesCursor | null;
  limit?: number;
}) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const {
    q = "",
    sortBy = "recent",
    cuisines = [],
    difficulties = [],
    categories = [],
    favoritesOnly = false,
    cursor = null,
    limit = 24,
  } = input;

  const conditions = [eq(recipes.userId, user.id)];

  // 🔎 Search
  const trimmed = q.trim();
  if (trimmed) {
    const term = `%${trimmed}%`;
    conditions.push(
      sql`(
        ${recipes.title} ILIKE ${term} OR
        ${recipes.cuisine} ILIKE ${term} OR
        ${recipes.category} ILIKE ${term}
      )`,
    );
  }

  // 🧩 Filters
  if (cuisines.length > 0) conditions.push(inArray(recipes.cuisine, cuisines));
  if (difficulties.length > 0)
    conditions.push(inArray(recipes.difficulty, difficulties));
  if (categories.length > 0)
    conditions.push(inArray(recipes.category, categories));
  if (favoritesOnly) conditions.push(eq(recipes.isFavorite, true));

  // Cursor/keyset predicate (adds pagination condition)
  // For stable order we always include id as tie-breaker.
  const ratingKeyExpr = sql<number>`COALESCE(${recipes.rating}, 0)`;
  const timeKeyExpr = sql<number>`COALESCE(${recipes.totalTime}, 999999)`;

  if (cursor && cursor.sortBy === sortBy) {
    switch (sortBy) {
      case "recent": {
        const c = cursor as Extract<RecipesCursor, { sortBy: "recent" }>;
        conditions.push(
          sql`(
            ${recipes.createdAt} < ${c.createdAt} OR
            (${recipes.createdAt} = ${c.createdAt} AND ${recipes.id} < ${c.id})
          )`,
        );
        break;
      }
      case "title": {
        const c = cursor as Extract<RecipesCursor, { sortBy: "title" }>;
        conditions.push(
          sql`(
            ${recipes.title} > ${c.title} OR
            (${recipes.title} = ${c.title} AND ${recipes.id} > ${c.id})
          )`,
        );
        break;
      }
      case "rating": {
        const c = cursor as Extract<RecipesCursor, { sortBy: "rating" }>;
        conditions.push(
          sql`(
            ${ratingKeyExpr} < ${c.ratingKey} OR
            (${ratingKeyExpr} = ${c.ratingKey} AND ${recipes.id} < ${c.id})
          )`,
        );
        break;
      }
      case "time": {
        const c = cursor as Extract<RecipesCursor, { sortBy: "time" }>;
        conditions.push(
          sql`(
            ${timeKeyExpr} > ${c.timeKey} OR
            (${timeKeyExpr} = ${c.timeKey} AND ${recipes.id} > ${c.id})
          )`,
        );
        break;
      }
    }
  }

  const whereClause = and(...conditions);

  const orderByClause =
    sortBy === "title"
      ? [asc(recipes.title), asc(recipes.id)]
      : sortBy === "rating"
        ? [desc(ratingKeyExpr), desc(recipes.id)]
        : sortBy === "time"
          ? [asc(timeKeyExpr), asc(recipes.id)]
          : [desc(recipes.createdAt), desc(recipes.id)];

  const rows = await db.query.recipes.findMany({
    where: whereClause,
    orderBy: () => orderByClause,
    limit: limit + 1,
  });

  const hasNext = rows.length > limit;
  const items = hasNext ? rows.slice(0, limit) : rows;

  let nextCursor: RecipesCursor | null = null;
  if (hasNext) {
    const last = items[items.length - 1]!;
    if (sortBy === "recent") {
      nextCursor = {
        sortBy: "recent",
        createdAt:
          typeof last.createdAt === "string"
            ? last.createdAt
            : last.createdAt.toISOString(),
        id: last.id,
      };
    } else if (sortBy === "title") {
      nextCursor = {
        sortBy: "title",
        title: last.title,
        id: last.id,
      };
    } else if (sortBy === "rating") {
      nextCursor = {
        sortBy: "rating",
        ratingKey: last.rating ?? 0,
        id: last.id,
      };
    } else {
      nextCursor = {
        sortBy: "time",
        timeKey: last.totalTime ?? 999999,
        id: last.id,
      };
    }
  }

  // Counts
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(recipes)
    .where(whereClause);

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(recipes)
    .where(eq(recipes.userId, user.id));

  return {
    items,
    nextCursor,
    filteredCount: Number(count),
    totalCount: Number(total),
  };
}

export async function loadMoreRecipes(offset: number, limit: number = 25) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const moreRecipes = await db.query.recipes.findMany({
    where: eq(recipes.userId, user.id),
    orderBy: (recipes, { desc }) => [desc(recipes.createdAt)],
    limit,
    offset,
  });

  return moreRecipes;
}

export async function toggleFavorite(recipeId: string) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const recipe = await db.query.recipes.findFirst({
    where: and(eq(recipes.id, recipeId), eq(recipes.userId, user.id)),
  });

  if (!recipe) throw new Error("Recipe not found");

  await db
    .update(recipes)
    .set({
      isFavorite: !recipe.isFavorite,
    })
    .where(and(eq(recipes.id, recipeId), eq(recipes.userId, user.id)));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/recipes");
  revalidatePath("/dashboard/favorites");
  revalidatePath(`/dashboard/recipes/${recipeId}`);

  return { isFavorite: !recipe.isFavorite };
}
