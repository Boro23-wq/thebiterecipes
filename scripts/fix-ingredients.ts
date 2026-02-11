import { config } from "dotenv";
import { resolve } from "path";

// Load env vars FIRST
config({ path: resolve(process.cwd(), ".env.local") });

// Check if DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL not found in .env.local");
  process.exit(1);
}

console.log("✅ Environment variables loaded");

async function fixIngredients() {
  // Dynamic imports AFTER env vars are loaded
  const { db } = await import("../db/index.js");
  const { recipeIngredients } = await import("../db/schema.js");
  const { eq } = await import("drizzle-orm");

  console.log("🔧 Fixing all ingredients...");

  function parseIngredient(line: string): {
    amount: string | null;
    ingredient: string;
  } {
    const match = line.match(
      /^([\d\/\.\s]+(cups?|cup|tablespoons?|tbsp|teaspoons?|tsp|ounces?|oz|pounds?|lbs?|lb|grams?|g|kilograms?|kg|milliliters?|ml|liters?|l|pinch|dash|cloves?|pieces?|slices?)?)\s+(.+)$/i,
    );

    if (match) {
      return {
        amount: match[1].trim(),
        ingredient: match[3].trim(),
      };
    }

    const simpleMatch = line.match(/^([\d\/\.\s]+)\s+(.+)$/);
    if (simpleMatch) {
      return {
        amount: simpleMatch[1].trim(),
        ingredient: simpleMatch[2].trim(),
      };
    }

    return {
      amount: null,
      ingredient: line.trim(),
    };
  }

  try {
    // Get all ingredients from database
    const allIngredients = await db.query.recipeIngredients.findMany();

    console.log(`📊 Found ${allIngredients.length} ingredients to fix`);

    let fixed = 0;

    for (const ing of allIngredients) {
      // Parse the ingredient field
      const { amount, ingredient } = parseIngredient(ing.ingredient);

      // Update the record
      await db
        .update(recipeIngredients)
        .set({
          amount: amount,
          ingredient: ingredient,
        })
        .where(eq(recipeIngredients.id, ing.id));

      console.log(
        `✅ Fixed: "${ing.ingredient}" → amount: "${amount}", ingredient: "${ingredient}"`,
      );
      fixed++;
    }

    console.log("\n🎉 Migration completed!");
    console.log(`   - Fixed: ${fixed} ingredients`);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

fixIngredients()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
