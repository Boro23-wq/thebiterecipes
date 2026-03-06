"use client";

import { useState, useTransition, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  parseRecipeUrl,
  importRecipe,
} from "@/app/dashboard/recipes/import/actions";
import {
  parseSocialMediaUrl,
  parseManualText,
  parseScreenshots,
} from "@/app/dashboard/recipes/import/social-actions";
import {
  Loader2,
  Link as LinkIcon,
  CheckCircle,
  Sparkles,
  ClipboardPaste,
  Camera,
  X,
} from "lucide-react";
import { RecipePreview } from "./recipe-preview";
import { detectPlatform, type PlatformInfo } from "@/lib/platform-detector";

interface ParsedRecipe {
  title: string;
  imageUrl?: string;
  prepTime?: number;
  cookTime?: number;
  totalTime?: number;
  servings?: number;
  ingredients: string[];
  instructions: string[];
  cuisine?: string;
  category?: string;
  calories?: number;
  source?: string;
}

const PLATFORM_LABELS: Record<string, string> = {
  youtube: "🎬 YouTube",
  tiktok: "🎵 TikTok",
  instagram: "📸 Instagram",
  pinterest: "📌 Pinterest",
  recipe_site: "🍳 Recipe Site",
};

export function ImportRecipeForm() {
  const [url, setUrl] = useState("");
  const [parsedRecipe, setParsedRecipe] = useState<ParsedRecipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, startParsingTransition] = useTransition();
  const [isImporting, startImportingTransition] = useTransition();
  const [showManualPaste, setShowManualPaste] = useState(false);
  const [manualText, setManualText] = useState("");
  const [screenshots, setScreenshots] = useState<File[]>([]);

  // Detect platform as user types
  const platformInfo: PlatformInfo | null = useMemo(() => {
    if (!url.trim()) return null;
    try {
      new URL(url.trim());
      return detectPlatform(url.trim());
    } catch {
      return null;
    }
  }, [url]);

  const handleParse = () => {
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    setError(null);
    setParsedRecipe(null);
    setShowManualPaste(false);

    startParsingTransition(async () => {
      try {
        if (!platformInfo) {
          setError("Please enter a valid URL");
          return;
        }

        let recipe: ParsedRecipe | null = null;

        if (platformInfo.platform === "recipe_site") {
          recipe = await parseRecipeUrl(url);
        } else if (platformInfo.supportsAI) {
          recipe = await parseSocialMediaUrl(url);
        }

        if (!recipe) {
          if (
            platformInfo.platform === "instagram" ||
            platformInfo.platform === "pinterest"
          ) {
            setError(
              `${platformInfo.label} doesn't allow direct extraction. Upload a screenshot or paste the recipe text below.`,
            );
            setShowManualPaste(true);
          } else if (platformInfo.supportsAI) {
            setError(
              "This video doesn't have captions and the description doesn't contain a recipe. Upload a screenshot or paste the recipe text below.",
            );
            setShowManualPaste(true);
          } else {
            setError(
              "Could not extract recipe from this URL. The site might not support automatic import.",
            );
          }
          return;
        }

        setParsedRecipe(recipe);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch recipe. Please check the URL and try again.",
        );
      }
    });
  };

  const handleManualParse = () => {
    if (!manualText.trim()) {
      setError("Please paste some recipe text");
      return;
    }

    setError(null);
    setParsedRecipe(null);

    startParsingTransition(async () => {
      try {
        const recipe = await parseManualText(manualText, url || undefined);

        if (!recipe) {
          setError(
            "Couldn't find a recipe in that text. Try pasting the full caption with ingredients and steps.",
          );
          return;
        }

        setParsedRecipe(recipe);
        setShowManualPaste(false);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to parse recipe text. Please try again.",
        );
      }
    });
  };

  const handleScreenshotParse = () => {
    if (screenshots.length === 0) return;

    setError(null);
    setParsedRecipe(null);

    startParsingTransition(async () => {
      try {
        // Convert files to base64
        const images = await Promise.all(
          screenshots.map(
            (file) =>
              new Promise<{ base64: string; mimeType: string }>(
                (resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => {
                    const result = reader.result as string;
                    // Remove the data:image/...;base64, prefix
                    const base64 = result.split(",")[1];
                    resolve({ base64, mimeType: file.type });
                  };
                  reader.onerror = () =>
                    reject(new Error("Failed to read file"));
                  reader.readAsDataURL(file);
                },
              ),
          ),
        );

        const recipe = await parseScreenshots(images, url || undefined);

        if (!recipe) {
          setError(
            "Couldn't find a recipe in those screenshots. Try uploading clearer images that show the full recipe.",
          );
          return;
        }

        setParsedRecipe(recipe);
        setShowManualPaste(false);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to parse screenshots. Please try again.",
        );
      }
    });
  };

  const handleImport = () => {
    if (!parsedRecipe) return;

    startImportingTransition(async () => {
      await importRecipe(parsedRecipe);
    });
  };

  const handleReset = () => {
    setParsedRecipe(null);
    setUrl("");
    setError(null);
    setShowManualPaste(false);
    setManualText("");
    setScreenshots([]);
  };

  return (
    <div className="space-y-6">
      {/* URL Input */}
      <div className="bg-white rounded-sm border border-border-light p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url" className="text-sm font-medium">
              Recipe URL
            </Label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <Input
                  id="url"
                  type="url"
                  placeholder="Paste a recipe URL, YouTube video, TikTok, etc."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleParse()}
                  className="pl-10 border-border-light focus:border-brand focus:ring-brand"
                  disabled={isParsing || isImporting}
                />
              </div>
              <Button
                onClick={handleParse}
                disabled={isParsing || isImporting || !url.trim()}
                variant="brand"
                className="cursor-pointer w-full sm:w-auto sm:shrink-0"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {platformInfo?.supportsAI
                      ? "Extracting with AI..."
                      : "Parsing..."}
                  </>
                ) : (
                  "Extract Recipe"
                )}
              </Button>
            </div>

            {/* Platform indicator */}
            {platformInfo && url.trim() && !parsedRecipe && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-secondary">
                  {PLATFORM_LABELS[platformInfo.platform] || "Website"} detected
                </span>
                {platformInfo.supportsAI && (
                  <span className="inline-flex items-center gap-1 rounded-sm bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand">
                    <Sparkles className="h-3 w-3" />
                    AI-powered
                  </span>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-sm text-sm">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Fallback options: Screenshot upload + Manual paste */}
      {showManualPaste && (
        <div className="bg-white rounded-sm border border-border-light p-6 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-text-primary">
              Try another way
            </span>
            <button
              onClick={() => {
                setShowManualPaste(false);
                setScreenshots([]);
                setManualText("");
              }}
              className="p-1 hover:bg-neutral-100 rounded-sm"
            >
              <X className="h-4 w-4 text-text-muted" />
            </button>
          </div>

          {/* Screenshot upload */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-brand" />
              <span className="text-sm font-medium text-text-primary">
                Upload screenshots
              </span>
            </div>
            <p className="text-xs text-text-secondary">
              Take a screenshot of the recipe post and upload it. Bite will use
              AI to read the text from the image. You can upload multiple
              screenshots if the recipe is split across images.
            </p>

            <div className="flex flex-wrap gap-2">
              {screenshots.map((file, i) => (
                <div
                  key={i}
                  className="relative group h-20 w-20 rounded-sm border border-border-light overflow-hidden"
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Screenshot ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <button
                    onClick={() =>
                      setScreenshots((prev) => prev.filter((_, j) => j !== i))
                    }
                    className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3 text-white" />
                  </button>
                </div>
              ))}

              {screenshots.length < 5 && (
                <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-sm border-2 border-dashed border-border-light hover:border-brand hover:bg-brand-50 transition-colors">
                  <Camera className="h-5 w-5 text-text-muted" />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={isParsing}
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setScreenshots((prev) => [...prev, ...files].slice(0, 5));
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
            </div>

            {screenshots.length > 0 && (
              <Button
                onClick={handleScreenshotParse}
                disabled={isParsing}
                variant="brand"
                className="cursor-pointer"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Reading screenshots...
                  </>
                ) : (
                  <>Extract from Screenshots</>
                )}
              </Button>
            )}
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-light" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-text-muted">or</span>
            </div>
          </div>

          {/* Manual text paste */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ClipboardPaste className="h-4 w-4 text-brand" />
              <span className="text-sm font-medium text-text-primary">
                Paste recipe text
              </span>
            </div>
            <p className="text-xs text-text-secondary">
              Copy the recipe from the post caption, comments, or description
              and paste it below.
            </p>

            <Textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder={
                "Paste the recipe text here...\n\nExample:\nCreamy Garlic Pasta\n\n1 lb spaghetti\n4 cloves garlic\n1 cup heavy cream\n...\n\nBoil pasta. Sauté garlic. Add cream..."
              }
              rows={8}
              className="resize-none border-border-light focus:border-brand focus:ring-brand"
              disabled={isParsing}
            />

            <Button
              onClick={handleManualParse}
              disabled={isParsing || !manualText.trim()}
              variant="brand"
              className="cursor-pointer"
            >
              {isParsing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Parsing with AI...
                </>
              ) : (
                <>Extract Recipe</>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Preview */}
      {parsedRecipe && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-brand">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-semibold">
              Recipe extracted successfully!
            </span>
          </div>

          <RecipePreview recipe={parsedRecipe} />

          <div className="flex gap-3">
            <Button
              onClick={handleImport}
              disabled={isImporting}
              variant="brand"
              size="lg"
              className="cursor-pointer"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                "Import Recipe"
              )}
            </Button>
            <Button
              onClick={handleReset}
              disabled={isImporting}
              variant="outline"
              size="lg"
              className="cursor-pointer"
            >
              Try Another URL
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
