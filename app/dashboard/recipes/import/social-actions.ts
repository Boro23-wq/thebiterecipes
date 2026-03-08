"use server";

import { detectPlatform } from "@/lib/platform-detector";
import { extractRecipeFromYouTube } from "@/lib/youtube-extractor";
import { extractRecipeFromTikTok } from "@/lib/tiktok-extractor";
import { parseRecipeWithGemini } from "@/lib/gemini";
import { type ExtractorResult } from "@/lib/types";

interface ParsedRecipe {
  title: string;
  imageUrl?: string;
  imageUrls?: string[];
  prepTime?: number;
  cookTime?: number;
  totalTime?: number;
  servings?: number;
  ingredients: string[];
  instructions: string[];
  cuisine?: string;
  category?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  description?: string;
  notes?: string;
  source?: string;
}

/**
 * Parse a social media URL into a structured recipe using platform-specific
 * extractors + Gemini AI.
 */
export async function parseSocialMediaUrl(
  url: string,
): Promise<ParsedRecipe | null> {
  const { platform } = detectPlatform(url);

  let result: ExtractorResult | null = null;

  switch (platform) {
    case "youtube":
      result = await extractRecipeFromYouTube(url);
      break;
    case "tiktok":
      result = await extractRecipeFromTikTok(url);
      break;
    case "instagram":
    case "pinterest":
      // These platforms are hard to scrape reliably
      // Return null so the UI can offer the manual paste fallback
      return null;
    default:
      return null;
  }

  if (!result) return null;

  const { recipe, source } = result;

  console.log("Extractor result keys:", Object.keys(result));
  console.log("imageUrl:", result.imageUrl);

  return {
    title: recipe.title,
    imageUrl: "imageUrl" in result ? result.imageUrl : undefined,
    description: recipe.description,
    servings: recipe.servings,
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    totalTime:
      recipe.prepTime && recipe.cookTime
        ? recipe.prepTime + recipe.cookTime
        : undefined,
    cuisine: recipe.cuisine,
    category: recipe.category,
    calories: recipe.calories,
    protein: recipe.protein,
    carbs: recipe.carbs,
    fat: recipe.fat,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    notes: recipe.notes,
    source,
  };
}

/**
 * Parse manually pasted text (caption, transcript, etc.) into a recipe
 * using Gemini. Fallback for platforms we can't scrape.
 */
export async function parseManualText(
  text: string,
  sourceUrl?: string,
): Promise<ParsedRecipe | null> {
  const recipe = await parseRecipeWithGemini(text, "social media post");

  if (!recipe) return null;

  return {
    title: recipe.title,
    description: recipe.description,
    servings: recipe.servings,
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    totalTime:
      recipe.prepTime && recipe.cookTime
        ? recipe.prepTime + recipe.cookTime
        : undefined,
    cuisine: recipe.cuisine,
    category: recipe.category,
    calories: recipe.calories,
    protein: recipe.protein,
    carbs: recipe.carbs,
    fat: recipe.fat,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    notes: recipe.notes,
    source: sourceUrl,
  };
}

/**
 * Parse recipe from uploaded screenshot images using Gemini Vision.
 * Images are sent as base64 strings.
 */
export async function parseScreenshots(
  images: { base64: string; mimeType: string }[],
  sourceUrl?: string,
): Promise<ParsedRecipe | null> {
  const { parseRecipeFromImages } = await import("@/lib/gemini");

  const recipe = await parseRecipeFromImages(
    images,
    sourceUrl ? "social media" : undefined,
  );

  if (!recipe) return null;

  return {
    title: recipe.title,
    description: recipe.description,
    servings: recipe.servings,
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    totalTime:
      recipe.prepTime && recipe.cookTime
        ? recipe.prepTime + recipe.cookTime
        : undefined,
    cuisine: recipe.cuisine,
    category: recipe.category,
    calories: recipe.calories,
    protein: recipe.protein,
    carbs: recipe.carbs,
    fat: recipe.fat,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    notes: recipe.notes,
    source: sourceUrl,
  };
}
