"use client";

import { addDays, format } from "date-fns";
import RecipeSidebar from "./recipe-sidebar";
import GroceryListButton from "./grocery-list-button";
import DayColumn from "./day-column";
import MealPlanListView from "./meal-plan-list-view";
import ViewSwitcher from "@/components/view-switcher";
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
import {
  BookOpen,
  X,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
} from "lucide-react";
import Link from "next/link";

export type ViewMode = "calendar" | "list";

interface MealPlanCalendarProps {
  mealPlan: MealPlan;
  recipes: Recipe[];
  startDate: Date;
  endDate: Date;
  weekOffset: number;
  viewMode: ViewMode;
}

export default function MealPlanCalendar({
  mealPlan,
  recipes,
  startDate,
  endDate,
  weekOffset,
  viewMode,
}: MealPlanCalendarProps) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
  const weekLabel = `${format(startDate, "MMM d")} – ${format(endDate, "MMM d")}`;
  const isCurrentWeek = weekOffset === 0;

  return (
    <div className="grid gap-4 lg:grid-cols-[340px_1fr] items-stretch">
      {/* Sidebar - only show in calendar view */}
      {viewMode === "calendar" && (
        <>
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
                    <SheetTitle className="text-lg font-bold">
                      Recipes
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
        </>
      )}

      {/* Main Content */}
      <div
        className={`space-y-3 min-w-0 ${viewMode === "list" ? "lg:col-span-2" : ""}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl -mt-1.5 font-semibold">Your Week</h2>
            <p className="text-sm text-muted-foreground">{weekLabel}</p>
            <p className="mt-4 text-xs text-muted-foreground">
              {viewMode === "calendar"
                ? "Tip: drag recipes onto a meal, or click Add."
                : "Your planned meals for the week."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto my-2 sm:mt-0">
            {/* View Switcher */}
            <ViewSwitcher
              mode="link"
              currentView={viewMode}
              options={[
                {
                  value: "calendar",
                  icon: LayoutGrid,
                  label: "Calendar view",
                },
                {
                  value: "list",
                  icon: List,
                  label: "List view",
                },
              ]}
              getLinkHref={(view) =>
                `/dashboard/meal-plan?week=${weekOffset}&view=${view}`
              }
            />

            {/* Week Navigation */}
            <div className="flex items-center gap-1 rounded-sm border border-border-light bg-white/70 p-1">
              <Link
                href={`/dashboard/meal-plan?week=${weekOffset - 1}&view=${viewMode}`}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-sm"
                  aria-label="Previous week"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </Link>

              {!isCurrentWeek && (
                <Link href={`/dashboard/meal-plan?view=${viewMode}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs rounded-sm"
                  >
                    Today
                  </Button>
                </Link>
              )}

              <Link
                href={`/dashboard/meal-plan?week=${weekOffset + 1}&view=${viewMode}`}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-sm"
                  aria-label="Next week"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <GroceryListButton
              mealPlanId={mealPlan.id}
              hasRecipes={(mealPlan.mealPlanRecipes?.length ?? 0) > 0}
              isStale={mealPlan.groceryList?.isStale ?? false}
              groceryList={mealPlan.groceryList}
            />
          </div>
        </div>

        {/* Conditional View Rendering */}
        {viewMode === "list" ? (
          <MealPlanListView mealPlan={mealPlan} days={days} />
        ) : (
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
        )}
      </div>
    </div>
  );
}
