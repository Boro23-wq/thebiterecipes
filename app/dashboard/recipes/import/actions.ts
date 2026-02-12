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
import { revalidatePath } from "next/cache";
import * as cheerio from "cheerio";
import { uploadRemoteImageToUploadThing } from "@/lib/upload-remote-image";

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

interface RecipeSchema {
  "@type": string | string[];
  name?: string;
  image?: string | string[] | { url?: string } | { url?: string }[];
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  recipeYield?: string | number;
  recipeIngredient?: string | string[];
  recipeInstructions?: string | RecipeInstruction | RecipeInstruction[];
  recipeCuisine?: string;
  recipeCategory?: string;
  description?: string;
  recipeNotes?: string;
  nutrition?: {
    calories?: string | number;
    proteinContent?: string | number;
    carbohydrateContent?: string | number;
    fatContent?: string | number;
  };
  url?: string;
}

interface RecipeInstruction {
  "@type"?: string;
  text?: string;
  name?: string;
  itemListElement?: RecipeInstruction[];
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const isRecipeType = (t: unknown): boolean => {
  if (typeof t === "string") return t === "Recipe";
  if (Array.isArray(t)) return t.includes("Recipe");
  return false;
};

const asRecipeSchema = (v: unknown): RecipeSchema | null => {
  if (!isObject(v)) return null;
  if (!Object.prototype.hasOwnProperty.call(v, "@type")) return null;
  if (!isRecipeType(v["@type"])) return null;
  return v as unknown as RecipeSchema;
};

const extractGraph = (v: unknown): unknown[] | null => {
  if (!isObject(v)) return null;
  const g = v["@graph"];
  return Array.isArray(g) ? g : null;
};

const findRecipeInJsonLd = (json: unknown): RecipeSchema | null => {
  const direct = asRecipeSchema(json);
  if (direct) return direct;

  if (Array.isArray(json)) {
    for (const item of json) {
      const r = asRecipeSchema(item);
      if (r) return r;

      const graph = extractGraph(item);
      if (graph) {
        for (const node of graph) {
          const rg = asRecipeSchema(node);
          if (rg) return rg;
        }
      }
    }
    return null;
  }

  const graph = extractGraph(json);
  if (graph) {
    for (const node of graph) {
      const r = asRecipeSchema(node);
      if (r) return r;
    }
  }

  return null;
};

const parseDuration = (duration?: string): number | undefined => {
  if (!duration) return undefined;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return undefined;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const total = hours * 60 + minutes;
  return Number.isFinite(total) ? total : undefined;
};

const toStringArray = (v: unknown): string[] => {
  if (!v) return [];
  if (typeof v === "string") return v.trim() ? [v.trim()] : [];
  if (Array.isArray(v))
    return v
      .map(String)
      .map((s) => s.trim())
      .filter(Boolean);
  return [];
};

const extractInstructionText = (inst: unknown): string[] => {
  if (!inst) return [];

  if (typeof inst === "string") return inst.trim() ? [inst.trim()] : [];

  if (Array.isArray(inst)) {
    return inst.flatMap((x) => extractInstructionText(x)).filter(Boolean);
  }

  if (isObject(inst)) {
    if (typeof inst.text === "string" && inst.text.trim())
      return [inst.text.trim()];
    if (typeof inst.name === "string" && inst.name.trim())
      return [inst.name.trim()];

    if (Array.isArray(inst.itemListElement)) {
      return inst.itemListElement
        .flatMap((x) => extractInstructionText(x))
        .filter(Boolean);
    }
  }

  return [];
};

const extractImageUrls = (image: RecipeSchema["image"]): string[] => {
  if (!image) return [];

  const urls: string[] = [];

  if (typeof image === "string") {
    urls.push(image);
  } else if (Array.isArray(image)) {
    for (const item of image) {
      if (typeof item === "string") {
        urls.push(item);
      } else if (isObject(item) && typeof item.url === "string") {
        urls.push(item.url);
      }
      if (urls.length >= 3) break; // Take max 3
    }
  } else if (isObject(image) && typeof image.url === "string") {
    urls.push(image.url);
  }

  return urls.slice(0, 3); // Ensure max 3
};

const extractServings = (
  recipeYield: RecipeSchema["recipeYield"],
): number | undefined => {
  if (typeof recipeYield === "number") return recipeYield;
  if (typeof recipeYield === "string") {
    const match = recipeYield.match(/\d+/);
    if (!match) return undefined;
    const n = parseInt(match[0], 10);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
};

const extractCalories = (cal: unknown): number | undefined => {
  if (cal == null) return undefined;
  const match = String(cal).match(/\d+/);
  if (!match) return undefined;
  const n = parseInt(match[0], 10);
  return Number.isFinite(n) ? n : undefined;
};

const extractGrams = (content: unknown): number | undefined => {
  if (content == null) return undefined;
  const str = String(content);
  // Match numbers before 'g' or just plain numbers
  const match = str.match(/(\d+(?:\.\d+)?)\s*g?/);
  if (!match) return undefined;
  const n = parseFloat(match[1]);
  return Number.isFinite(n) ? Math.round(n) : undefined;
};

export async function parseRecipeUrl(
  url: string,
): Promise<ParsedRecipe | null> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; RecipeBot/1.0)" },
      cache: "no-store",
    });

    if (!response.ok)
      throw new Error(`Failed to fetch recipe: ${response.status}`);

    const html = await response.text();
    const $ = cheerio.load(html);

    // IMPORTANT: avoid cheerio .each() mutation (TS narrowing issue).
    // Collect script contents then loop normally.
    const jsonLdBlocks: string[] = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      const raw = $(el).contents().text();
      if (raw && raw.trim()) jsonLdBlocks.push(raw);
    });

    let recipeData: RecipeSchema | null = null;

    for (const raw of jsonLdBlocks) {
      try {
        const parsed: unknown = JSON.parse(raw);
        const found = findRecipeInJsonLd(parsed);
        if (found) {
          recipeData = found;
          break;
        }
      } catch {
        // ignore invalid jsonld
      }
    }

    if (!recipeData) return null;

    const ingredients = toStringArray(recipeData.recipeIngredient);
    const instructions = extractInstructionText(recipeData.recipeInstructions);

    const category = Array.isArray(recipeData.recipeCategory)
      ? recipeData.recipeCategory[0]
      : recipeData.recipeCategory;

    const imageUrls = extractImageUrls(recipeData.image);

    let combinedNotes = "";
    if (recipeData.description) {
      combinedNotes = recipeData.description;
    }
    if (recipeData.recipeNotes) {
      combinedNotes = combinedNotes
        ? `${combinedNotes}\n\nCook's Note:\n${recipeData.recipeNotes}`
        : recipeData.recipeNotes;
    }

    return {
      title: recipeData.name || "Untitled Recipe",
      imageUrl: imageUrls[0],
      imageUrls,
      prepTime: parseDuration(recipeData.prepTime),
      cookTime: parseDuration(recipeData.cookTime),
      totalTime: parseDuration(recipeData.totalTime),
      servings: extractServings(recipeData.recipeYield),
      ingredients,
      instructions,
      cuisine: recipeData.recipeCuisine,
      category,
      calories: extractCalories(recipeData.nutrition?.calories),
      protein: extractGrams(recipeData.nutrition?.proteinContent),
      carbs: extractGrams(recipeData.nutrition?.carbohydrateContent),
      fat: extractGrams(recipeData.nutrition?.fatContent),
      description: recipeData.description,
      notes: combinedNotes || undefined,
      source: url,
    };
  } catch (error) {
    console.error("Error parsing recipe:", error);
    return null;
  }
}

export async function importRecipe(data: ParsedRecipe) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const hostedImageUrls: string[] = [];

  if (data.imageUrls && data.imageUrls.length > 0) {
    for (const url of data.imageUrls) {
      try {
        const hosted = await uploadRemoteImageToUploadThing(url);
        hostedImageUrls.push(hosted);
      } catch (e) {
        console.error("Image upload failed for", url, e);
      }
    }
  }

  const [recipe] = await db
    .insert(recipes)
    .values({
      userId: user.id,
      title: data.title,
      imageUrl: hostedImageUrls[0],
      prepTime: data.prepTime,
      cookTime: data.cookTime,
      totalTime:
        data.totalTime ||
        (data.prepTime && data.cookTime
          ? data.prepTime + data.cookTime
          : undefined),
      servings: data.servings,
      cuisine: data.cuisine,
      category: data.category,
      calories: data.calories,
      protein: data.protein,
      carbs: data.carbs,
      fat: data.fat,
      notes: data.notes,
      source: data.source,
    })
    .returning();

  // Save all images to recipeImages table
  if (hostedImageUrls.length > 0) {
    await db.insert(recipeImages).values(
      hostedImageUrls.map((imageUrl, index) => ({
        recipeId: recipe.id,
        imageUrl,
        order: index,
      })),
    );
  }

  // Ingredients
  if (data.ingredients.length > 0) {
    await db.insert(recipeIngredients).values(
      data.ingredients.map((ingredient, index) => ({
        recipeId: recipe.id,
        ingredient,
        order: index,
      })),
    );
  }

  // Instructions
  if (data.instructions.length > 0) {
    await db.insert(recipeInstructions).values(
      data.instructions.map((stepText, index) => ({
        recipeId: recipe.id,
        step: stepText,
        order: index,
      })),
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/recipes");
  redirect(`/dashboard/recipes/${recipe.id}`);
}
