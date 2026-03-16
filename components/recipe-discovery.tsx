"use client";

import { useState, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  ArrowRight,
  Loader2,
  Clock,
  Users,
  Flame,
  BookmarkPlus,
  Check,
  ImageIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { importRecipeFromDiscovery } from "@/app/dashboard/actions";
import { RecipeCard } from "@/components/recipe-card";
import Image from "next/image";
import { useRouter } from "next/navigation";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DiscoveryRecipe {
  id?: string;
  title: string;
  description?: string;
  cookTime?: number;
  prepTime?: number;
  totalTime?: number;
  servings?: number;
  cuisine?: string;
  category?: string;
  calories?: number;
  protein?: number;
  imageUrl?: string;
  ingredients: Array<string | { amount?: string; name: string }>;
  instructions: string[];
  source: "saved" | "seed" | "ai";
}

// ─── Suggested prompts ───────────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  "Quick pasta dinner",
  "High protein meal prep",
  "Something spicy",
  "Healthy under 30 min",
  "Comfort food",
  "Surprise me",
];

const LOADING_MESSAGES = [
  "Raiding the recipe vault...",
  "Tasting ideas in my head...",
  "Consulting the kitchen gods...",
  "Checking what's cooking...",
  "Almost ready to plate...",
];

// ─── Loading messages component ──────────────────────────────────────────────

function LoadingMessages() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={index}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
        className="text-sm text-text-muted"
      >
        {LOADING_MESSAGES[index]}
      </motion.p>
    </AnimatePresence>
  );
}

// ─── Source badge ────────────────────────────────────────────────────────────

function SourceBadge({ source }: { source: DiscoveryRecipe["source"] }) {
  const config = {
    saved: { label: "Your recipe", className: "bg-brand-100 text-brand" },
    seed: { label: "Starter", className: "bg-emerald-100 text-emerald-700" },
    ai: { label: "AI generated", className: "bg-violet-100 text-violet-700" },
  };

  const { label, className } = config[source];

  return (
    <span
      className={cn(
        "inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-sm",
        className,
      )}
    >
      {source === "ai" && <Sparkles className="h-2.5 w-2.5 mr-0.5" />}
      {label}
    </span>
  );
}

// ─── Unsaved recipe card (AI/seed) ───────────────────────────────────────────

function UnsavedRecipeCard({
  recipe,
  index,
  onSave,
  isSaving,
  isSaved,
  savedId,
}: {
  recipe: DiscoveryRecipe;
  index: number;
  onSave: () => void;
  isSaving: boolean;
  isSaved: boolean;
  savedId?: string;
}) {
  const router = useRouter();

  const handleCardClick = () => {
    if (isSaved && savedId) {
      router.push(`/dashboard/recipes/${savedId}`);
    }
  };

  const displayTime =
    recipe.totalTime ||
    (recipe.prepTime && recipe.cookTime
      ? recipe.prepTime + recipe.cookTime
      : recipe.prepTime || recipe.cookTime);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      onClick={handleCardClick}
      className={cn(
        "group relative overflow-hidden rounded-sm border border-border-brand-light hover:border-brand-200 hover:shadow-xs transition-all h-full",
        isSaved && savedId && "cursor-pointer",
      )}
    >
      <div className="relative h-56 w-full bg-brand-50 flex items-center justify-center overflow-hidden">
        {recipe.imageUrl ? (
          <Image
            src={recipe.imageUrl}
            alt={recipe.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 20vw"
            unoptimized
          />
        ) : (
          <ImageIcon className="h-10 w-10 text-brand/20 absolute top-[25%]" />
        )}

        {/* Top overlays */}
        <div className="absolute top-2 left-2 right-2 flex items-start gap-2 z-10">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="backdrop-blur-sm bg-white/90 text-text-primary text-[10px] font-semibold px-2 py-0.5 rounded-sm uppercase tracking-wide truncate max-w-[50%]">
              {recipe.category || "RECIPE"}
            </span>
            <SourceBadge source={recipe.source} />
          </div>
        </div>

        {/* Gradient */}
        <div
          className={
            recipe.imageUrl
              ? "absolute inset-x-0 bottom-0 h-[80%] z-1 [background:linear-gradient(to_top,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.82)_20%,rgba(0,0,0,0.65)_40%,rgba(0,0,0,0.35)_60%,rgba(0,0,0,0.15)_80%,transparent_100%)]"
              : "absolute inset-x-0 bottom-0 h-[80%] z-1 bg-linear-to-t from-white via-white/80 to-transparent"
          }
        />

        {/* Content */}
        <div className="absolute inset-x-0 bottom-0 p-3 z-2">
          <div className="space-y-2">
            <div>
              <h3
                className={`text-sm font-semibold leading-snug line-clamp-2 ${recipe.imageUrl ? "text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]" : "text-text-primary"}`}
              >
                {recipe.title}
              </h3>
              <p
                className={`text-[11px] mt-0.5 truncate ${recipe.imageUrl ? "text-white/80" : "text-text-muted"}`}
              >
                {recipe.cuisine
                  ? recipe.cuisine.charAt(0).toUpperCase() +
                    recipe.cuisine.slice(1)
                  : "AI suggested"}
              </p>
            </div>

            {/* Stats row */}
            <div
              className={`flex items-center justify-between pt-1.5 border-t ${recipe.imageUrl ? "border-white/15" : "border-brand-100"}`}
            >
              <div
                className={`flex items-center gap-2.5 text-[10px] ${recipe.imageUrl ? "text-white/70" : "text-text-secondary"}`}
              >
                {" "}
                {!!displayTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {displayTime}m
                  </span>
                )}
                {!!recipe.servings && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {recipe.servings}
                  </span>
                )}
                {!!recipe.calories && (
                  <span className="flex items-center gap-1">
                    <Flame className="h-3 w-3" />
                    {recipe.calories}
                  </span>
                )}
              </div>

              {/* Save button */}
              {isSaved ? (
                <span className="flex items-center gap-1 text-[10px] font-medium text-green-600 px-2 py-0.5 bg-green-50 rounded-sm">
                  <Check className="h-3 w-3" />
                  Saved
                </span>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSave();
                  }}
                  disabled={isSaving}
                  className="flex items-center gap-1 text-[10px] font-medium text-brand px-2 py-0.5 bg-brand-100 hover:bg-brand-200 rounded-sm transition cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <BookmarkPlus className="h-3 w-3" />
                  )}
                  Save
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function RecipeDiscovery() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<DiscoveryRecipe[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [usePantry, setUsePantry] = useState(false);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [savedIndices, setSavedIndices] = useState<Set<number>>(new Set());
  const [savedIds, setSavedIds] = useState<Map<number, string>>(new Map());

  const handleSearch = useCallback(
    async (searchQuery?: string) => {
      const q = (searchQuery ?? query).trim();
      if (!q) return;

      setIsLoading(true);
      setHasSearched(true);
      setResults([]);
      setSavedIndices(new Set());
      setSavedIds(new Map());

      try {
        const response = await fetch("/api/discover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: q, usePantry }),
        });

        if (!response.ok) throw new Error("Failed to discover recipes");

        const { recipes } = await response.json();
        setResults(recipes ?? []);
      } catch (error) {
        toast.error("Something went wrong — try again");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    [query, usePantry],
  );

  const handleChipClick = useCallback(
    (prompt: string) => {
      setQuery(prompt);
      handleSearch(prompt);
    },
    [handleSearch],
  );

  const handleSaveRecipe = useCallback(
    async (recipe: DiscoveryRecipe, index: number) => {
      setSavingIndex(index);
      try {
        const { id } = await importRecipeFromDiscovery({
          title: recipe.title,
          description: recipe.description,
          servings: recipe.servings,
          prepTime: recipe.prepTime,
          cookTime: recipe.cookTime,
          cuisine: recipe.cuisine,
          category: recipe.category,
          calories: recipe.calories,
          protein: recipe.protein,
          imageUrl: recipe.imageUrl,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
        });

        setSavedIndices((prev) => new Set(prev).add(index));
        setSavedIds((prev) => new Map(prev).set(index, id));
        toast.success(`Saved "${recipe.title}" to your recipes`);
      } catch (error) {
        toast.error("Failed to save recipe");
        console.error(error);
      } finally {
        setSavingIndex(null);
      }
    },
    [],
  );

  return (
    <div className="space-y-4">
      {/* ─── Gradient Banner ─── */}
      <div className="relative overflow-hidden rounded-sm bg-linear-to-br from-brand-200 via-brand-100 to-brand-50 p-6 pb-5">
        {/* Decorative circles */}
        <div className="absolute -top-5 -right-5 w-28 h-28 rounded-full bg-brand/5" />
        <div className="absolute -bottom-8 left-[40%] w-20 h-20 rounded-full bg-brand/3" />
        <div className="absolute top-1/2 -left-4 w-16 h-16 rounded-full bg-brand/3" />

        {/* Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-brand" />
            <h2 className="text-base font-semibold text-text-primary">
              What should I cook?
            </h2>
          </div>
          <p className="text-xs text-text-secondary mb-4">
            Describe a craving — we&apos;ll find or create recipes for you
          </p>

          {/* Input */}
          <div className="relative mb-3">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              placeholder="Something spicy with chicken..."
              className="pr-10 h-10 text-sm bg-white border-0 rounded-sm shadow-sm placeholder:text-text-muted"
              disabled={isLoading}
            />
            <button
              onClick={() => handleSearch()}
              disabled={!query.trim() || isLoading}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-sm bg-brand hover:bg-brand-600 transition cursor-pointer disabled:opacity-30"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
              ) : (
                <ArrowRight className="h-3.5 w-3.5 text-white" />
              )}
            </button>
          </div>

          {/* Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setUsePantry(!usePantry)}
              className={cn(
                "text-[11px] font-medium px-2.5 py-1 rounded-sm transition cursor-pointer",
                usePantry
                  ? "bg-white text-brand"
                  : "bg-white/70 text-text-secondary border border-border-light hover:bg-white/35",
              )}
            >
              {usePantry ? "✓ " : ""}Use my pantry
            </button>

            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleChipClick(prompt)}
                disabled={isLoading}
                className="text-[11px] px-2.5 py-1 rounded-sm bg-white/70 text-text-secondary border border-border-light hover:border-brand/30 hover:text-brandtransition cursor-pointer disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Results area ─── */}
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-14 gap-4"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="relative z-10"
            >
              <Sparkles className="h-8 w-8 text-brand" />
            </motion.div>
            <div className="relative z-10">
              <LoadingMessages />
            </div>
          </motion.div>
        )}

        {!isLoading && hasSearched && results.length === 0 && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-10"
          >
            <p className="text-sm text-text-muted">
              No recipes found — try a different search
            </p>
          </motion.div>
        )}

        {!isLoading && results.length > 0 && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory -mr-6 md:mx-0 md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {results.map((recipe, index) =>
                recipe.source === "saved" && recipe.id ? (
                  <div
                    key={`${recipe.title}-${index}`}
                    className="min-w-65 snap-start md:min-w-0 self-stretch"
                  >
                    <RecipeCard
                      id={recipe.id}
                      title={recipe.title}
                      imageUrl={recipe.imageUrl}
                      prepTime={recipe.prepTime}
                      cookTime={recipe.cookTime}
                      totalTime={recipe.totalTime}
                      servings={recipe.servings}
                      cuisine={recipe.cuisine}
                      category={recipe.category}
                      calories={recipe.calories}
                    />
                  </div>
                ) : (
                  <div
                    key={`${recipe.title}-${index}`}
                    className="min-w-65 snap-start md:min-w-0 self-stretch"
                  >
                    <UnsavedRecipeCard
                      recipe={recipe}
                      index={index}
                      onSave={() => handleSaveRecipe(recipe, index)}
                      isSaving={savingIndex === index}
                      isSaved={savedIndices.has(index)}
                      savedId={savedIds.get(index)}
                    />
                  </div>
                ),
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
