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
