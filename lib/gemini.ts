import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface GeminiParsedRecipe {
  title: string;
  description?: string;
  servings?: number;
  prepTime?: number;
  cookTime?: number;
  cuisine?: string;
  category?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  ingredients: string[];
  instructions: string[];
  notes?: string;
}

export interface GeminiGroceryItem {
  ingredient: string;
  amount: string;
  unit: string;
  category: "produce" | "meat" | "dairy" | "pantry" | "other";
  notes: string | null;
  sourceIngredients: string[];
}

const RECIPE_PARSE_PROMPT = `You are a recipe extraction assistant. Given raw text from a social media post (caption, transcript, or description), extract a structured recipe.

Rules:
- Extract ONLY what is explicitly mentioned. Do not invent ingredients or steps.
- If the text is not a recipe or doesn't contain enough info to form one, return exactly: {"error": "not_a_recipe"}
- Ingredients should include quantities when mentioned (e.g. "2 cups flour", "1 tbsp olive oil").
- Remove leading dashes, bullets, or hyphens from ingredients (e.g. "-1 cup flour" becomes "1 cup flour").
- Section headers like "For the Chicken:", "For the Sauce:", "For the Rice:" are NOT ingredients. Use them to add context to the ingredients that follow (e.g. "1.5 lbs chicken thighs (for the chicken)") or omit them entirely.
- If multiple sub-recipes exist (chicken, rice, sauce, salad), merge all ingredients into one flat list and all steps into one ordered list.
- Instructions should be clear, numbered steps. If the original text is a rambling transcript, clean it up into concise steps but keep all the actual cooking info.
- If nutrition info is not mentioned, omit those fields.
- Return ONLY valid JSON, no markdown, no backticks, no explanation.

Return this JSON shape:
{
  "title": "string",
  "description": "string or omit",
  "servings": "number or omit",
  "prepTime": "number in minutes or omit",
  "cookTime": "number in minutes or omit",
  "cuisine": "string or omit",
  "category": "string like Dinner, Breakfast, Dessert, Snack or omit",
  "calories": "number or omit",
  "protein": "number in grams or omit",
  "carbs": "number in grams or omit",
  "fat": "number in grams or omit",
  "ingredients": ["array of strings"],
  "instructions": ["array of strings"],
  "notes": "string or omit"
}`;

const GROCERY_AGGREGATE_PROMPT = `You are a smart grocery shopping assistant. Given raw recipe ingredients from multiple recipes (with serving multipliers already applied), produce a consolidated, shopper-friendly grocery list.
 
CRITICAL RULES:
 
1. PRESERVE UNITS — Never drop units. "1 1/2 lbs ground lamb" must become amount:"1.5", unit:"lbs", ingredient:"ground lamb". If no unit is present (e.g. "2 tomatoes"), use unit:"" and keep the amount.
 
2. AGGREGATE SAME INGREDIENTS — Combine items that are the same base ingredient:
   - "1 onion" + "1 small white onion" + "1 grated onion" → amount:"3", unit:"", ingredient:"onions", notes:"includes 1 small white, 1 for grating"
   - "2 tbsp butter" + "1/4 cup butter" → convert to same unit and sum, e.g. amount:"6", unit:"tbsp", ingredient:"unsalted butter"
   - Do NOT merge ingredients that are genuinely different (e.g. "green onion" and "yellow onion" stay separate)
 
3. UNIT CONVERSION — When the same ingredient appears with different units:
   - Convert to the more common shopping unit (e.g. cups > tbsp for large amounts, lbs > oz for meat)
   - "3 tbsp olive oil" + "1/4 cup olive oil" → amount:"7", unit:"tbsp", ingredient:"olive oil"
 
4. BUYABLE QUANTITIES — Round up to realistic purchase amounts:
   - "1/4 cup yogurt" → amount:"1", unit:"container", ingredient:"plain whole-milk yogurt", notes:"only 1/4 cup needed"
   - "2 tbsp tomato paste" → amount:"1", unit:"small can", ingredient:"tomato paste", notes:"only 2 tbsp needed"
   - Staples like flour, sugar, oil — if user likely already has them, note it: notes:"pantry staple, 2 tbsp needed"
   - Produce: keep exact counts (e.g. "3 lemons", not "1 bag lemons")
 
5. TO-TASTE ITEMS — "salt", "pepper", "water", items listed as "to taste" or "pinch of":
   - List once with amount:"", unit:"", notes:"to taste"
 
6. NORMALIZE NAMES — Clean up ingredient names for shopping:
   - "fresh cilantro leaves, chopped" → "fresh cilantro"
   - "boneless skinless chicken thighs" → "boneless skinless chicken thighs" (keep specifics that matter for buying)
   - Remove preparation words: "diced", "minced", "grated", "chopped", "sliced" — but keep them in notes if relevant
 
7. CATEGORY — Must be exactly one of: "produce", "meat", "dairy", "pantry", "other"
   - produce: fruits, vegetables, fresh herbs
   - meat: all proteins including fish, seafood, tofu
   - dairy: milk, cheese, yogurt, butter, eggs
   - pantry: oils, spices, flour, sugar, canned goods, sauces, grains, pasta, rice
   - other: anything else
 
8. sourceIngredients — Include the EXACT original strings so user can trace back. This is critical for debugging.
 
Return ONLY a valid JSON array. No markdown, no backticks, no explanation. Example:
[
  {"ingredient":"ground lamb","amount":"1.5","unit":"lbs","category":"meat","notes":null,"sourceIngredients":["1 1/2 lbs ground lamb"]},
  {"ingredient":"onions","amount":"3","unit":"","category":"produce","notes":"includes 1 small white, 1 for grating","sourceIngredients":["1 onion","1 small white onion","1 grated onion"]},
  {"ingredient":"plain whole-milk yogurt","amount":"1","unit":"container","category":"dairy","notes":"only 1/4 cup needed","sourceIngredients":["1/4 cup plain whole-milk yogurt"]},
  {"ingredient":"salt","amount":"","unit":"","category":"pantry","notes":"to taste","sourceIngredients":["salt to taste","pinch of salt"]}
]`;

/**
 * Parse recipe from screenshot images using Gemini Vision
 */
export async function parseRecipeFromImages(
  images: { base64: string; mimeType: string }[],
  sourceContext?: string,
): Promise<GeminiParsedRecipe | null> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const prompt = sourceContext
    ? `${RECIPE_PARSE_PROMPT}\n\nSource: ${sourceContext} screenshot(s)`
    : `${RECIPE_PARSE_PROMPT}\n\nExtract the recipe from these screenshot(s).`;

  // Build parts array: text prompt + image(s)
  const parts: Array<
    { text: string } | { inlineData: { mimeType: string; data: string } }
  > = [{ text: prompt }];

  for (const img of images) {
    parts.push({
      inlineData: {
        mimeType: img.mimeType,
        data: img.base64,
      },
    });
  }

  try {
    const result = await model.generateContent(parts);
    const text = result.response.text().trim();

    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned) as Partial<GeminiParsedRecipe> & {
      error?: string;
    };

    if (parsed.error === "not_a_recipe") return null;

    if (
      !parsed.title ||
      !Array.isArray(parsed.ingredients) ||
      parsed.ingredients.length === 0
    ) {
      return null;
    }

    return {
      title: parsed.title,
      description: parsed.description ?? undefined,
      servings: parsed.servings ?? undefined,
      prepTime: parsed.prepTime ?? undefined,
      cookTime: parsed.cookTime ?? undefined,
      cuisine: parsed.cuisine ?? undefined,
      category: parsed.category ?? undefined,
      calories: parsed.calories ? Math.round(parsed.calories) : undefined,
      protein: parsed.protein ? Math.round(parsed.protein) : undefined,
      carbs: parsed.carbs ? Math.round(parsed.carbs) : undefined,
      fat: parsed.fat ? Math.round(parsed.fat) : undefined,
      ingredients: parsed.ingredients.filter(Boolean),
      instructions: Array.isArray(parsed.instructions)
        ? parsed.instructions.filter(Boolean)
        : [],
      notes: parsed.notes ?? undefined,
    };
  } catch (error: unknown) {
    console.error("Gemini vision parsing failed:", error);

    if (error instanceof Error && error.message.includes("429")) {
      console.log("Retrying Gemini after rate limit...");
      await new Promise((resolve) => setTimeout(resolve, 2000));

      try {
        const result = await model.generateContent(parts);
        const text = result.response.text().trim();
        const cleaned = text
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();
        const parsed = JSON.parse(cleaned) as Partial<GeminiParsedRecipe> & {
          error?: string;
        };
        if (parsed.error === "not_a_recipe") return null;
        if (
          !parsed.title ||
          !Array.isArray(parsed.ingredients) ||
          parsed.ingredients.length === 0
        )
          return null;
        return {
          title: parsed.title,
          description: parsed.description ?? undefined,
          servings: parsed.servings ?? undefined,
          prepTime: parsed.prepTime ?? undefined,
          cookTime: parsed.cookTime ?? undefined,
          cuisine: parsed.cuisine ?? undefined,
          category: parsed.category ?? undefined,
          calories: parsed.calories ?? undefined,
          protein: parsed.protein ?? undefined,
          carbs: parsed.carbs ?? undefined,
          fat: parsed.fat ?? undefined,
          ingredients: parsed.ingredients.filter(Boolean),
          instructions: Array.isArray(parsed.instructions)
            ? parsed.instructions.filter(Boolean)
            : [],
          notes: parsed.notes ?? undefined,
        };
      } catch {
        throw new Error(
          "AI is temporarily rate limited. Please try again in a minute.",
        );
      }
    }

    return null;
  }
}

export async function parseRecipeWithGemini(
  rawText: string,
  sourceContext?: string,
): Promise<GeminiParsedRecipe | null> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const MAX_INPUT_LENGTH = 8000;

  const trimmedText =
    rawText.length > MAX_INPUT_LENGTH
      ? rawText.slice(0, MAX_INPUT_LENGTH)
      : rawText;

  const userMessage = sourceContext
    ? `Source: ${sourceContext}\n\n${trimmedText}`
    : trimmedText;

  const runGemini = async (): Promise<GeminiParsedRecipe | null> => {
    const result = await model.generateContent(
      `${RECIPE_PARSE_PROMPT}\n\n${userMessage}`,
    );

    const text = result.response.text().trim();

    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned) as Partial<GeminiParsedRecipe> & {
      error?: string;
    };

    if (parsed.error === "not_a_recipe") return null;

    if (
      !parsed.title ||
      !Array.isArray(parsed.ingredients) ||
      parsed.ingredients.length === 0
    ) {
      return null;
    }

    return {
      title: parsed.title,
      description: parsed.description ?? undefined,
      servings: parsed.servings ?? undefined,
      prepTime: parsed.prepTime ?? undefined,
      cookTime: parsed.cookTime ?? undefined,
      cuisine: parsed.cuisine ?? undefined,
      category: parsed.category ?? undefined,
      calories: parsed.calories ?? undefined,
      protein: parsed.protein ?? undefined,
      carbs: parsed.carbs ?? undefined,
      fat: parsed.fat ?? undefined,
      ingredients: parsed.ingredients.filter(Boolean),
      instructions: Array.isArray(parsed.instructions)
        ? parsed.instructions.filter(Boolean)
        : [],
      notes: parsed.notes ?? undefined,
    };
  };

  try {
    return await runGemini();
  } catch (error: unknown) {
    console.error("Gemini recipe parsing failed:", error);

    if (error instanceof Error && error.message.includes("429")) {
      console.log("Retrying Gemini after rate limit...");

      await new Promise((resolve) => setTimeout(resolve, 2000));

      try {
        return await runGemini();
      } catch {
        throw new Error(
          "AI is temporarily rate limited. Please try again in a minute.",
        );
      }
    }

    return null;
  }
}

export async function aggregateGroceryWithGemini(
  recipeIngredients: Array<{
    recipeName: string;
    servingsMultiplier: number;
    ingredients: Array<{ amount: string | null; ingredient: string }>;
  }>,
): Promise<GeminiGroceryItem[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  // Build input: scale amounts by multiplier and format for Gemini
  const input = recipeIngredients.map((recipe) => ({
    recipe: recipe.recipeName,
    ingredients: recipe.ingredients.map((ing) => {
      const raw = `${ing.amount || ""} ${ing.ingredient}`.trim();
      if (recipe.servingsMultiplier !== 1 && ing.amount) {
        return `${raw} (x${recipe.servingsMultiplier} servings)`;
      }
      return raw;
    }),
  }));

  const userMessage = `Here are all ingredients from ${recipeIngredients.length} recipes to consolidate into a grocery list:\n\n${JSON.stringify(input, null, 2)}`;

  const runGemini = async (): Promise<GeminiGroceryItem[]> => {
    const result = await model.generateContent(
      `${GROCERY_AGGREGATE_PROMPT}\n\n${userMessage}`,
    );

    const text = result.response.text().trim();
    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) {
      throw new Error("Gemini did not return an array");
    }

    // Validate and sanitize each item
    return parsed
      .filter(
        (item: Record<string, unknown>) =>
          item.ingredient && typeof item.ingredient === "string",
      )
      .map((item: Record<string, unknown>) => ({
        ingredient: String(item.ingredient).trim(),
        amount: String(item.amount ?? "").trim(),
        unit: String(item.unit ?? "").trim(),
        category: validateCategory(String(item.category ?? "other")),
        notes: item.notes ? String(item.notes).trim() : null,
        sourceIngredients: Array.isArray(item.sourceIngredients)
          ? item.sourceIngredients.map(String)
          : [],
      }));
  };

  try {
    return await runGemini();
  } catch (error: unknown) {
    console.error("Gemini grocery aggregation failed:", error);

    if (error instanceof Error && error.message.includes("429")) {
      console.log("Retrying Gemini after rate limit...");
      await new Promise((resolve) => setTimeout(resolve, 2000));

      try {
        return await runGemini();
      } catch {
        throw new Error(
          "AI is temporarily rate limited. Please try again in a minute.",
        );
      }
    }

    // If Gemini fails entirely, throw so the action can handle it
    throw new Error("Failed to generate grocery list with AI. Please retry.");
  }
}

function validateCategory(
  cat: string,
): "produce" | "meat" | "dairy" | "pantry" | "other" {
  const valid = ["produce", "meat", "dairy", "pantry", "other"] as const;
  const lower = cat.toLowerCase().trim();
  return valid.includes(lower as (typeof valid)[number])
    ? (lower as (typeof valid)[number])
    : "other";
}
