"use client";

import { addDays, format } from "date-fns";
import RecipeSidebar from "./recipe-sidebar";
import GroceryListButton from "./grocery-list-button";
import DayColumn from "./day-column";
import { MealPlan, Recipe } from "@/app/dashboard/meal-plan/types";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "../ui/button";
import { BookOpen, X } from "lucide-react";

interface MealPlanCalendarProps {
  mealPlan: MealPlan;
  recipes: Recipe[];
  startDate: Date;
  endDate: Date;
}

export default function MealPlanCalendar({
  mealPlan,
  recipes,
  startDate,
  endDate,
}: MealPlanCalendarProps) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
  const weekLabel = `${format(startDate, "MMM d")} – ${format(endDate, "MMM d")}`;

  return (
    <div className="grid gap-4 lg:grid-cols-[340px_1fr] items-stretch">
      <div className="hidden lg:block lg:self-stretch">
        <RecipeSidebar
          recipes={recipes}
          weekDays={days}
          mealPlanId={mealPlan.id}
        />
      </div>

      {/* Mobile FAB + Drawer */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              aria-label="Open recipes"
              variant="brand"
              className={[
                "fixed z-50 right-10 bottom-4",
                "h-10 rounded-sm px-4",
                "inline-flex items-center gap-2",
              ].join(" ")}
            >
              <BookOpen className="h-5 w-5" />
              {/* optional label: hidden on very small screens */}
              <span className="text-md font-semibold hidden sm:inline">
                Recipes
              </span>
            </Button>
          </SheetTrigger>

          <SheetContent
            side="bottom"
            className="h-[85vh] p-0 [&>button]:hidden"
          >
            <SheetHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-lg font-bold">Recipes</SheetTitle>

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

            <div className="h-[calc(85vh-56px)] px-3 pb-3">
              <RecipeSidebar
                recipes={recipes}
                weekDays={days}
                mealPlanId={mealPlan.id}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Calendar */}
      <div className="space-y-3 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl -mt-1.5 font-semibold">Your Week</h2>
            <p className="text-sm text-muted-foreground">{weekLabel}</p>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Tip: drag recipes onto a meal, or click{" "}
              <span className="font-medium">Add</span>.
            </p>
          </div>

          <GroceryListButton
            mealPlanId={mealPlan.id}
            hasRecipes={(mealPlan.mealPlanRecipes?.length ?? 0) > 0}
            isStale={mealPlan.groceryList?.isStale ?? false}
          />
        </div>

        <div className="rounded-sm bg-brand-100 border border-border-brand-light">
          <div className="overflow-x-auto scrollbar-bite">
            <div className="grid grid-cols-7 gap-3 p-3 min-w-245">
              {days.map((day) => (
                <DayColumn
                  key={day.toISOString()}
                  date={day}
                  mealPlanId={mealPlan.id}
                  mealPlanRecipes={mealPlan.mealPlanRecipes || []}
                  allRecipes={recipes}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
