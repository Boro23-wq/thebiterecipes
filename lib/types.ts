import type { GeminiParsedRecipe } from "./gemini";

export interface ExtractorResult {
  recipe: GeminiParsedRecipe;
  source: string;
  imageUrl?: string;
}
