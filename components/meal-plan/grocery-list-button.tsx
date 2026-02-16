// components/meal-plan/grocery-list-button.tsx
"use client";

import { ShoppingCart, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Sheet,
  SheetClose,
  SheetContent,
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
          <ShoppingCart className="h-4 w-4 mr-2" />
          Grocery List
          {isStale && <Sparkles className="h-3 w-3 ml-2 animate-pulse" />}
        </Button>
      </SheetTrigger>

      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={
          isDesktop
            ? "w-full sm:max-w-lg p-0 [&>button]:hidden overflow-y-auto scrollbar-bite"
            : "h-[90vh] p-0 [&>button]:hidden"
        }
      >
        <SheetHeader
          className={isDesktop ? "p-3 bg-brand-50" : "p-3 bg-brand-50"}
        >
          {" "}
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-bold flex items-center gap-2">
              <ShoppingCart className="h-8 w-8 bg-brand p-2 text-white rounded-sm" />
            </SheetTitle>

            <SheetClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="cursor-pointer -mr-2"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>

        <div
          className={`px-4 overflow-y-auto scrollbar-bite ${isDesktop ? "py-2 h-auto" : "pt-0 pb-2 h-[calc(90vh-52px)]"}`}
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
