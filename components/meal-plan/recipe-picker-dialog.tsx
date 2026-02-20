"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { Search, Clock, Users, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { addRecipeToMealPlan } from "@/app/dashboard/meal-plan/actions";
import { MealType, Recipe } from "@/app/dashboard/meal-plan/types";

export default function RecipePickerDialog(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  mealPlanId: string;
  date: Date;
  mealType: MealType;
  recipes: Recipe[];
  disabled?: boolean;
}) {
  const {
    open,
    onOpenChange,
    title,
    mealPlanId,
    date,
    mealType,
    recipes,
    disabled,
  } = props;

  const router = useRouter();
  const [q, setQ] = useState("");
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return recipes;
    return recipes.filter((r) => r.title.toLowerCase().includes(s));
  }, [q, recipes]);

  async function onPick(recipeId: string) {
    try {
      await addRecipeToMealPlan({ mealPlanId, recipeId, date, mealType });
      onOpenChange(false);
      startTransition(() => router.refresh());
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md [&>button]:hidden pt-4">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-base font-semibold">{title}</DialogTitle>

          <DialogClose asChild>
            <Button
              variant="ghost"
              size="sm"
              className="cursor-pointer"
              aria-label="Close"
            >
              <X />
            </Button>
          </DialogClose>
        </DialogHeader>

        <div className="space-y-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search recipes..."
              className="pl-9 rounded-sm border-border-light"
            />
          </div>

          {filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-10">
              No matches. Try searching a different recipe.
            </div>
          ) : (
            <div className="scrollbar-bite max-h-105 overflow-y-auto rounded-sm border border-border-light">
              {filtered.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 p-3 border-b border-border-light last:border-b-0 hover:bg-muted/30 transition"
                >
                  <div className="relative h-12 w-12 rounded-sm overflow-hidden bg-muted shrink-0">
                    {r.imageUrl ? (
                      <Image
                        src={r.imageUrl}
                        alt={r.title}
                        fill
                        className="object-cover"
                      />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold line-clamp-1 break-all">
                      {r.title}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                      {r.totalTime ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {r.totalTime}m
                        </span>
                      ) : null}
                      {r.servings ? (
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {r.servings}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="brand"
                    className="rounded-sm"
                    disabled={disabled || pending}
                    onClick={() => onPick(r.id)}
                  >
                    Add
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
