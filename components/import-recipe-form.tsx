"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  parseRecipeUrl,
  importRecipe,
} from "@/app/dashboard/recipes/import/actions";
import { Loader2, Link as LinkIcon, CheckCircle } from "lucide-react";
import { RecipePreview } from "./recipe-preview";

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

export function ImportRecipeForm() {
  const [url, setUrl] = useState("");
  const [parsedRecipe, setParsedRecipe] = useState<ParsedRecipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, startParsingTransition] = useTransition();
  const [isImporting, startImportingTransition] = useTransition();

  const handleParse = () => {
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    setError(null);
    setParsedRecipe(null);

    startParsingTransition(async () => {
      try {
        const recipe = await parseRecipeUrl(url);

        if (!recipe) {
          setError(
            "Could not extract recipe from this URL. The site might not support automatic import.",
          );
          return;
        }

        setParsedRecipe(recipe);
      } catch (err) {
        setError("Failed to fetch recipe. Please check the URL and try again.");
      }
    });
  };

  const handleImport = () => {
    if (!parsedRecipe) return;

    startImportingTransition(async () => {
      await importRecipe(parsedRecipe);
    });
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
            <div className="flex gap-3">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <Input
                  id="url"
                  type="url"
                  placeholder="https://www.allrecipes.com/recipe/..."
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
                className="cursor-pointer shrink-0"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Parsing...
                  </>
                ) : (
                  "Extract Recipe"
                )}
              </Button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-sm text-sm">
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
              onClick={() => {
                setParsedRecipe(null);
                setUrl("");
              }}
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
