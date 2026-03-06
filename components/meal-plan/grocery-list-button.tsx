"use client";

import { ShoppingCart, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import GroceryListView from "@/components/meal-plan/grocery-list/grocery-list-view";

type GroceryListItem = {
  id: string;
  groceryListId: string;
  ingredient: string;
  amount: string | null;
  unit: string | null;
  recipeIds: string | null;
  isManual: boolean;
  isChecked: boolean;
  checkedAt: Date | null;
  category: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
};

type GroceryList = {
  id: string;
  mealPlanId: string;
  lastGeneratedAt: Date | null;
  isStale: boolean;
  createdAt: Date;
  updatedAt: Date;
  items: GroceryListItem[];
};

interface GroceryListButtonProps {
  mealPlanId: string;
  hasRecipes: boolean;
  isStale: boolean;
  groceryList: GroceryList | null | undefined;
}

export default function GroceryListButton({
  mealPlanId,
  hasRecipes,
  isStale,
  groceryList,
}: GroceryListButtonProps) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  if (!hasRecipes) return null;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="brand" className="whitespace-nowrap">
          <ShoppingCart className="h-4 w-4" />
          Grocery
          {isStale && <Sparkles className="h-3 w-3 ml-2 animate-pulse" />}
        </Button>
      </SheetTrigger>

      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={
          isDesktop
            ? "w-full sm:max-w-lg p-0 overflow-y-auto scrollbar-bite"
            : "h-[90vh] p-0"
        }
      >
        <SheetHeader>
          <SheetTitle className="text-xl font-semibold">
            Grocery List
          </SheetTitle>
          <SheetDescription>
            Ingredients from meal plan, organized into a smart grocery list.
          </SheetDescription>
        </SheetHeader>

        <div
          className={`px-4 overflow-y-auto scrollbar-bite ${isDesktop ? "pb-2 h-auto" : "pt-0 pb-2 h-[calc(90vh-52px)]"}`}
        >
          <GroceryListView
            mealPlanId={mealPlanId}
            groceryList={groceryList || null}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
