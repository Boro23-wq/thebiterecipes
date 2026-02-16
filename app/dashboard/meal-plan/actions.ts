"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { parseIngredient } from "@/lib/parse-ingredient";
import {
  groceryListItems,
  groceryLists,
  mealPlanRecipes,
  mealPlans,
} from "@/db/schema";

type MealPlanRecipeWithDetails = {
  customServings: number | null;
  recipe: {
    id: string;
    title: string;
    servings: number | null;
    ingredients: Array<{
      amount: string | null;
      ingredient: string;
    }>;
  };
};

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

// ===== GROCERY LIST GENERATION =====

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

  // Save manual items & checked state
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

  // Aggregate ingredients with smart combining
  const aggregated = aggregateIngredients(
    plan.mealPlanRecipes as MealPlanRecipeWithDetails[],
  );

  // Insert new items
  const newItems = aggregated.map((item, idx) => {
    const prevChecked = checkedState.get(item.ingredient.toLowerCase());

    return {
      groceryListId: groceryList!.id,
      ingredient: item.ingredient,
      amount: item.amount,
      unit: item.unit,
      recipeIds: JSON.stringify(item.recipes),
      isManual: false,
      isChecked: prevChecked?.isChecked ?? false,
      checkedAt: prevChecked?.checkedAt ?? null,
      category: categorizeIngredient(item.ingredient),
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

// ===== SMART COMBINING LOGIC =====
function aggregateIngredients(mealPlanRecipes: MealPlanRecipeWithDetails[]) {
  const ingredientMap = new Map<
    string,
    {
      ingredient: string;
      totalAmount: number;
      recipes: Array<{ id: string; title: string }>;
    }
  >();

  for (const mpr of mealPlanRecipes) {
    const recipe = mpr.recipe;
    const servingsMultiplier =
      mpr.customServings && recipe.servings
        ? mpr.customServings / recipe.servings
        : 1;

    for (const ing of recipe.ingredients) {
      const parsed = parseIngredient(`${ing.amount || ""} ${ing.ingredient}`);
      const key = parsed.ingredient.toLowerCase().trim();

      if (!ingredientMap.has(key)) {
        ingredientMap.set(key, {
          ingredient: parsed.ingredient,
          totalAmount: 0,
          recipes: [],
        });
      }

      const entry = ingredientMap.get(key)!;

      const numericAmount = parseAmount(parsed.amount);
      if (numericAmount !== null) {
        entry.totalAmount += numericAmount * servingsMultiplier;
      }

      // ✅ Now TypeScript knows recipe has title
      if (!entry.recipes.some((r) => r.id === recipe.id)) {
        entry.recipes.push({ id: recipe.id, title: recipe.title });
      }
    }
  }

  return Array.from(ingredientMap.values()).map((entry) => ({
    ingredient: entry.ingredient,
    amount: formatAmount(entry.totalAmount),
    unit: null,
    recipes: entry.recipes,
  }));
}

function parseAmount(amountStr: string | null): number | null {
  if (!amountStr) return null;

  // Handle fractions: "1/2" → 0.5, "2 1/4" → 2.25
  const fractionMatch = amountStr.match(/(\d+)?\s*(\d+)\/(\d+)/);
  if (fractionMatch) {
    const whole = parseInt(fractionMatch[1] || "0");
    const num = parseInt(fractionMatch[2]);
    const denom = parseInt(fractionMatch[3]);
    return whole + num / denom;
  }

  const num = parseFloat(amountStr);
  return isNaN(num) ? null : num;
}

function formatAmount(amount: number): string {
  if (amount === 0) return "";

  // Round to 2 decimals
  const rounded = Math.round(amount * 100) / 100;

  // Convert to fraction if clean
  if (rounded === 0.25) return "1/4";
  if (rounded === 0.33) return "1/3";
  if (rounded === 0.5) return "1/2";
  if (rounded === 0.66) return "2/3";
  if (rounded === 0.75) return "3/4";

  return rounded.toString();
}

function categorizeIngredient(name: string): string {
  const lower = name.toLowerCase();

  if (/(milk|cheese|yogurt|butter|cream)/i.test(lower)) return "dairy";
  if (/(chicken|beef|pork|fish|turkey|lamb)/i.test(lower)) return "meat";
  if (/(lettuce|tomato|onion|carrot|pepper|spinach)/i.test(lower))
    return "produce";
  if (/(flour|sugar|salt|pepper|oil|vinegar|sauce)/i.test(lower))
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

  await db.insert(groceryListItems).values({
    groceryListId: input.groceryListId,
    ingredient: input.ingredient,
    amount: input.amount ?? null,
    unit: null,
    recipeIds: null,
    isManual: true,
    isChecked: false,
    category: input.category ?? "other",
    order: nextOrder,
  });

  revalidatePath("/dashboard/meal-plan");
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
