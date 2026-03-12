"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { aggregateGroceryWithGemini } from "@/lib/gemini";
import {
  groceryListItems,
  groceryLists,
  mealPlanRecipes,
  mealPlans,
  recipes,
  recipeIngredients,
} from "@/db/schema";

// ===== MEAL PLAN CRUD =====

export async function createMealPlan(input: {
  startDate: Date;
  endDate: Date;
  name?: string;
}) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const [plan] = await db
    .insert(mealPlans)
    .values({
      userId: user.id,
      startDate: input.startDate,
      endDate: input.endDate,
      name: input.name ?? null,
    })
    .returning();

  return plan;
}

export async function addRecipeToMealPlan(input: {
  mealPlanId: string;
  recipeId: string;
  date: Date;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  customServings?: number;
  notes?: string;
}) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  // Verify ownership
  const plan = await db.query.mealPlans.findFirst({
    where: and(
      eq(mealPlans.id, input.mealPlanId),
      eq(mealPlans.userId, user.id),
    ),
  });
  if (!plan) throw new Error("Meal plan not found");

  // Get current max order for this meal slot
  const existing = await db.query.mealPlanRecipes.findMany({
    where: and(
      eq(mealPlanRecipes.mealPlanId, input.mealPlanId),
      sql`DATE(${mealPlanRecipes.date}) = DATE(${input.date})`,
      eq(mealPlanRecipes.mealType, input.mealType),
    ),
    orderBy: (mpr, { desc }) => [desc(mpr.order)],
    limit: 1,
  });

  const nextOrder = existing[0]?.order ? existing[0].order + 1 : 0;

  const [planRecipe] = await db
    .insert(mealPlanRecipes)
    .values({
      mealPlanId: input.mealPlanId,
      recipeId: input.recipeId,
      date: input.date,
      mealType: input.mealType,
      customServings: input.customServings ?? null,
      notes: input.notes ?? null,
      order: nextOrder,
    })
    .returning();

  // Mark grocery list as stale
  await markGroceryListStale(input.mealPlanId);

  revalidatePath("/dashboard/meal-plan");
  return planRecipe;
}

export async function removeRecipeFromMealPlan(mealPlanRecipeId: string) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  // Verify ownership through meal plan
  const planRecipe = await db.query.mealPlanRecipes.findFirst({
    where: eq(mealPlanRecipes.id, mealPlanRecipeId),
    with: {
      mealPlan: true,
    },
  });

  if (!planRecipe || planRecipe.mealPlan.userId !== user.id) {
    throw new Error("Not found");
  }

  await db
    .delete(mealPlanRecipes)
    .where(eq(mealPlanRecipes.id, mealPlanRecipeId));

  // Mark grocery list as stale
  await markGroceryListStale(planRecipe.mealPlanId);

  revalidatePath("/dashboard/meal-plan");
}

export async function updateMealPlanRecipeServings(input: {
  mealPlanRecipeId: string;
  customServings: number;
}) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const planRecipe = await db.query.mealPlanRecipes.findFirst({
    where: eq(mealPlanRecipes.id, input.mealPlanRecipeId),
    with: { mealPlan: true },
  });

  if (!planRecipe || planRecipe.mealPlan.userId !== user.id) {
    throw new Error("Not found");
  }

  await db
    .update(mealPlanRecipes)
    .set({ customServings: input.customServings })
    .where(eq(mealPlanRecipes.id, input.mealPlanRecipeId));

  await markGroceryListStale(planRecipe.mealPlanId);

  revalidatePath("/dashboard/meal-plan");
}

// ===== GROCERY LIST GENERATION (Gemini-powered) =====

async function markGroceryListStale(mealPlanId: string) {
  await db
    .update(groceryLists)
    .set({ isStale: true })
    .where(eq(groceryLists.mealPlanId, mealPlanId));
}

export async function generateGroceryList(mealPlanId: string) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  // Verify ownership
  const plan = await db.query.mealPlans.findFirst({
    where: and(eq(mealPlans.id, mealPlanId), eq(mealPlans.userId, user.id)),
    with: {
      mealPlanRecipes: {
        with: {
          recipe: {
            with: {
              ingredients: {
                orderBy: (ing, { asc }) => [asc(ing.order)],
              },
            },
          },
        },
      },
    },
  });

  if (!plan) throw new Error("Meal plan not found");

  // Get or create grocery list
  let groceryList = await db.query.groceryLists.findFirst({
    where: eq(groceryLists.mealPlanId, mealPlanId),
    with: {
      items: true,
    },
  });

  if (!groceryList) {
    const [newList] = await db
      .insert(groceryLists)
      .values({ mealPlanId })
      .returning();

    groceryList = {
      ...newList,
      items: [],
    };
  }

  // Save manual items & checked state before clearing
  const manualItems = groceryList.items.filter((i) => i.isManual);
  const checkedState = new Map(
    groceryList.items
      .filter((i) => i.isChecked)
      .map((i) => [i.ingredient.toLowerCase(), i]),
  );

  // Delete old auto-generated items
  await db
    .delete(groceryListItems)
    .where(
      and(
        eq(groceryListItems.groceryListId, groceryList.id),
        eq(groceryListItems.isManual, false),
      ),
    );

  // Build input for Gemini
  const recipeInputs = plan.mealPlanRecipes.map((mpr) => {
    const recipe = mpr.recipe;
    const servingsMultiplier =
      mpr.customServings && recipe.servings
        ? mpr.customServings / recipe.servings
        : 1;

    return {
      recipeName: recipe.title,
      servingsMultiplier,
      ingredients: recipe.ingredients.map((ing) => ({
        amount: ing.amount,
        ingredient: ing.ingredient,
      })),
    };
  });

  // Call Gemini for smart aggregation (with fallback)
  let aggregated;
  try {
    aggregated = await aggregateGroceryWithGemini(recipeInputs);
  } catch (error) {
    console.error("Gemini grocery aggregation failed, using fallback:", error);
    aggregated = fallbackAggregate(recipeInputs);
  }

  // Insert new items
  const newItems = aggregated.map((item, idx) => {
    const prevChecked = checkedState.get(item.ingredient.toLowerCase());

    // Match recipe IDs from source ingredients for traceability
    const matchedRecipeIds = new Set<string>();
    for (const mpr of plan.mealPlanRecipes) {
      for (const src of item.sourceIngredients) {
        const srcLower = src.toLowerCase();
        const hasMatch = mpr.recipe.ingredients.some(
          (ing) =>
            srcLower.includes(ing.ingredient.toLowerCase()) ||
            ing.ingredient
              .toLowerCase()
              .includes(item.ingredient.toLowerCase()),
        );
        if (hasMatch) {
          matchedRecipeIds.add(mpr.recipe.id);
        }
      }
    }

    return {
      groceryListId: groceryList!.id,
      ingredient: item.ingredient,
      amount: item.amount || null,
      unit: item.unit || null,
      recipeIds:
        matchedRecipeIds.size > 0
          ? JSON.stringify(Array.from(matchedRecipeIds))
          : null,
      isManual: false,
      isChecked: prevChecked?.isChecked ?? false,
      checkedAt: prevChecked?.checkedAt ?? null,
      category: item.category,
      notes: item.notes,
      order: idx,
    };
  });

  if (newItems.length > 0) {
    await db.insert(groceryListItems).values(newItems);
  }

  // Update grocery list metadata
  await db
    .update(groceryLists)
    .set({
      lastGeneratedAt: new Date(),
      isStale: false,
    })
    .where(eq(groceryLists.id, groceryList.id));

  revalidatePath("/dashboard/meal-plan");
  return { success: true, itemCount: newItems.length + manualItems.length };
}

// ===== FALLBACK AGGREGATION (if Gemini fails) =====

function fallbackAggregate(
  recipeInputs: Array<{
    recipeName: string;
    servingsMultiplier: number;
    ingredients: Array<{ amount: string | null; ingredient: string }>;
  }>,
) {
  const map = new Map<
    string,
    {
      ingredient: string;
      totalAmount: number;
      unit: string;
      sourceIngredients: string[];
    }
  >();

  for (const recipe of recipeInputs) {
    for (const ing of recipe.ingredients) {
      const raw = `${ing.amount || ""} ${ing.ingredient}`.trim();
      const key = ing.ingredient.toLowerCase().trim();

      if (!map.has(key)) {
        map.set(key, {
          ingredient: ing.ingredient,
          totalAmount: 0,
          unit: "",
          sourceIngredients: [],
        });
      }

      const entry = map.get(key)!;
      entry.sourceIngredients.push(raw);

      // Basic amount parsing
      if (ing.amount) {
        const fractionMatch = ing.amount.match(/(\d+)?\s*(\d+)\/(\d+)/);
        let num = 0;
        if (fractionMatch) {
          num =
            parseInt(fractionMatch[1] || "0") +
            parseInt(fractionMatch[2]) / parseInt(fractionMatch[3]);
        } else {
          num = parseFloat(ing.amount) || 0;
        }
        entry.totalAmount += num * recipe.servingsMultiplier;

        // Try to extract unit from amount string
        const unitMatch = ing.amount.match(
          /(?:\d[\d\/\s]*)\s*(lbs?|oz|cups?|tbsp|tsp|cloves?|cans?|containers?|gallons?|ml|l|kg|g)\b/i,
        );
        if (unitMatch && !entry.unit) {
          entry.unit = unitMatch[1].toLowerCase();
        }
      }
    }
  }

  return Array.from(map.values()).map((entry) => ({
    ingredient: entry.ingredient,
    amount:
      entry.totalAmount > 0
        ? String(Math.round(entry.totalAmount * 100) / 100)
        : "",
    unit: entry.unit,
    category: basicCategorize(entry.ingredient),
    notes: null as string | null,
    sourceIngredients: entry.sourceIngredients,
  }));
}

function basicCategorize(
  name: string,
): "produce" | "meat" | "dairy" | "pantry" | "other" {
  const lower = name.toLowerCase();
  if (/(milk|cheese|yogurt|butter|cream|egg)/i.test(lower)) return "dairy";
  if (/(chicken|beef|pork|fish|turkey|lamb|shrimp|salmon|tofu)/i.test(lower))
    return "meat";
  if (
    /(lettuce|tomato|onion|carrot|pepper|spinach|garlic|lemon|lime|cilantro|parsley|cucumber|potato|avocado|ginger|basil|mint)/i.test(
      lower,
    )
  )
    return "produce";
  if (
    /(flour|sugar|salt|pepper|oil|vinegar|sauce|rice|pasta|cumin|paprika|cinnamon|can|broth|stock)/i.test(
      lower,
    )
  )
    return "pantry";
  return "other";
}

// ===== GROCERY LIST ITEM ACTIONS =====

export async function toggleGroceryItem(itemId: string) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const item = await db.query.groceryListItems.findFirst({
    where: eq(groceryListItems.id, itemId),
    with: {
      groceryList: {
        with: { mealPlan: true },
      },
    },
  });

  if (!item || item.groceryList.mealPlan.userId !== user.id) {
    throw new Error("Not found");
  }

  const newChecked = !item.isChecked;

  await db
    .update(groceryListItems)
    .set({
      isChecked: newChecked,
      checkedAt: newChecked ? new Date() : null,
    })
    .where(eq(groceryListItems.id, itemId));

  revalidatePath("/dashboard/meal-plan");
}

export async function addManualGroceryItem(input: {
  groceryListId: string;
  ingredient: string;
  amount?: string;
  category?: string;
}) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const groceryList = await db.query.groceryLists.findFirst({
    where: eq(groceryLists.id, input.groceryListId),
    with: { mealPlan: true },
  });

  if (!groceryList || groceryList.mealPlan.userId !== user.id) {
    throw new Error("Not found");
  }

  // Get max order
  const items = await db.query.groceryListItems.findMany({
    where: eq(groceryListItems.groceryListId, input.groceryListId),
    orderBy: (gli, { desc }) => [desc(gli.order)],
    limit: 1,
  });

  const nextOrder = items[0]?.order ? items[0].order + 1 : 0;

  // Simple parse: try to extract amount from start of string
  const amountMatch = input.ingredient.match(
    /^([\d\s\/\.]+(?:lbs?|oz|cups?|tbsp|tsp|g|kg|ml|l)?)\s+(.+)/i,
  );

  const ingredient = amountMatch
    ? amountMatch[2].trim()
    : input.ingredient.trim();
  const amount = amountMatch ? amountMatch[1].trim() : input.amount || null;

  await db.insert(groceryListItems).values({
    groceryListId: input.groceryListId,
    ingredient,
    amount,
    unit: null,
    recipeIds: null,
    isManual: true,
    isChecked: false,
    category: input.category ?? basicCategorize(ingredient),
    notes: null,
    order: nextOrder,
  });

  revalidatePath("/dashboard/meal-plan");
}

export async function updateGroceryItemQuantity(input: {
  itemId: string;
  amount: string;
  unit?: string;
}) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const item = await db.query.groceryListItems.findFirst({
    where: eq(groceryListItems.id, input.itemId),
    with: {
      groceryList: {
        with: { mealPlan: true },
      },
    },
  });

  if (!item || item.groceryList.mealPlan.userId !== user.id) {
    throw new Error("Not found");
  }

  await db
    .update(groceryListItems)
    .set({
      amount: input.amount || null,
      unit: input.unit || null,
    })
    .where(eq(groceryListItems.id, input.itemId));

  revalidatePath("/dashboard/meal-plan");
}

export async function getIngredientSuggestions(query: string) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  if (query.length < 2) return [];

  const lowerQuery = query.toLowerCase();

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
    ];

    return commonItems.filter((item) => item.includes(lowerQuery)).slice(0, 8);
  }

  return matches;
}

export async function toggleCategoryItems(input: {
  groceryListId: string;
  category: string;
  checked: boolean;
}) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const groceryList = await db.query.groceryLists.findFirst({
    where: eq(groceryLists.id, input.groceryListId),
    with: { mealPlan: true },
  });

  if (!groceryList || groceryList.mealPlan.userId !== user.id) {
    throw new Error("Not found");
  }

  await db
    .update(groceryListItems)
    .set({
      isChecked: input.checked,
      checkedAt: input.checked ? new Date() : null,
    })
    .where(
      and(
        eq(groceryListItems.groceryListId, input.groceryListId),
        eq(groceryListItems.category, input.category),
      ),
    );

  revalidatePath("/dashboard/meal-plan");
}

export async function reorderGroceryItems(input: {
  groceryListId: string;
  itemUpdates: Array<{ id: string; order: number }>;
}) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const groceryList = await db.query.groceryLists.findFirst({
    where: eq(groceryLists.id, input.groceryListId),
    with: { mealPlan: true },
  });

  if (!groceryList || groceryList.mealPlan.userId !== user.id) {
    throw new Error("Not found");
  }

  for (const update of input.itemUpdates) {
    await db
      .update(groceryListItems)
      .set({ order: update.order })
      .where(eq(groceryListItems.id, update.id));
  }

  revalidatePath("/dashboard/meal-plan");
}

export async function clearCheckedGroceryItems(groceryListId: string) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const groceryList = await db.query.groceryLists.findFirst({
    where: eq(groceryLists.id, groceryListId),
    with: { mealPlan: true },
  });

  if (!groceryList || groceryList.mealPlan.userId !== user.id) {
    throw new Error("Not found");
  }

  await db
    .delete(groceryListItems)
    .where(
      and(
        eq(groceryListItems.groceryListId, groceryListId),
        eq(groceryListItems.isChecked, true),
      ),
    );

  revalidatePath("/dashboard/meal-plan");
  return { success: true };
}

export async function deleteGroceryItem(itemId: string) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const item = await db.query.groceryListItems.findFirst({
    where: eq(groceryListItems.id, itemId),
    with: {
      groceryList: {
        with: { mealPlan: true },
      },
    },
  });

  if (!item || item.groceryList.mealPlan.userId !== user.id) {
    throw new Error("Not found");
  }

  // Only allow deleting manual items
  if (!item.isManual) {
    throw new Error("Cannot delete auto-generated items");
  }

  await db.delete(groceryListItems).where(eq(groceryListItems.id, itemId));

  revalidatePath("/dashboard/meal-plan");
}
