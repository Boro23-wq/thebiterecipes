"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { eq, and, sql, ilike, lte, isNotNull, desc, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  pantryItems,
  groceryListItems,
  recipes,
  recipeIngredients,
} from "@/db/schema";

// ===== PANTRY CRUD =====

export async function getPantryItems(options?: {
  category?: string;
  showExpired?: boolean;
  sortBy?: "name" | "expiration" | "created";
}) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const conditions = [eq(pantryItems.userId, user.id)];

  if (options?.category) {
    conditions.push(eq(pantryItems.category, options.category));
  }

  if (!options?.showExpired) {
    conditions.push(eq(pantryItems.isExpired, false));
  }

  const items = await db.query.pantryItems.findMany({
    where: and(...conditions),
    orderBy:
      options?.sortBy === "expiration"
        ? [asc(pantryItems.expirationDate)]
        : options?.sortBy === "name"
          ? [asc(pantryItems.name)]
          : [desc(pantryItems.createdAt)],
  });

  return items;
}

export async function addPantryItem(input: {
  name: string;
  category?: string;
  amount?: string;
  unit?: string;
  expirationDate?: Date;
  notes?: string;
  source?: "manual" | "grocery" | "voice" | "ai";
}) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const [item] = await db
    .insert(pantryItems)
    .values({
      userId: user.id,
      name: input.name.trim(),
      category: input.category ?? categorizePantryItem(input.name),
      amount: input.amount || null,
      unit: input.unit || null,
      expirationDate: input.expirationDate || null,
      notes: input.notes || null,
      source: input.source ?? "manual",
    })
    .returning();

  revalidatePath("/dashboard/pantry");
  return item;
}

export async function addPantryItemsBatch(
  items: Array<{
    name: string;
    category?: string;
    amount?: string;
    unit?: string;
    expirationDate?: Date;
    source?: "manual" | "grocery" | "voice" | "ai";
  }>,
) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  if (items.length === 0) return [];

  const values = items.map((item) => ({
    userId: user.id,
    name: item.name.trim(),
    category: item.category ?? categorizePantryItem(item.name),
    amount: item.amount || null,
    unit: item.unit || null,
    expirationDate: item.expirationDate || null,
    source: item.source ?? "manual",
  }));

  const inserted = await db.insert(pantryItems).values(values).returning();

  revalidatePath("/dashboard/pantry");
  return inserted;
}

export async function updatePantryItem(input: {
  id: string;
  name?: string;
  category?: string;
  amount?: string;
  unit?: string;
  expirationDate?: Date | null;
  notes?: string;
}) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const item = await db.query.pantryItems.findFirst({
    where: and(eq(pantryItems.id, input.id), eq(pantryItems.userId, user.id)),
  });

  if (!item) throw new Error("Not found");

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined) updates.name = input.name.trim();
  if (input.category !== undefined) updates.category = input.category;
  if (input.amount !== undefined) updates.amount = input.amount || null;
  if (input.unit !== undefined) updates.unit = input.unit || null;
  if (input.expirationDate !== undefined)
    updates.expirationDate = input.expirationDate;
  if (input.notes !== undefined) updates.notes = input.notes || null;

  await db.update(pantryItems).set(updates).where(eq(pantryItems.id, input.id));

  revalidatePath("/dashboard/pantry");
}

export async function deletePantryItem(id: string) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const item = await db.query.pantryItems.findFirst({
    where: and(eq(pantryItems.id, id), eq(pantryItems.userId, user.id)),
  });

  if (!item) throw new Error("Not found");

  await db.delete(pantryItems).where(eq(pantryItems.id, id));

  revalidatePath("/dashboard/pantry");
}

export async function deletePantryItemsBatch(ids: string[]) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  if (ids.length === 0) return;

  for (const id of ids) {
    await db
      .delete(pantryItems)
      .where(and(eq(pantryItems.id, id), eq(pantryItems.userId, user.id)));
  }

  revalidatePath("/dashboard/pantry");
}

// ===== GROCERY → PANTRY AUTO-ADD =====

export async function addGroceryItemToPantry(groceryItemId: string) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  // Fetch the grocery item with ownership check
  const groceryItem = await db.query.groceryListItems.findFirst({
    where: eq(groceryListItems.id, groceryItemId),
    with: {
      groceryList: {
        with: { mealPlan: true },
      },
    },
  });

  if (!groceryItem || groceryItem.groceryList.mealPlan.userId !== user.id) {
    throw new Error("Not found");
  }

  // Check if already added from this grocery item
  const existing = await db.query.pantryItems.findFirst({
    where: and(
      eq(pantryItems.userId, user.id),
      eq(pantryItems.groceryItemId, groceryItemId),
    ),
  });

  if (existing) return existing; // Already in pantry

  const [item] = await db
    .insert(pantryItems)
    .values({
      userId: user.id,
      name: groceryItem.ingredient,
      category:
        groceryItem.category ?? categorizePantryItem(groceryItem.ingredient),
      amount: groceryItem.amount || null,
      unit: groceryItem.unit || null,
      source: "grocery",
      groceryItemId: groceryItemId,
    })
    .returning();

  revalidatePath("/dashboard/pantry");
  return item;
}

// ===== EXPIRATION TRACKING =====

export async function getExpiringItems(daysAhead: number = 3) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + daysAhead);

  const items = await db.query.pantryItems.findMany({
    where: and(
      eq(pantryItems.userId, user.id),
      eq(pantryItems.isExpired, false),
      isNotNull(pantryItems.expirationDate),
      lte(pantryItems.expirationDate, cutoff),
    ),
    orderBy: [asc(pantryItems.expirationDate)],
  });

  return items;
}

export async function markItemExpired(id: string) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  await db
    .update(pantryItems)
    .set({ isExpired: true, updatedAt: new Date() })
    .where(and(eq(pantryItems.id, id), eq(pantryItems.userId, user.id)));

  revalidatePath("/dashboard/pantry");
}

// ===== "WHAT CAN I COOK?" =====

export async function getRecipesFromPantry() {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  // Get all active pantry items
  const pantry = await db.query.pantryItems.findMany({
    where: and(
      eq(pantryItems.userId, user.id),
      eq(pantryItems.isExpired, false),
    ),
  });

  if (pantry.length === 0) return { recipes: [], pantryItemNames: [] };

  const pantryItemNames = pantry.map((p) => p.name.toLowerCase());

  // Get all user recipes with ingredients
  const userRecipes = await db.query.recipes.findMany({
    where: eq(recipes.userId, user.id),
    with: {
      ingredients: {
        orderBy: (ing, { asc }) => [asc(ing.order)],
      },
    },
  });

  // Score each recipe by how many ingredients match pantry
  const scoredRecipes = userRecipes.map((recipe) => {
    const totalIngredients = recipe.ingredients.length;
    if (totalIngredients === 0)
      return { recipe, matchCount: 0, matchPercent: 0, missingIngredients: [] };

    let matchCount = 0;
    const missingIngredients: string[] = [];

    for (const ing of recipe.ingredients) {
      const ingName = ing.ingredient.toLowerCase();
      const hasMatch = pantryItemNames.some(
        (pantryName) =>
          ingName.includes(pantryName) || pantryName.includes(ingName),
      );
      if (hasMatch) {
        matchCount++;
      } else {
        missingIngredients.push(ing.ingredient);
      }
    }

    const matchPercent = Math.round((matchCount / totalIngredients) * 100);
    return { recipe, matchCount, matchPercent, missingIngredients };
  });

  // Return recipes sorted by match percentage (best matches first)
  const filtered = scoredRecipes
    .filter((r) => r.matchPercent > 0)
    .sort((a, b) => b.matchPercent - a.matchPercent);

  return { recipes: filtered, pantryItemNames };
}

// ===== SMART SUGGESTIONS (autocomplete) =====

export async function getPantrySuggestions(query: string) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  if (query.length < 2) return [];

  const lowerQuery = query.toLowerCase();

  // Search user's existing recipe ingredients for suggestions
  const userIngredients = await db
    .selectDistinct({ ingredient: recipeIngredients.ingredient })
    .from(recipeIngredients)
    .innerJoin(recipes, eq(recipeIngredients.recipeId, recipes.id))
    .where(eq(recipes.userId, user.id))
    .limit(100);

  const matches = userIngredients
    .map((r) => r.ingredient)
    .filter((ing) => ing.toLowerCase().includes(lowerQuery))
    .sort((a, b) => {
      const aStarts = a.toLowerCase().startsWith(lowerQuery);
      const bStarts = b.toLowerCase().startsWith(lowerQuery);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.localeCompare(b);
    })
    .slice(0, 8);

  if (matches.length === 0) {
    const commonItems = [
      "milk",
      "eggs",
      "bread",
      "butter",
      "cheese",
      "chicken breast",
      "ground beef",
      "rice",
      "pasta",
      "tomatoes",
      "onions",
      "garlic",
      "potatoes",
      "carrots",
      "lettuce",
      "apples",
      "bananas",
      "yogurt",
      "flour",
      "sugar",
      "salt",
      "pepper",
      "olive oil",
      "frozen peas",
      "frozen berries",
      "ice cream",
      "frozen pizza",
    ];
    return commonItems.filter((item) => item.includes(lowerQuery)).slice(0, 8);
  }

  return matches;
}

// ===== PANTRY STATS =====

export async function getPantryStats() {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const items = await db.query.pantryItems.findMany({
    where: and(
      eq(pantryItems.userId, user.id),
      eq(pantryItems.isExpired, false),
    ),
  });

  const now = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(now.getDate() + 3);

  const expiringSoon = items.filter(
    (i) => i.expirationDate && i.expirationDate <= threeDaysFromNow,
  ).length;

  const byCategory = items.reduce(
    (acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return {
    totalItems: items.length,
    expiringSoon,
    byCategory,
  };
}

// ===== HELPERS =====

function categorizePantryItem(
  name: string,
): "produce" | "meat" | "dairy" | "pantry" | "frozen" | "other" {
  const lower = name.toLowerCase();
  if (/(frozen|ice cream)/i.test(lower)) return "frozen";
  if (/(milk|cheese|yogurt|butter|cream|egg)/i.test(lower)) return "dairy";
  if (/(chicken|beef|pork|fish|turkey|lamb|shrimp|salmon|tofu)/i.test(lower))
    return "meat";
  if (
    /(lettuce|tomato|onion|carrot|pepper|spinach|garlic|lemon|lime|cilantro|parsley|cucumber|potato|avocado|ginger|basil|mint|apple|banana|berry|berries|grape|orange|mango|broccoli|zucchini|mushroom|celery|corn|pea)/i.test(
      lower,
    )
  )
    return "produce";
  if (
    /(flour|sugar|salt|pepper|oil|vinegar|sauce|rice|pasta|cumin|paprika|cinnamon|can|broth|stock|honey|soy|mustard|ketchup|mayo|baking)/i.test(
      lower,
    )
  )
    return "pantry";
  return "other";
}
