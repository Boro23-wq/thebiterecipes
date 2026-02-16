"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import {
  toggleGroceryItem,
  deleteGroceryItem,
} from "@/app/dashboard/meal-plan/actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type GroceryItemType = {
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

interface GroceryItemProps {
  item: GroceryItemType;
}

export default function GroceryItem({ item }: GroceryItemProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);

  const recipes: Array<{ id: string; title: string }> = item.recipeIds
    ? JSON.parse(item.recipeIds)
    : [];

  const handleToggle = async () => {
    try {
      await toggleGroceryItem(item.id);
      startTransition(() => router.refresh());
    } catch (error) {
      toast.error("Failed to update item");
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!item.isManual) {
      toast.error("Cannot delete recipe items");
      return;
    }

    setIsDeleting(true);
    try {
      await deleteGroceryItem(item.id);
      toast.success("Item deleted");
      startTransition(() => router.refresh());
    } catch (error) {
      toast.error("Failed to delete item");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={cn(
        "group px-4 py-3 flex items-start gap-3 hover:bg-muted/20 transition",
        item.isChecked && "opacity-60",
      )}
    >
      <Checkbox
        checked={item.isChecked}
        onCheckedChange={handleToggle}
        disabled={isPending}
        className="mt-0.5"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm font-medium leading-tight",
              item.isChecked && "line-through",
            )}
          >
            {item.amount && (
              <span className="text-brand font-semibold">
                {item.amount}
                {item.unit ? ` ${item.unit}` : ""}{" "}
              </span>
            )}
            {item.ingredient}
          </p>

          {item.isManual && (
            <Button
              onClick={handleDelete}
              disabled={isDeleting || isPending}
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {recipes.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {recipes.slice(0, 2).map((recipe) => (
              <span
                key={recipe.id}
                className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-sm bg-brand-100 text-brand"
                title={recipe.title} // ✅ Full title on hover
              >
                {recipe.title.length > 20
                  ? `${recipe.title.substring(0, 20)}...`
                  : recipe.title}
              </span>
            ))}
            {recipes.length > 2 && (
              <span
                className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-sm bg-muted text-muted-foreground"
                title={recipes
                  .slice(2)
                  .map((r) => r.title)
                  .join(", ")} // ✅ Show remaining on hover
              >
                +{recipes.length - 2} more
              </span>
            )}
          </div>
        )}

        {item.isManual && (
          <span className="inline-flex items-center mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-sm bg-emerald-100 text-emerald-700">
            Custom
          </span>
        )}
      </div>
    </div>
  );
}
