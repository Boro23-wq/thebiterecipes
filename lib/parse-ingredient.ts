// lib/parse-ingredient.ts
export type ParsedIngredient = {
  amount: string | null;
  ingredient: string;
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

  // normalize “–”/“—” to "-"
  s = s.replace(/[–—]/g, "-");

  // collapse extra whitespace
  s = s.replace(/\s+/g, " ").trim();

  return s;
}

const UNIT_PATTERN =
  "(?:cups?|cup|tablespoons?|tbsp|teaspoons?|tsp|ounces?|oz|pounds?|lbs?|lb|grams?|g|kilograms?|kg|milliliters?|ml|liters?|l|pinch|dash|cloves?|pieces?|slices?|cans?|can|packages?|package)";

const AMOUNT_PATTERN =
  // supports:
  //  - 1
  //  - 1/2
  //  - 1.5
  //  - 1 1/2
  //  - 2-3 / 2 - 3
  //  - 2 to 3
  //  - optional parentheses immediately after (e.g. 1 (14.5 ounce))
  "((?:\\d+\\s+\\d+\\/\\d+|\\d+\\/\\d+|\\d+(?:\\.\\d+)?)" +
  "(?:\\s*(?:-|to)\\s*(?:\\d+\\s+\\d+\\/\\d+|\\d+\\/\\d+|\\d+(?:\\.\\d+)?))?" +
  "(?:\\s*\\([^)]*\\))?" +
  ")";

const AMOUNT_WITH_UNIT_RE = new RegExp(
  `^${AMOUNT_PATTERN}\\s*(${UNIT_PATTERN})?\\b\\s*(.+)$`,
  "i",
);

const SIMPLE_AMOUNT_RE = new RegExp(`^${AMOUNT_PATTERN}\\s+(.+)$`, "i");

export function parseIngredient(line: string): ParsedIngredient {
  const raw = (line ?? "").trim();
  if (!raw) return { amount: null, ingredient: "" };

  const normalized = normalizeAmountString(raw);

  // amount + optional unit + rest
  const m1 = normalized.match(AMOUNT_WITH_UNIT_RE);
  if (m1) {
    const amount = [m1[1], m1[2]].filter(Boolean).join(" ").trim();
    return { amount: amount || null, ingredient: (m1[3] ?? "").trim() };
  }

  // amount + rest (no unit)
  const m2 = normalized.match(SIMPLE_AMOUNT_RE);
  if (m2) {
    return {
      amount: (m2[1] ?? "").trim() || null,
      ingredient: (m2[2] ?? "").trim(),
    };
  }

  return { amount: null, ingredient: normalized };
}
