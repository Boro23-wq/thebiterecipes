"use client";

import { cn } from "@/lib/utils";
import { text, spacing } from "@/lib/design-tokens";
import { usePreferences } from "@/lib/preferences-context";
import { convertAmount } from "@/lib/convert-units";

interface Ingredient {
  id: number;
  ingredient: string;
  amount?: string | null;
  group?: string | null;
  order: number;
}

interface IngredientsListProps {
  ingredients: Ingredient[];
  baseServings: number;
  currentServings: number;
  onServingsChange: (servings: number) => void;
}

export function IngredientsList({
  ingredients,
  baseServings,
  currentServings,
  onServingsChange,
}: IngredientsListProps) {
  const { measurementUnit } = usePreferences();
  const multiplier = currentServings / baseServings;

  const scaleIngredient = (ingredient: string): string => {
    const pattern = /^(\d+(?:\/\d+)?|\d+\.\d+)\s+/;
    const match = ingredient.match(pattern);

    if (!match) return ingredient;

    const numStr = match[1];
    let num: number;

    if (numStr.includes("/")) {
      const [numerator, denominator] = numStr.split("/").map(Number);
      num = numerator / denominator;
    } else {
      num = parseFloat(numStr);
    }

    const scaled = num * multiplier;

    let scaledStr: string;
    if (scaled % 1 === 0) {
      scaledStr = scaled.toString();
    } else if (scaled < 1) {
      if (scaled === 0.5) scaledStr = "1/2";
      else if (scaled === 0.25) scaledStr = "1/4";
      else if (scaled === 0.75) scaledStr = "3/4";
      else if (scaled === 0.33 || scaled === 0.333) scaledStr = "1/3";
      else if (scaled === 0.67 || scaled === 0.666) scaledStr = "2/3";
      else scaledStr = scaled.toFixed(2).replace(/\.?0+$/, "");
    } else {
      scaledStr = scaled.toFixed(2).replace(/\.?0+$/, "");
    }

    return ingredient.replace(match[0], `${scaledStr} `);
  };

  const scaleAmount = (amount: string): string => {
    const parts = amount.trim().split(/\s+/);
    if (parts.length === 0) return amount;

    const parseSimple = (s: string) => {
      if (s.includes("/")) {
        const [n, d] = s.split("/").map(Number);
        if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) return null;
        return n / d;
      }
      const v = Number.parseFloat(s);
      return Number.isFinite(v) ? v : null;
    };

    const first = parseSimple(parts[0]);
    if (first == null) return amount;

    let base = first;
    let restStartIndex = 1;

    if (parts[1] && parts[1].includes("/")) {
      const second = parseSimple(parts[1]);
      if (second != null) {
        base = base + second;
        restStartIndex = 2;
      }
    }

    const scaled = base * multiplier;

    const toNice = (x: number) => {
      const tol = 0.02;
      const fracs: Array<[number, string]> = [
        [0.25, "1/4"],
        [1 / 3, "1/3"],
        [0.5, "1/2"],
        [2 / 3, "2/3"],
        [0.75, "3/4"],
      ];

      const whole = Math.floor(x + 1e-10);
      const frac = x - whole;

      for (const [v, label] of fracs) {
        if (Math.abs(frac - v) < tol) {
          if (whole === 0) return label;
          return `${whole} ${label}`;
        }
      }

      if (Math.abs(frac) < tol) return `${Math.round(x)}`;
      return x.toFixed(2).replace(/\.?0+$/, "");
    };

    const scaledStr = toNice(scaled);
    const rest = parts.slice(restStartIndex).join(" ");
    return rest ? `${scaledStr} ${rest}` : scaledStr;
  };

  /** Scale first, then convert units if needed */
  const displayAmount = (amount: string, ingredientName?: string): string => {
    const scaled = scaleAmount(amount);
    return convertAmount(
      scaled,
      measurementUnit as "imperial" | "metric",
      ingredientName,
    );
  };

  // Group ingredients by their group field
  const groupedIngredients: { group: string | null; items: Ingredient[] }[] =
    [];
  let currentGroup: string | null = null;

  for (const ing of ingredients) {
    if (ing.group !== currentGroup) {
      currentGroup = ing.group ?? null;
      groupedIngredients.push({ group: currentGroup, items: [] });
    }
    if (groupedIngredients.length === 0) {
      groupedIngredients.push({ group: null, items: [] });
    }
    groupedIngredients[groupedIngredients.length - 1].items.push(ing);
  }

  return (
    <div>
      {/* Serving Controls */}
      <div className="flex items-center justify-between mb-6">
        <h3 className={cn(text.h2, "flex items-center gap-2")}>
          <span className="w-1 h-6 bg-brand" />
          Ingredients
        </h3>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onServingsChange(Math.max(1, currentServings - 1))}
            className="w-8 h-8 flex items-center justify-center rounded-sm bg-brand-100 text-brand hover:bg-brand-200 transition-colors active:scale-90 cursor-pointer text-lg font-medium"
          >
            −
          </button>
          <span className="text-sm font-semibold text-text-primary w-16 text-center tabular-nums">
            {currentServings} {currentServings === 1 ? "srv" : "srvs"}
          </span>
          <button
            onClick={() => onServingsChange(currentServings + 1)}
            className="w-8 h-8 flex items-center justify-center rounded-sm bg-brand-100 text-brand hover:bg-brand-200 transition-colors active:scale-90 cursor-pointer text-lg font-medium"
          >
            +
          </button>
        </div>
      </div>

      {/* Servings indicator */}
      <p className="text-sm text-text-muted mb-4">
        Original: {baseServings} {baseServings === 1 ? "serving" : "servings"}
        {currentServings !== baseServings && (
          <span className="text-brand font-medium">
            {" "}
            · Scaled {multiplier % 1 === 0 ? multiplier : multiplier.toFixed(1)}
            x
          </span>
        )}
        {measurementUnit === "metric" && (
          <span className="text-text-muted"> · Metric</span>
        )}
      </p>

      {/* Ingredients list with groups */}
      <div className={spacing.card}>
        {groupedIngredients.map((section, sIdx) => (
          <div key={sIdx}>
            {/* Group header */}
            {section.group && (
              <div className="mt-4 first:mt-0 mb-2 px-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand">
                  {section.group}
                </span>
              </div>
            )}

            {/* Items */}
            <ul className="space-y-1">
              {section.items.map((ing, index) => (
                <li
                  key={ing.id}
                  className="flex items-start gap-3 p-2 hover:bg-brand-100 rounded-sm transition-colors wrap-break-word"
                >
                  <span className="shrink-0 w-6 h-6 rounded-sm bg-brand-100 text-brand flex items-center justify-center text-xs font-medium">
                    {ing.order}
                  </span>
                  <div className="flex-1">
                    {ing.amount ? (
                      <span className={cn(text.body)}>
                        <span className="font-semibold text-text-primary">
                          {displayAmount(ing.amount, ing.ingredient)}{" "}
                        </span>
                        {ing.ingredient}
                      </span>
                    ) : (
                      <span className={cn(text.body)}>
                        {scaleIngredient(ing.ingredient)}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
