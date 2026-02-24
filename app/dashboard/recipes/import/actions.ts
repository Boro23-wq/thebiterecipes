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
import { parseIngredient } from "@/lib/parse-ingredient";

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
  recipeCuisine?: string | string[];
  recipeCategory?: string | string[];
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

/* ----------------------------- JSON-LD helpers ---------------------------- */

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

const parseDuration = (duration?: string): number | undefined => {
  if (!duration) return undefined;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return undefined;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const total = hours * 60 + minutes;
  return Number.isFinite(total) ? total : undefined;
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

  // Match numbers like:
  // "11g"
  // "11 g"
  // "11.5g"
  // or just "11"
  const match = str.match(/(\d+(?:\.\d+)?)/);

  if (!match) return undefined;

  const n = parseFloat(match[1]);
  return Number.isFinite(n) ? Math.round(n) : undefined;
};

/* --------------------------- Image selection logic ------------------------ */
/**
 * Fixes “same image 3 times” (NYT etc.) where they give multiple sizes/crops.
 * We group by folder and pick the best candidate per folder.
 */

const imageFolderKey = (u: string) => {
  try {
    const url = new URL(u);
    const parts = url.pathname.split("/").filter(Boolean);
    const folder = parts.slice(0, -1).join("/");
    return `${url.origin}/${folder}`;
  } catch {
    const idx = u.lastIndexOf("/");
    return idx > 0 ? u.slice(0, idx) : u;
  }
};

const scoreImageUrl = (u: string) => {
  const s = u.toLowerCase();
  let score = 0;

  // NYT-ish patterns (prefer big)
  if (s.includes("jumbo")) score += 50;
  if (s.includes("video")) score += 10;
  if (s.includes("largeat2x")) score += 35;
  if (s.includes("threebytwo")) score += 15;
  if (s.includes("mediumsquare")) score += 5;

  if (s.endsWith(".jpg") || s.endsWith(".jpeg")) score += 2;
  if (s.endsWith(".png")) score += 1;

  return score;
};

const pickBestPerFolder = (urls: string[], max: number) => {
  const byFolder = new Map<string, string[]>();

  for (const u of urls) {
    const trimmed = (u ?? "").trim();
    if (!trimmed) continue;

    const key = imageFolderKey(trimmed);
    const list = byFolder.get(key) ?? [];
    list.push(trimmed);
    byFolder.set(key, list);
  }

  const picked: string[] = [];
  for (const [, list] of byFolder) {
    const best = [...list].sort(
      (a, b) => scoreImageUrl(b) - scoreImageUrl(a),
    )[0];
    if (best) picked.push(best);
  }

  return picked.slice(0, max);
};

const extractImageUrls = (image: RecipeSchema["image"]): string[] => {
  if (!image) return [];

  const raw: string[] = [];
  const pushUrl = (u: unknown) => {
    if (typeof u !== "string") return;
    const t = u.trim();
    if (t) raw.push(t);
  };

  if (typeof image === "string") {
    pushUrl(image);
  } else if (Array.isArray(image)) {
    for (const item of image) {
      if (typeof item === "string") pushUrl(item);
      else if (isObject(item) && typeof item.url === "string")
        pushUrl(item.url);
    }
  } else if (isObject(image) && typeof image.url === "string") {
    pushUrl(image.url);
  }

  return pickBestPerFolder(raw, 3);
};

const humanize = (s: string) =>
  s
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const normalizeListField = (v: unknown): string | undefined => {
  if (!v) return undefined;

  const arr = Array.isArray(v) ? v.map(String) : [String(v)];

  const cleaned = arr.map((s) => humanize(s)).filter(Boolean);

  return cleaned.length ? cleaned.join(", ") : undefined;
};

/* -------------------------------- Actions -------------------------------- */

export async function parseRecipeUrl(
  url: string,
): Promise<ParsedRecipe | null> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; RecipeBot/1.0)" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch recipe: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

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

    const cuisine = normalizeListField(recipeData.recipeCuisine);
    const category = normalizeListField(recipeData.recipeCategory);

    const imageUrls = extractImageUrls(recipeData.image);

    let combinedNotes = "";
    if (recipeData.description) combinedNotes = recipeData.description;
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
      cuisine,
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

  const pickedImageUrls = pickBestPerFolder(data.imageUrls ?? [], 3);

  const hostedImageUrls: string[] = [];
  for (const url of pickedImageUrls) {
    try {
      const hosted = await uploadRemoteImageToUploadThing(url);
      hostedImageUrls.push(hosted);
    } catch (e) {
      console.error("Image upload failed for", url, e);
    }
  }

  const [recipe] = await db
    .insert(recipes)
    .values({
      userId: user.id,
      title: data.title,
      imageUrl: hostedImageUrls[0] ?? null,
      prepTime: data.prepTime ?? null,
      cookTime: data.cookTime ?? null,
      totalTime:
        data.totalTime ??
        (data.prepTime && data.cookTime ? data.prepTime + data.cookTime : null),
      servings: data.servings ?? null,
      cuisine: typeof data.cuisine === "string" ? data.cuisine : null,
      category: typeof data.category === "string" ? data.category : null,
      calories: data.calories ?? null,
      protein: data.protein ?? null,
      carbs: data.carbs ?? null,
      fat: data.fat ?? null,
      notes: data.notes ?? null,
      source: data.source ?? null,
    })
    .returning();

  // Images table
  if (hostedImageUrls.length > 0) {
    await db.insert(recipeImages).values(
      hostedImageUrls.slice(0, 3).map((imageUrl, index) => ({
        recipeId: recipe.id,
        imageUrl,
        order: index,
      })),
    );
  }

  // Ingredients (parse amount so UI can bold quantities)
  const ingredientLines = (data.ingredients ?? [])
    .map((s) => s.trim())
    .filter(Boolean);
  if (ingredientLines.length > 0) {
    await db.insert(recipeIngredients).values(
      ingredientLines.map((line, index) => {
        const { amount, ingredient } = parseIngredient(line);
        return {
          recipeId: recipe.id,
          amount: amount || null,
          ingredient,
          order: index + 1,
        };
      }),
    );
  }

  // Instructions
  const instructionLines = (data.instructions ?? [])
    .map((s) => s.trim())
    .filter(Boolean);
  if (instructionLines.length > 0) {
    await db.insert(recipeInstructions).values(
      instructionLines.map((stepText, index) => ({
        recipeId: recipe.id,
        step: stepText,
        order: index + 1,
      })),
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/recipes");
  redirect(`/dashboard/recipes/${recipe.id}`);
}
