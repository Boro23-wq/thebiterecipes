"use client";

import { useState, useTransition, useMemo } from "react";
import { useSearchParams } from "next/navigation";
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
  Info,
  X,
  Wand2,
} from "lucide-react";
import { RecipePreview } from "./recipe-preview";
import { detectPlatform, type PlatformInfo } from "@/lib/platform-detector";
import { toast } from "sonner";
import Image from "next/image";

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

type ImportMode = "url" | "screenshot" | "text";

export function ImportRecipeForm() {
  const searchParams = useSearchParams();

  const [url, setUrl] = useState(searchParams.get("url") || "");
  const [manualText, setManualText] = useState(searchParams.get("text") || "");
  const [mode, setMode] = useState<ImportMode>(
    searchParams.get("text")
      ? "text"
      : searchParams.get("hasImages")
        ? "screenshot"
        : "url",
  );
  const [parsedRecipe, setParsedRecipe] = useState<ParsedRecipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, startParsingTransition] = useTransition();
  const [isImporting, startImportingTransition] = useTransition();
  const [screenshots, setScreenshots] = useState<File[]>([]);

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

    startParsingTransition(async () => {
      try {
        if (!platformInfo) {
          setError("Please enter a valid URL");
          return;
        }
        if (
          platformInfo.platform === "instagram" ||
          platformInfo.platform === "pinterest"
        ) {
          setError(
            `${PLATFORM_LABELS[platformInfo.platform]} doesn't support direct extraction. Use screenshot or paste instead.`,
          );
          setMode("screenshot");
          return;
        }

        let recipe: ParsedRecipe | null = null;
        if (platformInfo.platform === "recipe_site") {
          recipe = await parseRecipeUrl(url);
        } else if (platformInfo.supportsAI) {
          recipe = await parseSocialMediaUrl(url);
        }

        if (!recipe) {
          if (platformInfo.supportsAI) {
            setError(
              "Couldn't extract from this video. Try screenshot or paste instead.",
            );
            setMode("screenshot");
          } else {
            setError("Could not extract recipe from this URL.");
          }
          return;
        }
        setParsedRecipe(recipe);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch recipe.",
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
            "Couldn't find a recipe in that text. Try the full caption.",
          );
          return;
        }
        setParsedRecipe(recipe);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to parse recipe text.",
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
        const images = await Promise.all(
          screenshots.map(
            (file) =>
              new Promise<{ base64: string; mimeType: string }>(
                (resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => {
                    const result = reader.result as string;
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
          setError("Couldn't find a recipe in those screenshots.");
          return;
        }
        setParsedRecipe(recipe);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to parse screenshots.",
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
    setManualText("");
    setScreenshots([]);
    setMode("url");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 5 - screenshots.length;

    if (files.length > remaining) {
      toast.error(
        `You can only upload up to 5 screenshots. ${remaining === 0 ? "Limit reached." : `${remaining} more allowed.`}`,
      );
    }

    const allowed = files.slice(0, remaining);
    if (allowed.length > 0) {
      setScreenshots((prev) => [...prev, ...allowed]);
    }
    e.target.value = "";
  };

  const modes: { key: ImportMode; label: string; icon: React.ReactNode }[] = [
    { key: "url", label: "URL", icon: <LinkIcon className="h-3.5 w-3.5" /> },
    {
      key: "screenshot",
      label: "Screenshot",
      icon: <Camera className="h-3.5 w-3.5" />,
    },
    {
      key: "text",
      label: "Paste Text",
      icon: <ClipboardPaste className="h-3.5 w-3.5" />,
    },
  ];

  return (
    <div className="space-y-0">
      {/* Unified card */}
      <div className="rounded-sm bg-white shadow-brand-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 pb-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-sm bg-brand-100 p-2 text-brand">
              <Wand2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-text-primary">
                Import Recipe
              </div>
              <div className="text-xs text-text-secondary">
                Paste a URL, upload screenshots, or paste recipe text
              </div>
            </div>
          </div>
        </div>

        {/* Mode tabs */}
        <div className="flex px-6 border-b border-border-light">
          {modes.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => {
                setMode(key);
                setError(null);
              }}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer -mb-px ${
                mode === key
                  ? "text-brand border-b-2 border-brand"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        <div className="px-6 pt-4!">
          {/* URL mode */}
          {mode === "url" && (
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

                {platformInfo && url.trim() && !parsedRecipe && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-secondary">
                      {PLATFORM_LABELS[platformInfo.platform] || "Website"}{" "}
                      detected
                    </span>
                    {platformInfo.supportsAI && (
                      <span className="inline-flex items-center gap-1 rounded-sm bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand">
                        <Sparkles className="h-3 w-3" />
                        AI-powered
                      </span>
                    )}
                    {(platformInfo.platform === "instagram" ||
                      platformInfo.platform === "pinterest") && (
                      <span className="inline-flex items-center gap-1 rounded-sm bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-medium text-amber-700">
                        <Info className="h-3 w-3" />
                        Use screenshot or paste
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Screenshot mode */}
          {mode === "screenshot" && (
            <div className="space-y-4">
              <p className="text-xs text-text-secondary">
                Upload up to 5 screenshots of a recipe. Bite uses AI to extract
                ingredients and instructions from the images.
              </p>

              <div className="flex flex-wrap gap-3">
                {screenshots.map((file, i) => (
                  <div
                    key={i}
                    className="relative group h-24 w-24 rounded-sm overflow-hidden bg-brand-50 shadow-xs"
                  >
                    <Image
                      src={URL.createObjectURL(file)}
                      alt={`Screenshot ${i + 1}`}
                      className="h-full w-full object-cover"
                      layout="fill"
                      objectFit="cover"
                    />
                    <Button
                      onClick={() =>
                        setScreenshots((prev) => prev.filter((_, j) => j !== i))
                      }
                      variant="destructive-light"
                      size="icon-xs"
                      className="absolute top-1 right-1 h-4.5 w-4.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
                      aria-label="Remove"
                    >
                      <X className="h-3 w-3 text-white" />
                    </Button>
                  </div>
                ))}

                {screenshots.length < 5 && (
                  <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-sm border-2 border-dashed border-brand-200 hover:border-brand hover:bg-brand-50 transition-colors">
                    <Camera className="h-5 w-5 text-brand/40" />
                    <span className="text-[10px] text-text-muted">Add</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      disabled={isParsing}
                      onChange={handleFileUpload}
                    />
                  </label>
                )}
              </div>

              {screenshots.length > 0 && (
                <div className="flex items-center gap-3">
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
                  <button
                    onClick={() => setScreenshots([])}
                    disabled={isParsing}
                    className="text-xs text-text-muted hover:text-red-500 transition-colors cursor-pointer"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Text mode */}
          {mode === "text" && (
            <div className="space-y-4">
              <p className="text-xs text-text-secondary">
                Copy the recipe from a caption, comment, or description and
                paste it below.
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
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 bg-red-50 text-red-700 px-4 py-3 rounded-sm text-sm">
              {error}
            </div>
          )}
        </div>
      </div>

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
              Try Another
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
