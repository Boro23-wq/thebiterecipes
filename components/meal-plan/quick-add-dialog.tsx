"use client";

import { useMemo, useState, useTransition } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { addRecipeToMealPlan } from "@/app/dashboard/meal-plan/actions";
import { MealType } from "@/app/dashboard/meal-plan/types";
import { X } from "lucide-react";

const MEAL_TYPES: Array<{ type: MealType; label: string }> = [
  { type: "breakfast", label: "Breakfast" },
  { type: "lunch", label: "Lunch" },
  { type: "dinner", label: "Dinner" },
  { type: "snack", label: "Snack" },
];

export default function QuickAddDialog(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  recipeId: string | null;
  mealPlanId: string;
  weekDays: Date[];
}) {
  const { open, onOpenChange, recipeId, mealPlanId, weekDays } = props;

  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [dayIdx, setDayIdx] = useState(0);
  const [mealType, setMealType] = useState<MealType>("dinner");

  const selectedDay = useMemo(
    () => weekDays[dayIdx] ?? weekDays[0],
    [weekDays, dayIdx],
  );

  async function onAdd() {
    if (!recipeId || !selectedDay) return;

    try {
      await addRecipeToMealPlan({
        mealPlanId,
        recipeId,
        date: selectedDay,
        mealType,
      });
      onOpenChange(false);
      startTransition(() => router.refresh());
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-2">
          <DialogTitle className="text-base font-semibold">
            Quick add
          </DialogTitle>

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

        <div className="space-y-3">
          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-2">
              Day
            </div>
            <div className="grid grid-cols-4 gap-1">
              {weekDays.map((d, idx) => {
                const active = idx === dayIdx;
                return (
                  <button
                    key={d.toISOString()}
                    onClick={() => setDayIdx(idx)}
                    className={`rounded-sm border px-2 py-2 text-left transition cursor-pointer ${
                      active
                        ? "border-[#FF6B35] bg-[#FF6B35]/10"
                        : "hover:bg-muted/40"
                    }`}
                  >
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase">
                      {format(d, "EEE")}
                    </div>
                    <div className="text-sm font-bold leading-none">
                      {format(d, "d")}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6">
            <div className="text-xs font-semibold text-muted-foreground mb-2">
              Meal
            </div>
            <div className="grid grid-cols-2 gap-1">
              {MEAL_TYPES.map((m) => {
                const active = m.type === mealType;
                return (
                  <button
                    key={m.type}
                    onClick={() => setMealType(m.type)}
                    className={`rounded-sm border px-3 py-2 text-sm font-semibold transition ${
                      active
                        ? "border-[#FF6B35] bg-[#FF6B35]/10"
                        : "hover:bg-muted/40"
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-1 pt-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-sm"
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={onAdd}
              disabled={pending || !recipeId}
              className="rounded-sm bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white"
            >
              Add
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
