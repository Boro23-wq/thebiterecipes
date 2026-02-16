"use client";

import { ShoppingCart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function GroceryListButton({
  mealPlanId,
  hasRecipes,
  isStale,
}: {
  mealPlanId: string;
  hasRecipes: boolean;
  isStale: boolean;
}) {
  if (!hasRecipes) return null;

  return (
    <Link href={`/dashboard/meal-plan/grocery?id=${mealPlanId}`}>
      <Button className="bg-[#FF6B35] hover:bg-[#FF6B35]/90">
        <ShoppingCart className="h-4 w-4 mr-0 sm:mr-2" />
        <span className="hidden sm:block">Grocery List</span>
        {isStale && <Sparkles className="h-3 w-3 ml-2 animate-pulse" />}
      </Button>
    </Link>
  );
}
