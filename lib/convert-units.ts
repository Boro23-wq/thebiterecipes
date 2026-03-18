// lib/convert-units.ts
//
// Client-side imperial <-> metric conversion for ingredient amounts.
// Ingredient-aware: solids convert to grams, liquids to ml.

type UnitSystem = "imperial" | "metric";

// ============================================
// ROUNDING
// ============================================

const roundCooking = (n: number): number => {
  if (n >= 100) return Math.round(n / 5) * 5;
  if (n >= 10) return Math.round(n);
  if (n >= 1) return Math.round(n * 4) / 4;
  return Math.round(n * 10) / 10;
};

const roundWhole = (n: number): number => Math.round(n);

// ============================================
// INGREDIENT DENSITY (grams per 1 cup)
// Sources: King Arthur Baking, USDA
// ============================================

const DENSITY_MAP: [RegExp, number][] = [
  // Flours
  [/flour/i, 120],
  [/almond\s*meal/i, 96],
  [/cornmeal/i, 150],
  [/cornstarch|corn\s*starch/i, 128],
  [/cocoa/i, 85],

  // Sugars
  [/brown\s*sugar/i, 220],
  [/powdered\s*sugar|confectioner/i, 120],
  [/sugar/i, 200],
  [/honey/i, 340],
  [/maple\s*syrup/i, 315],
  [/molasses/i, 340],

  // Fats
  [/butter/i, 227],
  [/shortening|lard/i, 205],
  [/coconut\s*oil/i, 218],

  // Dairy
  [/sour\s*cream/i, 230],
  [/yogurt|yoghurt/i, 245],
  [/cream\s*cheese/i, 230],
  [/ricotta/i, 250],
  [/heavy\s*cream|whipping\s*cream/i, 240],
  [/milk/i, 245],
  [/cream/i, 240],

  // Cheese (shredded)
  [/cheese/i, 115],

  // Nuts & seeds
  [/nuts?|almonds?|walnuts?|pecans?|cashews?|peanuts?|pistachios?/i, 140],
  [/seeds?|sesame|sunflower|pumpkin|flax|chia/i, 140],
  [/peanut\s*butter/i, 260],

  // Grains & starches
  [/oats|oatmeal/i, 90],
  [/rice/i, 185],
  [/breadcrumbs?|bread\s*crumbs?/i, 115],
  [/panko/i, 60],

  // Produce
  [/berries|blueberr|raspberr|strawberr|blackberr/i, 150],
  [/raisins?|dried\s*fruit|cranberr/i, 150],
  [/banana/i, 225],
  [/applesauce/i, 245],
  [/chopped|diced|sliced/i, 150], // generic chopped produce

  // Liquids (these get ml, not grams)
  [
    /water|broth|stock|juice|vinegar|wine|beer|spirits?|bourbon|rum|vodka|soy\s*sauce|fish\s*sauce|worcestershire/i,
    -1,
  ],
  [/oil|olive\s*oil|vegetable\s*oil|canola|sesame\s*oil|avocado\s*oil/i, -1],
];

/**
 * Returns grams per cup for the ingredient, or -1 for liquids, or null if unknown.
 */
function getDensity(ingredientName: string): number | null {
  for (const [pattern, density] of DENSITY_MAP) {
    if (pattern.test(ingredientName)) return density;
  }
  return null;
}

// ============================================
// VOLUME UNIT FACTORS (to cups)
// ============================================

const VOLUME_TO_CUPS: [RegExp, number][] = [
  [/^cups?$/i, 1],
  [/^tablespoons?|tbsp$/i, 1 / 16],
  [/^teaspoons?|tsp$/i, 1 / 48],
  [/^fl[._\s]?oz$/i, 1 / 8],
  [/^quarts?|qt$/i, 4],
  [/^pints?|pt$/i, 2],
  [/^gallons?|gal$/i, 16],
];

function volumeToCups(unit: string): number | null {
  for (const [pattern, factor] of VOLUME_TO_CUPS) {
    if (pattern.test(unit)) return factor;
  }
  return null;
}

// ============================================
// WEIGHT CONVERSIONS
// ============================================

// Imperial weight -> grams
const WEIGHT_TO_GRAMS: [RegExp, number][] = [
  [/^pounds?|lbs?$/i, 454],
  [/^ounces?|oz$/i, 28],
];

// Metric weight -> imperial
const GRAMS_PER_OZ = 28.35;

// ============================================
// METRIC VOLUME CONVERSIONS
// ============================================

const ML_PER_CUP = 240;
const ML_PER_TBSP = 15;
const ML_PER_TSP = 5;

// Smart ml -> imperial unit selection
function mlToImperial(ml: number): { value: number; unit: string } {
  if (ml >= 960) return { value: roundCooking(ml / 960), unit: "qt" };
  if (ml >= 240) return { value: roundCooking(ml / 240), unit: "cup" };
  if (ml >= 15) return { value: roundCooking(ml / 15), unit: "tbsp" };
  return { value: roundCooking(ml / 5), unit: "tsp" };
}

// Smart grams -> imperial unit selection
function gramsToImperial(g: number): { value: number; unit: string } {
  if (g >= 454) return { value: roundCooking(g / 454), unit: "lb" };
  return { value: roundCooking(g / 28), unit: "oz" };
}

// ============================================
// TEMPERATURE
// ============================================

function convertTemperature(
  value: number,
  fromUnit: string,
  target: UnitSystem,
): { value: number; unit: string } | null {
  if (/°?F/i.test(fromUnit) && target === "metric") {
    return { value: Math.round((value - 32) * (5 / 9)), unit: "°C" };
  }
  if (/°?C/i.test(fromUnit) && target === "imperial") {
    return { value: Math.round(value * (9 / 5) + 32), unit: "°F" };
  }
  return null;
}

// ============================================
// UNIT CLASSIFICATION
// ============================================

const SKIP_UNITS =
  /^(pinch|dash|cloves?|pieces?|slices?|cans?|packages?|package|sticks?|bunche?s?|heads?|stalks?|sprigs?|handfuls?|large|medium|small|whole)$/i;

const IMPERIAL_VOLUME =
  /^(cups?|tablespoons?|tbsp|teaspoons?|tsp|fl[._\s]?oz|quarts?|qt|pints?|pt|gallons?|gal)$/i;
const IMPERIAL_WEIGHT = /^(ounces?|oz|pounds?|lbs?|lb)$/i;
const METRIC_VOLUME = /^(ml|milliliters?|l|liters?)$/i;
const METRIC_WEIGHT = /^(g|grams?|kg|kilograms?)$/i;
const TEMP_UNIT = /^°?[FC]$/i;

// ============================================
// PARSING
// ============================================

function parseAmount(amount: string): {
  numValue: number;
  unit: string;
  rest: string;
} | null {
  const re =
    /^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)\s*(cups?|tablespoons?|tbsp|teaspoons?|tsp|fl[._\s]?oz|ounces?|oz|pounds?|lbs?|lb|quarts?|qt|pints?|pt|gallons?|gal|ml|milliliters?|l|liters?|g|grams?|kg|kilograms?|°?[FC])\b(.*)/i;

  const m = amount.match(re);
  if (!m) return null;

  const numStr = m[1].trim();
  const unit = m[2].trim();
  const rest = (m[3] || "").trim();

  let numValue: number;
  if (numStr.includes(" ") && numStr.includes("/")) {
    const [whole, frac] = numStr.split(/\s+/);
    const [n, d] = frac.split("/").map(Number);
    numValue = Number(whole) + n / d;
  } else if (numStr.includes("/")) {
    const [n, d] = numStr.split("/").map(Number);
    numValue = n / d;
  } else {
    numValue = parseFloat(numStr);
  }

  if (!Number.isFinite(numValue)) return null;
  return { numValue, unit, rest };
}

function toNiceFraction(x: number): string {
  const tol = 0.06;
  const fracs: [number, string][] = [
    [0.125, "1/8"],
    [0.25, "1/4"],
    [1 / 3, "1/3"],
    [0.5, "1/2"],
    [2 / 3, "2/3"],
    [0.75, "3/4"],
  ];

  const whole = Math.floor(x + 0.01);
  const frac = x - whole;

  for (const [v, label] of fracs) {
    if (Math.abs(frac - v) < tol) {
      return whole > 0 ? `${whole} ${label}` : label;
    }
  }

  if (Math.abs(frac) < tol) return `${Math.round(x)}`;
  return x.toFixed(1).replace(/\.0$/, "");
}

function formatMetric(value: number, unit: string): string {
  // Auto-upgrade: ml -> l, g -> kg
  if (unit === "ml" && value >= 1000) {
    return `${roundCooking(value / 1000)} l`;
  }
  if (unit === "g" && value >= 1000) {
    return `${roundCooking(value / 1000)} kg`;
  }
  const v = value % 1 === 0 ? `${value}` : value.toFixed(1).replace(/\.0$/, "");
  return `${v} ${unit}`;
}

// ============================================
// MAIN CONVERSION FUNCTION
// ============================================

/**
 * Convert an amount string between unit systems.
 * Pass the ingredient name for smart solid/liquid detection.
 *
 * @param amount - The amount string, e.g. "1 cup", "2 tbsp", "500 g"
 * @param targetSystem - "imperial" or "metric"
 * @param ingredientName - The ingredient text (used to detect solid vs liquid)
 */
export function convertAmount(
  amount: string,
  targetSystem: UnitSystem,
  ingredientName?: string,
): string {
  if (!amount || !amount.trim()) return amount;

  const parsed = parseAmount(amount);
  if (!parsed) return amount;

  const { numValue, unit, rest } = parsed;
  const restStr = rest ? ` ${rest}` : "";

  // Skip non-convertible units
  if (SKIP_UNITS.test(unit)) return amount;

  // Temperature
  if (TEMP_UNIT.test(unit)) {
    const t = convertTemperature(numValue, unit, targetSystem);
    if (t) return `${t.value} ${t.unit}${restStr}`;
    return amount;
  }

  // =====================
  // IMPERIAL -> METRIC
  // =====================
  if (targetSystem === "metric") {
    // Imperial weight -> grams (straightforward, no ingredient check needed)
    for (const [pattern, factor] of WEIGHT_TO_GRAMS) {
      if (pattern.test(unit)) {
        const grams = roundWhole(numValue * factor);
        return `${formatMetric(grams, "g")}${restStr}`;
      }
    }

    // Imperial volume -> depends on ingredient
    if (IMPERIAL_VOLUME.test(unit)) {
      const cups = numValue * (volumeToCups(unit) ?? 0);
      if (cups === 0) return amount;

      const ingredient = ingredientName ?? rest ?? "";
      const density = getDensity(ingredient);

      if (density === -1) {
        // Liquid: convert to ml
        const ml = roundWhole(cups * ML_PER_CUP);
        return `${formatMetric(ml, "ml")}${restStr}`;
      }

      if (density !== null) {
        // Solid: convert to grams using density
        const grams = roundWhole(cups * density);
        return `${formatMetric(grams, "g")}${restStr}`;
      }

      // Unknown ingredient: check rest/ingredientName for common liquid words
      // Default to grams with a generic density of 130g/cup (better than ml for solids)
      if (
        /water|milk|cream|broth|stock|juice|oil|vinegar|wine|sauce/i.test(
          ingredient,
        )
      ) {
        const ml = roundWhole(cups * ML_PER_CUP);
        return `${formatMetric(ml, "ml")}${restStr}`;
      }

      // Truly unknown — use grams with conservative estimate
      const grams = roundWhole(cups * 130);
      return `${formatMetric(grams, "g")}${restStr}`;
    }

    // Already metric
    if (METRIC_VOLUME.test(unit) || METRIC_WEIGHT.test(unit)) return amount;
  }

  // =====================
  // METRIC -> IMPERIAL
  // =====================
  if (targetSystem === "imperial") {
    // Already imperial
    if (IMPERIAL_VOLUME.test(unit) || IMPERIAL_WEIGHT.test(unit)) return amount;

    // Metric weight -> imperial
    if (/^kg|kilograms?$/i.test(unit)) {
      const lbs = roundCooking(numValue * 2.2);
      return `${toNiceFraction(lbs)} lb${restStr}`;
    }
    if (/^g|grams?$/i.test(unit)) {
      const ingredient = ingredientName ?? rest ?? "";
      const density = getDensity(ingredient);

      if (density !== null && density > 0) {
        // Convert grams back to cups using density
        const cups = numValue / density;
        if (cups >= 0.25) {
          return `${toNiceFraction(roundCooking(cups))} cup${roundCooking(cups) !== 1 ? "s" : ""}${restStr}`;
        }
        // Small amounts: use tbsp (1 cup = 16 tbsp)
        const tbsp = cups * 16;
        if (tbsp >= 1) {
          return `${toNiceFraction(roundCooking(tbsp))} tbsp${restStr}`;
        }
        const tsp = tbsp * 3;
        return `${toNiceFraction(roundCooking(tsp))} tsp${restStr}`;
      }

      // No density info: use oz
      const { value, unit: impUnit } = gramsToImperial(numValue);
      return `${toNiceFraction(value)} ${impUnit}${restStr}`;
    }

    // Metric volume -> imperial
    if (/^ml|milliliters?$/i.test(unit)) {
      const { value, unit: impUnit } = mlToImperial(numValue);
      return `${toNiceFraction(value)} ${impUnit}${restStr}`;
    }
    if (/^l|liters?$/i.test(unit)) {
      const { value, unit: impUnit } = mlToImperial(numValue * 1000);
      return `${toNiceFraction(value)} ${impUnit}${restStr}`;
    }
  }

  return amount;
}
