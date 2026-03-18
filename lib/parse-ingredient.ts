export type ParsedIngredient = {
  amount: string | null;
  ingredient: string;
  isHeader: boolean;
};

const FRACTION_MAP: Record<string, string> = {
  "¼": "1/4",
  "½": "1/2",
  "¾": "3/4",
  "⅐": "1/7",
  "⅑": "1/9",
  "⅒": "1/10",
  "⅓": "1/3",
  "⅔": "2/3",
  "⅕": "1/5",
  "⅖": "2/5",
  "⅗": "3/5",
  "⅘": "4/5",
  "⅙": "1/6",
  "⅚": "5/6",
  "⅛": "1/8",
  "⅜": "3/8",
  "⅝": "5/8",
  "⅞": "7/8",
};

function normalizeAmountString(input: string) {
  let s = input;

  // unicode fraction -> ascii fraction
  s = s.replace(/[¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g, (ch) => FRACTION_MAP[ch] ?? ch);

  // normalize "–"/"—" to "-"
  s = s.replace(/[–—]/g, "-");

  // collapse extra whitespace
  s = s.replace(/\s+/g, " ").trim();

  return s;
}

// ============================================
// HEADER DETECTION
// ============================================

// Matches lines like:
//   "For the sauce:"
//   "For the Dough"
//   "Sauce:"
//   "--- Filling ---"
//   "FROSTING"
//   "Crust"
const HEADER_PATTERNS = [
  /^for\s+(?:the\s+)?(.+?)[:.]?\s*$/i, // "For the sauce:" or "For sauce"
  /^---+\s*(.+?)\s*---+$/, // "--- Filling ---"
  /^(.+?):\s*$/, // "Sauce:" (word(s) followed by colon, nothing else)
];

// Additional check: lines that are ALL CAPS and short (e.g. "FROSTING")
const isAllCapsHeader = (s: string) =>
  s.length <= 40 &&
  s === s.toUpperCase() &&
  /^[A-Z\s]+$/.test(s) &&
  !/\d/.test(s);

// Known section header words (case-insensitive, matched as whole line)
const KNOWN_HEADERS = [
  "crust",
  "filling",
  "frosting",
  "icing",
  "glaze",
  "topping",
  "sauce",
  "dressing",
  "marinade",
  "dough",
  "batter",
  "assembly",
  "garnish",
  "broth",
  "stock",
  "rice",
  "salad",
  "salsa",
  "seasoning",
  "rub",
  "base",
  "cream",
  "syrup",
  "coating",
];

function detectHeader(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // Pattern-based detection
  for (const pattern of HEADER_PATTERNS) {
    const m = trimmed.match(pattern);
    if (m) return m[1]?.trim() || trimmed;
  }

  // ALL CAPS short lines
  if (isAllCapsHeader(trimmed)) return trimmed;

  // Known single-word headers (exact match, case-insensitive)
  if (KNOWN_HEADERS.includes(trimmed.toLowerCase())) return trimmed;

  return null;
}

// ============================================
// UNITS
// ============================================

const UNIT_PATTERN =
  "(?:cups?|tablespoons?|tbsp|teaspoons?|tsp|ounces?|oz|pounds?|lbs?|lb|grams?|g|kilograms?|kg|milliliters?|ml|liters?|l|pinch|dash|cloves?|pieces?|slices?|cans?|packages?|package|sticks?|bunche?s?|heads?|stalks?|sprigs?|handfuls?)";

// ============================================
// AMOUNT PATTERN (with metric alternative)
// ============================================

// Core number: "1", "1/2", "1.5", "1 1/2"
const NUM = "(?:\\d+\\s+\\d+\\/\\d+|\\d+\\/\\d+|\\d+(?:\\.\\d+)?)";

// Range: "2-3", "2 to 3"
const RANGE = `(?:\\s*(?:-|to)\\s*${NUM})?`;

// Parenthetical: "(14.5 ounce)"
const PAREN = "(?:\\s*\\([^)]*\\))?";

// Metric alternative: "/113 grams" or "/192 g"
// This captures patterns like "½ cup/113 grams" where the slash introduces
// an alternative measurement that should stay part of the amount
const METRIC_ALT =
  "(?:\\/\\d+(?:\\.\\d+)?\\s*(?:grams?|g|kilograms?|kg|ounces?|oz|pounds?|lbs?|lb|milliliters?|ml|liters?|l))?";

// Full amount: number + range + unit + metric-alt + paren
// e.g. "1/2 cup/113 grams" or "2-3 tablespoons" or "1 (14.5 ounce) can"
const FULL_AMOUNT = `(${NUM}${RANGE})\\s*(${UNIT_PATTERN})?${METRIC_ALT}${PAREN}`;

const AMOUNT_WITH_UNIT_RE = new RegExp(`^${FULL_AMOUNT}\\s+(.+)$`, "i");

const SIMPLE_AMOUNT_RE = new RegExp(
  `^(${NUM}${RANGE})${METRIC_ALT}\\s+(.+)$`,
  "i",
);

// ============================================
// MAIN PARSER
// ============================================

export function parseIngredient(line: string): ParsedIngredient {
  const raw = (line ?? "").trim();
  if (!raw) return { amount: null, ingredient: "", isHeader: false };

  // Check if this line is a section header
  const header = detectHeader(raw);
  if (header) {
    return { amount: null, ingredient: header, isHeader: true };
  }

  const normalized = normalizeAmountString(raw);

  // Try: amount + optional unit (with metric alt captured) + rest
  const m1 = normalized.match(AMOUNT_WITH_UNIT_RE);
  if (m1) {
    // Reconstruct the full amount from the original text up to where the
    // ingredient name begins. This preserves metric alternatives.
    const ingredientText = (m1[3] ?? "").trim();
    const ingredientStart = normalized.lastIndexOf(ingredientText);
    const amountPart =
      ingredientStart > 0
        ? normalized.slice(0, ingredientStart).trim()
        : [m1[1], m1[2]].filter(Boolean).join(" ").trim();

    return {
      amount: amountPart || null,
      ingredient: ingredientText,
      isHeader: false,
    };
  }

  // Try: amount + rest (no unit)
  const m2 = normalized.match(SIMPLE_AMOUNT_RE);
  if (m2) {
    const ingredientText = (m2[2] ?? "").trim();
    const ingredientStart = normalized.lastIndexOf(ingredientText);
    const amountPart =
      ingredientStart > 0
        ? normalized.slice(0, ingredientStart).trim()
        : (m2[1] ?? "").trim();

    return {
      amount: amountPart || null,
      ingredient: ingredientText,
      isHeader: false,
    };
  }

  return { amount: null, ingredient: normalized, isHeader: false };
}
