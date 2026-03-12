"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Edit2, Check, X } from "lucide-react";
import {
  toggleGroceryItem,
  deleteGroceryItem,
  updateGroceryItemQuantity,
} from "@/app/dashboard/meal-plan/actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type GroceryItemType = {
  id: string;
  groceryListId: string;
  ingredient: string;
  amount: string | null;
  unit: string | null;
  notes: string | null;
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

  const [isEditing, setIsEditing] = useState(false);
  const [editAmount, setEditAmount] = useState(item.amount || "");
  const [isSaving, setIsSaving] = useState(false);

  const recipeIds: string[] = item.recipeIds ? JSON.parse(item.recipeIds) : [];

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

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditAmount(item.amount || "");
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditAmount(item.amount || "");
  };

  const handleSaveEdit = async () => {
    if (!editAmount.trim()) {
      toast.error("Amount cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      await updateGroceryItemQuantity({
        itemId: item.id,
        amount: editAmount.trim(),
      });
      toast.success("Quantity updated");
      setIsEditing(false);
      startTransition(() => router.refresh());
    } catch (error) {
      toast.error("Failed to update quantity");
      console.error(error);
    } finally {
      setIsSaving(false);
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
        disabled={isPending || isEditing}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          {isEditing ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Input
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEdit();
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                  className="h-7 w-24 text-sm rounded-sm border-border-light"
                  placeholder="2 cups"
                  autoFocus
                  disabled={isSaving}
                />

                <span className="text-sm font-medium truncate">
                  {item.ingredient}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  size="icon"
                  className="h-6 w-6 bg-white hover:bg-green-50"
                >
                  <Check className="h-3 w-3 text-green-600" />
                </Button>

                <Button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  size="icon"
                  className="h-6 w-6 bg-white hover:bg-red-50"
                >
                  <X className="h-3 w-3 text-red-600" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p
                className={cn(
                  "text-sm font-medium leading-tight line-clamp-2 wrap-break-word",
                  item.isChecked && "line-through",
                )}
              >
                {item.amount && (
                  <button
                    onClick={handleStartEdit}
                    className="text-brand mr-1 font-semibold hover:underline cursor-pointer"
                    disabled={item.isChecked}
                  >
                    {item.amount}
                    {item.unit ? ` ${item.unit}` : ""}{" "}
                  </button>
                )}
                {item.ingredient}
              </p>

              <div className="flex items-center justify-items-start gap-1 shrink-0">
                {item.amount && !item.isChecked && (
                  <Button
                    onClick={handleStartEdit}
                    variant="text"
                    size="icon-xs"
                    className="h-7 w-7 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
                  >
                    <Edit2 />
                  </Button>
                )}

                {item.isManual && (
                  <Button
                    onClick={handleDelete}
                    disabled={isDeleting || isPending}
                    variant="ghost"
                    size="icon-xs"
                    className="h-7 w-7 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 />
                  </Button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Notes from Gemini aggregation */}
        {!isEditing && item.notes && (
          <p className="text-[11px] text-text-muted mt-1">{item.notes}</p>
        )}

        {!isEditing && recipeIds.length > 0 && (
          <span className="inline-flex items-center mt-2 text-[10px] font-medium px-2 py-0.5 rounded-sm bg-brand-100 text-brand">
            From {recipeIds.length}{" "}
            {recipeIds.length === 1 ? "recipe" : "recipes"}
          </span>
        )}

        {!isEditing && item.isManual && (
          <span className="inline-flex items-center mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-sm bg-emerald-100 text-emerald-700">
            Custom
          </span>
        )}
      </div>
    </div>
  );
}
