import {
  recipes,
  mealPlanRecipes,
  mealPlans,
  groceryLists,
  groceryListItems,
} from "@/db/schema";
import { InferSelectModel } from "drizzle-orm";

export type Recipe = InferSelectModel<typeof recipes>;

export type MealPlanRecipe = InferSelectModel<typeof mealPlanRecipes> & {
  recipe: Recipe;
};

export type GroceryListItem = InferSelectModel<typeof groceryListItems>;

export type GroceryList = InferSelectModel<typeof groceryLists> & {
  items: GroceryListItem[];
};

export type MealPlan = InferSelectModel<typeof mealPlans> & {
  mealPlanRecipes: MealPlanRecipe[];
  groceryList: GroceryList | null;
};

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
