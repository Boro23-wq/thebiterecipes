"use client";

import { ShoppingCart, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
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

  // Mobile: Link to page
  if (!isDesktop) {
    return (
      <Link href={`/dashboard/meal-plan/grocery?id=${mealPlanId}`}>
        <Button variant="brand" className="whitespace-nowrap">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Grocery List
          {isStale && <Sparkles className="h-3 w-3 ml-2 animate-pulse" />}
        </Button>
      </Link>
    );
  }

  // Desktop: Drawer
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
        side="right"
        className="w-full sm:max-w-lg p-0 [&>button]:hidden overflow-y-auto scrollbar-bite"
      >
        <SheetHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-bold">
              <ShoppingCart className="h-5 w-5 mr-2" />
            </SheetTitle>

            <SheetClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="cursor-pointer"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>

        <div className="px-4 py-1">
          <GroceryListView
            mealPlanId={mealPlanId}
            groceryList={groceryList || null}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
