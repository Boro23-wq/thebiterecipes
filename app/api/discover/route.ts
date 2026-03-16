import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { recipes, seedRecipes, pantryItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ─── Types ───────────────────────────────────────────────────────────────────

interface RecipeSummary {
  id: string;
  title: string;
  cuisine: string | null;
  category: string | null;
  cookTime: number | null;
  prepTime: number | null;
  totalTime: number | null;
  servings: number | null;
  calories: number | null;
  protein: number | null;
  type: "saved" | "seed";
}

// ─── Gemini prompt ───────────────────────────────────────────────────────────

function buildPrompt(
  query: string,
  existingRecipes: RecipeSummary[],
  pantryItemNames: string[],
) {
  const recipeList = existingRecipes
    .map(
      (r) =>
        `[${r.type}:${r.id}] "${r.title}" — ${r.cuisine ?? "unknown"} cuisine, ${r.category ?? "uncategorized"}, ${r.totalTime ?? r.cookTime ?? "unknown"}min, ${r.calories ?? "?"}cal, serves ${r.servings ?? "?"}`,
    )
    .join("\n");

  const pantrySection =
    pantryItemNames.length > 0
      ? `\n\nThe user has these items in their pantry — prioritize recipes that use them:\n${pantryItemNames.join(", ")}`
      : "";

  return `You are a recipe discovery assistant for a cooking app.

The user said: "${query}"

Here are recipes already in their library and our starter bank:
${recipeList || "(none)"}
${pantrySection}

Your job:
1. FIRST check if any existing recipes genuinely match the user's request. A match means the recipe fits the described mood, ingredients, time constraints, and dietary needs — not just sharing a keyword. For example, "something creamy with chicken under 30 min" does NOT match "Chicken Fried Rice" (not creamy, takes 37min).
2. For good matches, return them as "match" type with their exact ID.
3. If fewer than 3 existing recipes match well, generate NEW recipes to fill up to 5 total results. Generated recipes must precisely match the user's request.
4. NEVER return recipes that don't fit. 0 results is better than bad results.
5. For generated recipes, return ingredients as objects with "amount" and "name" separated. The amount should include the number AND unit (e.g. "2 cups", "1 tbsp", "3 cloves"). The name should be the ingredient only. For items with no measurable amount (like "Salt and pepper to taste"), use amount: "to taste" and name: "salt and pepper".

Return ONLY valid JSON, no markdown fences, no explanation.

Return format:
{
  "results": [
    {
      "type": "match",
      "id": "saved:abc123 or seed:5",
      "reason": "brief reason why it matches"
    },
    {
      "type": "generated",
      "title": "...",
      "description": "1 sentence",
      "cookTime": 20,
      "prepTime": 10,
      "servings": 4,
      "cuisine": "Italian",
      "category": "Dinner",
      "calories": 400,
      "protein": 30,
      "ingredients": [{"amount": "2 cups", "name": "pasta"}, {"amount": "1 lb", "name": "chicken breast"}],
      "instructions": ["Step 1...", "Step 2..."]
    }
  ]
}`;
}

// ─── Pexels image fetcher ────────────────────────────────────────────────────

async function fetchPexelsImageUrl(query: string): Promise<string | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query + " food")}&per_page=1&orientation=landscape`,
      { headers: { Authorization: apiKey } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.photos?.[0]?.src?.medium ?? null;
  } catch {
    return null;
  }
}

// ─── Data fetchers ───────────────────────────────────────────────────────────

async function getRecipeSummaries(userId: string): Promise<RecipeSummary[]> {
  const [saved, seeds] = await Promise.all([
    db
      .select({
        id: recipes.id,
        title: recipes.title,
        cuisine: recipes.cuisine,
        category: recipes.category,
        cookTime: recipes.cookTime,
        prepTime: recipes.prepTime,
        totalTime: recipes.totalTime,
        servings: recipes.servings,
        calories: recipes.calories,
        protein: recipes.protein,
      })
      .from(recipes)
      .where(eq(recipes.userId, userId)),
    db
      .select({
        id: seedRecipes.id,
        title: seedRecipes.title,
        cuisine: seedRecipes.cuisine,
        cookTime: seedRecipes.cookTime,
        prepTime: seedRecipes.prepTime,
        totalTime: seedRecipes.totalTime,
        servings: seedRecipes.servings,
        calories: seedRecipes.calories,
        protein: seedRecipes.protein,
      })
      .from(seedRecipes),
  ]);

  return [
    ...saved.map((r) => ({
      ...r,
      id: `saved:${r.id}`,
      type: "saved" as const,
    })),
    ...seeds.map((r) => ({
      ...r,
      id: `seed:${r.id}`,
      category: null,
      type: "seed" as const,
    })),
  ];
}

async function getUserPantryItems(userId: string): Promise<string[]> {
  const items = await db
    .select({ name: pantryItems.name })
    .from(pantryItems)
    .where(
      and(eq(pantryItems.userId, userId), eq(pantryItems.isExpired, false)),
    )
    .limit(30);
  return items.map((i) => i.name);
}

async function hydrateMatchedRecipe(
  idString: string,
  userId: string,
): Promise<Record<string, unknown> | null> {
  const [type, rawId] = idString.split(":");
  if (!type || !rawId) return null;

  if (type === "saved") {
    const recipe = await db.query.recipes.findFirst({
      where: and(eq(recipes.id, rawId), eq(recipes.userId, userId)),
      with: { ingredients: true, instructions: true },
    });
    if (!recipe) return null;
    return {
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      cookTime: recipe.cookTime,
      prepTime: recipe.prepTime,
      totalTime: recipe.totalTime,
      servings: recipe.servings,
      cuisine: recipe.cuisine,
      category: recipe.category,
      calories: recipe.calories,
      protein: recipe.protein,
      imageUrl: recipe.imageUrl,
      ingredients: recipe.ingredients.map((i) =>
        `${i.amount ?? ""} ${i.ingredient}`.trim(),
      ),
      instructions: recipe.instructions
        .sort((a, b) => a.order - b.order)
        .map((i) => i.step),
      source: "saved",
    };
  }

  if (type === "seed") {
    const seedId = parseInt(rawId, 10);
    if (isNaN(seedId)) return null;

    const recipe = await db.query.seedRecipes.findFirst({
      where: eq(seedRecipes.id, seedId),
      with: { ingredients: true, instructions: true },
    });
    if (!recipe) return null;
    return {
      title: recipe.title,
      description: recipe.description,
      cookTime: recipe.cookTime,
      prepTime: recipe.prepTime,
      totalTime: recipe.totalTime,
      servings: recipe.servings,
      cuisine: recipe.cuisine,
      calories: recipe.calories,
      protein: recipe.protein,
      ingredients: recipe.ingredients.map((i) =>
        `${i.amount ?? ""} ${i.ingredient}`.trim(),
      ),
      instructions: recipe.instructions
        .sort((a, b) => a.order - b.order)
        .map((i) => i.step),
      source: "seed",
    };
  }

  return null;
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { query, usePantry } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Fetch data in parallel
    const [recipeSummaries, pantryItemNames] = await Promise.all([
      getRecipeSummaries(user.id),
      usePantry ? getUserPantryItems(user.id) : Promise.resolve([]),
    ]);

    // Ask Gemini to pick matches + generate new ones
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const prompt = buildPrompt(query, recipeSummaries, pantryItemNames);

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned);
    const aiResults = parsed.results ?? parsed ?? [];

    if (!Array.isArray(aiResults)) {
      return NextResponse.json({ recipes: [] });
    }

    // Hydrate matched recipes and pass through generated ones
    const finalRecipes = [];

    for (const item of aiResults.slice(0, 5)) {
      if (item.type === "match" && item.id) {
        const hydrated = await hydrateMatchedRecipe(item.id, user.id);
        if (hydrated) {
          finalRecipes.push(hydrated);
        }
      } else if (item.type === "generated") {
        const totalTime =
          (item.prepTime ?? 0) + (item.cookTime ?? 0) || undefined;
        finalRecipes.push({
          title: item.title ?? "Untitled Recipe",
          description: item.description,
          cookTime: item.cookTime,
          prepTime: item.prepTime,
          totalTime,
          servings: item.servings,
          cuisine: item.cuisine,
          category: item.category,
          calories: item.calories,
          protein: item.protein,
          imageUrl: null as string | null,
          ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
          instructions: Array.isArray(item.instructions)
            ? item.instructions
            : [],
          source: "ai",
        });
      }
    }

    // Fetch Pexels images for AI-generated recipes (in parallel)
    await Promise.all(
      finalRecipes.map(async (recipe) => {
        if (recipe.source === "ai" && !recipe.imageUrl) {
          const imageUrl = await fetchPexelsImageUrl(
            (recipe.title as string) ?? "",
          );
          if (imageUrl) {
            (recipe as Record<string, unknown>).imageUrl = imageUrl;
          }
        }
      }),
    );

    return NextResponse.json({ recipes: finalRecipes });
  } catch (error) {
    console.error("Discovery failed:", error);
    return NextResponse.json(
      { error: "Failed to discover recipes" },
      { status: 500 },
    );
  }
}
