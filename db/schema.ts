import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  serial,
  check,
  json,
} from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";

// Main recipes table
export const recipes = pgTable(
  "recipes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),

    // Core recipe info
    title: text("title").notNull(),
    description: text("description"),
    imageUrl: text("image_url"),

    // Recipe details
    servings: integer("servings"),
    prepTime: integer("prep_time"),
    cookTime: integer("cook_time"),
    totalTime: integer("total_time"),
    difficulty: text("difficulty"),
    cuisine: text("cuisine"),
    category: text("category"),

    // Macros
    calories: integer("calories"),
    protein: integer("protein"),
    carbs: integer("carbs"),
    fat: integer("fat"),

    // Source
    source: text("source"),
    sourceUrl: text("source_url"),

    // User engagement
    isFavorite: boolean("is_favorite").default(false).notNull(),
    rating: integer("rating"), // 1-5, add check constraint
    notes: text("notes"),

    // Onboarding flag
    isSeeded: boolean("is_seeded").default(false).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    ratingCheck: check(
      "rating_check",
      sql`${table.rating} >= 1 AND ${table.rating} <= 5`,
    ),
  }),
);

// Recipe ingredients (one-to-many)
export const recipeIngredients = pgTable("recipe_ingredients", {
  id: serial("id").primaryKey(),
  recipeId: uuid("recipe_id")
    .references(() => recipes.id, { onDelete: "cascade" })
    .notNull(),
  ingredient: text("ingredient").notNull(),
  amount: text("amount"),
  order: integer("order").notNull(),
});

// Recipe instructions (one-to-many)
export const recipeInstructions = pgTable("recipe_instructions", {
  id: serial("id").primaryKey(),
  recipeId: uuid("recipe_id")
    .references(() => recipes.id, { onDelete: "cascade" })
    .notNull(),
  step: text("step").notNull(),
  order: integer("order").notNull(),
});

// Tags table
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Recipe-Tags junction table (many-to-many)
export const recipeTags = pgTable("recipe_tags", {
  recipeId: uuid("recipe_id")
    .references(() => recipes.id, { onDelete: "cascade" })
    .notNull(),
  tagId: integer("tag_id")
    .references(() => tags.id, { onDelete: "cascade" })
    .notNull(),
});

// Recipe images (one-to-many)
export const recipeImages = pgTable("recipe_images", {
  id: serial("id").primaryKey(),
  recipeId: uuid("recipe_id")
    .references(() => recipes.id, { onDelete: "cascade" })
    .notNull(),
  imageUrl: text("image_url").notNull(),
  order: integer("order").notNull(),
});

// ============================================
// ONBOARDING PROFILES
// ============================================
export const onboardingProfiles = pgTable("onboarding_profiles", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().unique(),

  // Taste preferences
  dietaryRestrictions: json("dietary_restrictions")
    .$type<string[]>()
    .default([]),
  cuisinePreferences: json("cuisine_preferences").$type<string[]>().default([]),
  skillLevel: text("skill_level"), // "beginner" | "intermediate" | "advanced"
  cookingTime: text("cooking_time"), // "quick" | "moderate" | "elaborate"

  // Completion tracking
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// SEED RECIPES (system-level template bank)
// ============================================
export const seedRecipes = pgTable("seed_recipes", {
  id: serial("id").primaryKey(),

  // Core recipe info
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),

  // Recipe details
  servings: integer("servings"),
  prepTime: integer("prep_time"),
  cookTime: integer("cook_time"),
  totalTime: integer("total_time"),

  // Matching tags (used by prefill algorithm)
  difficulty: text("difficulty").notNull(), // "beginner" | "intermediate" | "advanced"
  cuisine: text("cuisine").notNull(), // "italian" | "mexican" | etc.
  dietaryTags: json("dietary_tags").$type<string[]>().default([]), // ["vegan", "gluten-free", ...]
  timeCategory: text("time_category").notNull(), // "quick" | "moderate" | "elaborate"

  // Macros
  calories: integer("calories"),
  protein: integer("protein"),
  carbs: integer("carbs"),
  fat: integer("fat"),

  // Source attribution
  source: text("source"),
  sourceUrl: text("source_url"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Seed recipe ingredients
export const seedRecipeIngredients = pgTable("seed_recipe_ingredients", {
  id: serial("id").primaryKey(),
  seedRecipeId: integer("seed_recipe_id")
    .references(() => seedRecipes.id, { onDelete: "cascade" })
    .notNull(),
  ingredient: text("ingredient").notNull(),
  amount: text("amount"),
  order: integer("order").notNull(),
});

// Seed recipe instructions
export const seedRecipeInstructions = pgTable("seed_recipe_instructions", {
  id: serial("id").primaryKey(),
  seedRecipeId: integer("seed_recipe_id")
    .references(() => seedRecipes.id, { onDelete: "cascade" })
    .notNull(),
  step: text("step").notNull(),
  order: integer("order").notNull(),
});

// ============================================
// RELATIONS
// ============================================

export const recipesRelations = relations(recipes, ({ many }) => ({
  ingredients: many(recipeIngredients),
  instructions: many(recipeInstructions),
  tags: many(recipeTags),
  images: many(recipeImages),
  cookSessions: many(cookSessions),
}));

export const recipeIngredientsRelations = relations(
  recipeIngredients,
  ({ one }) => ({
    recipe: one(recipes, {
      fields: [recipeIngredients.recipeId],
      references: [recipes.id],
    }),
  }),
);

export const recipeInstructionsRelations = relations(
  recipeInstructions,
  ({ one }) => ({
    recipe: one(recipes, {
      fields: [recipeInstructions.recipeId],
      references: [recipes.id],
    }),
  }),
);

export const tagsRelations = relations(tags, ({ many }) => ({
  recipes: many(recipeTags),
}));

export const recipeTagsRelations = relations(recipeTags, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeTags.recipeId],
    references: [recipes.id],
  }),
  tag: one(tags, {
    fields: [recipeTags.tagId],
    references: [tags.id],
  }),
}));

export const recipeImagesRelations = relations(recipeImages, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeImages.recipeId],
    references: [recipes.id],
  }),
}));

// Seed recipe relations
export const seedRecipesRelations = relations(seedRecipes, ({ many }) => ({
  ingredients: many(seedRecipeIngredients),
  instructions: many(seedRecipeInstructions),
}));

export const seedRecipeIngredientsRelations = relations(
  seedRecipeIngredients,
  ({ one }) => ({
    seedRecipe: one(seedRecipes, {
      fields: [seedRecipeIngredients.seedRecipeId],
      references: [seedRecipes.id],
    }),
  }),
);

export const seedRecipeInstructionsRelations = relations(
  seedRecipeInstructions,
  ({ one }) => ({
    seedRecipe: one(seedRecipes, {
      fields: [seedRecipeInstructions.seedRecipeId],
      references: [seedRecipes.id],
    }),
  }),
);

// ============================================
// EXISTING TABLES (unchanged)
// ============================================

export const categories = pgTable("categories", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  isPinned: boolean("is_pinned").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const recipeCategories = pgTable("recipe_categories", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  recipeId: uuid("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mealPlans = pgTable("meal_plans", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const mealPlanRecipes = pgTable(
  "meal_plan_recipes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    mealPlanId: text("meal_plan_id")
      .notNull()
      .references(() => mealPlans.id, { onDelete: "cascade" }),
    recipeId: uuid("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    date: timestamp("date").notNull(),
    mealType: text("meal_type").notNull(),
    customServings: integer("custom_servings"),
    notes: text("notes"),
    order: integer("order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueMealSlot: sql`UNIQUE(meal_plan_id, date, meal_type, recipe_id)`,
  }),
);

export const groceryLists = pgTable("grocery_lists", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  mealPlanId: text("meal_plan_id")
    .notNull()
    .unique()
    .references(() => mealPlans.id, { onDelete: "cascade" }),
  lastGeneratedAt: timestamp("last_generated_at"),
  isStale: boolean("is_stale").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const groceryListItems = pgTable("grocery_list_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  groceryListId: text("grocery_list_id")
    .notNull()
    .references(() => groceryLists.id, { onDelete: "cascade" }),
  ingredient: text("ingredient").notNull(),
  amount: text("amount"),
  unit: text("unit"),
  recipeIds: text("recipe_ids"),
  isManual: boolean("is_manual").default(false).notNull(),
  isChecked: boolean("is_checked").default(false).notNull(),
  checkedAt: timestamp("checked_at"),
  category: text("category"),
  order: integer("order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  recipeCategories: many(recipeCategories),
}));

export const recipeCategoriesRelations = relations(
  recipeCategories,
  ({ one }) => ({
    recipe: one(recipes, {
      fields: [recipeCategories.recipeId],
      references: [recipes.id],
    }),
    category: one(categories, {
      fields: [recipeCategories.categoryId],
      references: [categories.id],
    }),
  }),
);

export const mealPlansRelations = relations(mealPlans, ({ many, one }) => ({
  mealPlanRecipes: many(mealPlanRecipes),
  groceryList: one(groceryLists),
}));

export const mealPlanRecipesRelations = relations(
  mealPlanRecipes,
  ({ one }) => ({
    mealPlan: one(mealPlans, {
      fields: [mealPlanRecipes.mealPlanId],
      references: [mealPlans.id],
    }),
    recipe: one(recipes, {
      fields: [mealPlanRecipes.recipeId],
      references: [recipes.id],
    }),
  }),
);

export const groceryListsRelations = relations(
  groceryLists,
  ({ one, many }) => ({
    mealPlan: one(mealPlans, {
      fields: [groceryLists.mealPlanId],
      references: [mealPlans.id],
    }),
    items: many(groceryListItems),
  }),
);

export const groceryListItemsRelations = relations(
  groceryListItems,
  ({ one }) => ({
    groceryList: one(groceryLists, {
      fields: [groceryListItems.groceryListId],
      references: [groceryLists.id],
    }),
  }),
);

export const userPreferences = pgTable("user_preferences", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().unique(),
  measurementUnit: text("measurement_unit").default("imperial"),
  defaultServings: integer("default_servings").default(4),
  language: text("language").default("en"),
  timeFormat: text("time_format").default("12"),
  defaultViewMode: text("default_view_mode").default("grid"),
  emailNotifications: boolean("email_notifications").default(true),
  weeklyDigest: boolean("weekly_digest").default(false),
  recipeReminders: boolean("recipe_reminders").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// COOK SESSIONS (analytics tracking)
// ============================================
export const cookSessions = pgTable("cook_sessions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  recipeId: uuid("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),

  // Session tracking
  status: text("status").notNull(), // "started" | "completed" | "abandoned"
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),

  // Progress
  totalSteps: integer("total_steps").notNull(),
  lastStepReached: integer("last_step_reached").notNull().default(0),

  // Context
  servingsUsed: integer("servings_used"),
  durationSeconds: integer("duration_seconds"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cookSessionsRelations = relations(cookSessions, ({ one }) => ({
  recipe: one(recipes, {
    fields: [cookSessions.recipeId],
    references: [recipes.id],
  }),
}));
