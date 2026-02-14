import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  serial,
  check,
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
  amount: text("amount"), // e.g., "2 cups", "1 tbsp"
  order: integer("order").notNull(), // Display order
});

// Recipe instructions (one-to-many)
export const recipeInstructions = pgTable("recipe_instructions", {
  id: serial("id").primaryKey(),
  recipeId: uuid("recipe_id")
    .references(() => recipes.id, { onDelete: "cascade" })
    .notNull(),
  step: text("step").notNull(),
  order: integer("order").notNull(), // Step number
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
  order: integer("order").notNull(), // Display order (0 = primary)
});

// Relations (for Drizzle queries)
export const recipesRelations = relations(recipes, ({ many }) => ({
  ingredients: many(recipeIngredients),
  instructions: many(recipeInstructions),
  tags: many(recipeTags),
  images: many(recipeImages),
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

// Meal Plans (one per week or custom date range)
export const mealPlans = pgTable("meal_plans", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),

  // Week identification
  startDate: timestamp("start_date").notNull(), // Monday 00:00
  endDate: timestamp("end_date").notNull(), // Sunday 23:59

  name: text("name"), // Optional: "Week of Jan 15", "Meal Prep Marathon"

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Recipes assigned to specific meals
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

    // When & what meal
    date: timestamp("date").notNull(), // Specific day (2025-01-15 00:00)
    mealType: text("meal_type").notNull(), // "breakfast" | "lunch" | "dinner" | "snack"

    // Servings override
    customServings: integer("custom_servings"), // null = use recipe default

    // Optional notes
    notes: text("notes"), // "Double batch for leftovers"

    // Order (for multiple recipes in same meal slot)
    order: integer("order").default(0).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    // Prevent duplicate recipe in same meal slot
    uniqueMealSlot: sql`UNIQUE(meal_plan_id, date, meal_type, recipe_id)`,
  }),
);

// Grocery list (one per meal plan)
export const groceryLists = pgTable("grocery_lists", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  mealPlanId: text("meal_plan_id")
    .notNull()
    .unique()
    .references(() => mealPlans.id, { onDelete: "cascade" }),

  // Track staleness
  lastGeneratedAt: timestamp("last_generated_at"),
  isStale: boolean("is_stale").default(false).notNull(), // true when recipes change

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Individual grocery items
export const groceryListItems = pgTable("grocery_list_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  groceryListId: text("grocery_list_id")
    .notNull()
    .references(() => groceryLists.id, { onDelete: "cascade" }),

  // Ingredient info
  ingredient: text("ingredient").notNull(), // "whole milk"
  amount: text("amount"), // "3.5 cups" (combined)
  unit: text("unit"), // "cups" (normalized)

  // Traceability
  recipeIds: text("recipe_ids"), // JSON array: ["uuid1","uuid2"]
  isManual: boolean("is_manual").default(false).notNull(),

  // Shopping state
  isChecked: boolean("is_checked").default(false).notNull(),
  checkedAt: timestamp("checked_at"),

  // Organization
  category: text("category"), // "dairy" | "produce" | "meat" | "pantry" | "other"
  order: integer("order").default(0).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Add relations
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

  // Preferences
  measurementUnit: text("measurement_unit").default("imperial"), // imperial or metric
  defaultServings: integer("default_servings").default(4),
  language: text("language").default("en"),
  timeFormat: text("time_format").default("12"), // 12 or 24
  defaultViewMode: text("default_view_mode").default("grid"), // grid or compact

  // Notifications
  emailNotifications: boolean("email_notifications").default(true),
  weeklyDigest: boolean("weekly_digest").default(false),
  recipeReminders: boolean("recipe_reminders").default(false),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
