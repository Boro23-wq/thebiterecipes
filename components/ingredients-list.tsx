"use client";

import { cn } from "@/lib/utils";
import { text, spacing } from "@/lib/design-tokens";

interface Ingredient {
  id: number;
  ingredient: string;
  amount?: string | null;
  order: number;
}

interface IngredientsListProps {
  ingredients: Ingredient[];
  baseServings: number;
  multiplier: number;
  onMultiplierChange: (m: number) => void;
}

export function IngredientsList({
  ingredients,
  baseServings,
  multiplier,
  onMultiplierChange,
}: IngredientsListProps) {
  const scaleIngredient = (ingredient: string): string => {
    // Match common patterns: "1 cup", "2 tablespoons", "1/2 teaspoon", "1.5 pounds"
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
    // supports: "1", "1/2", "1.5", and mixed like "1 1/2"
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

    // mixed number: "1 1/2"
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

  return (
    <div>
      {/* Serving Multiplier */}
      <div className="flex items-center justify-between mb-6">
        <h3 className={cn(text.h2, "flex items-center gap-2")}>
          <span className="w-1 h-6 bg-brand" />
          Ingredients
        </h3>

        <div className="flex items-center gap-1 bg-brand-100 rounded-sm p-1">
          <button
            onClick={() => onMultiplierChange(0.5)}
            className={cn(
              "px-4 py-1.5 rounded-sm text-sm font-medium transition-all cursor-pointer",
              multiplier === 0.5
                ? "bg-brand text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary",
            )}
          >
            1/2x
          </button>
          <button
            onClick={() => onMultiplierChange(1)}
            className={cn(
              "px-4 py-1.5 rounded-sm text-sm font-medium transition-all cursor-pointer",
              multiplier === 1
                ? "bg-brand text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary",
            )}
          >
            1x
          </button>
          <button
            onClick={() => onMultiplierChange(2)}
            className={cn(
              "px-4 py-1.5 rounded-sm text-sm font-medium transition-all cursor-pointer",
              multiplier === 2
                ? "bg-brand text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary",
            )}
          >
            2x
          </button>
        </div>
      </div>

      {/* Servings indicator */}
      <p className="text-sm text-text-muted mb-4">
        Original recipe makes {baseServings} servings
      </p>

      {/* Ingredients list */}
      <ul className={spacing.card}>
        {ingredients.map((ing, index) => (
          <li
            key={ing.id}
            className="flex items-start gap-3 p-2 hover:bg-brand-100 rounded-sm transition-colors break-all"
          >
            <span className="shrink-0 w-6 h-6 rounded-sm bg-brand-100 text-brand flex items-center justify-center text-xs font-medium">
              {index + 1}
            </span>
            <div className="flex-1">
              {ing.amount ? (
                <div className="flex items-start gap-2">
                  <span className="shrink-0 text-sm font-semibold text-text-primary">
                    {scaleAmount(ing.amount)}
                  </span>
                  <span className={cn(text.body)}>{ing.ingredient}</span>
                </div>
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
  );
}
