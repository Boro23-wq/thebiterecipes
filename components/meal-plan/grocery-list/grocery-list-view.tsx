"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Plus, Download, Share2, Trash2 } from "lucide-react";
import {
  generateGroceryList,
  addManualGroceryItem,
  clearCheckedGroceryItems,
} from "@/app/dashboard/meal-plan/actions";
import { toast } from "sonner";
import GroceryCategory from "./grocery-category";
import { DeleteDialog } from "@/components/delete-dialog";
import IngredientAutocomplete from "./ingredient-autocomplete";
import PrintableGroceryList from "./grocery-list-print";

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

interface GroceryListViewProps {
  mealPlanId: string;
  groceryList: GroceryList | null;
}

const CATEGORY_ORDER = ["produce", "meat", "dairy", "pantry", "other"];
const CATEGORY_LABELS: Record<string, string> = {
  produce: "Produce",
  meat: "Meat & Seafood",
  dairy: "Dairy & Eggs",
  pantry: "Pantry",
  other: "Other",
};

export default function GroceryListView({
  mealPlanId,
  groceryList,
}: GroceryListViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isGenerating, setIsGenerating] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [isClearing, setIsClearing] = useState(false);

  const items = groceryList?.items || [];

  const itemsByCategory = items.reduce(
    (acc, item) => {
      const category = item.category || "other";
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    },
    {} as Record<string, GroceryListItem[]>,
  );

  const sortedCategories = CATEGORY_ORDER.filter(
    (cat) => itemsByCategory[cat]?.length > 0,
  );

  const checkedCount = items.filter((i) => i.isChecked).length;
  const totalCount = items.length;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await generateGroceryList(mealPlanId);
      toast.success(`Generated ${result.itemCount} items`);
      startTransition(() => router.refresh());
    } catch (error) {
      toast.error("Failed to generate grocery list");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddManualItem = async () => {
    if (!newItemName.trim() || !groceryList) return;

    try {
      await addManualGroceryItem({
        groceryListId: groceryList.id,
        ingredient: newItemName.trim(),
        category: "other",
      });
      setNewItemName("");
      toast.success("Item added");
      startTransition(() => router.refresh());
    } catch (error) {
      toast.error("Failed to add item");
      console.error(error);
    }
  };

  const handleClearChecked = async () => {
    if (!groceryList) return;

    const checkedCount = items.filter((i) => i.isChecked).length;
    if (checkedCount === 0) {
      toast.info("No checked items to clear");
      return;
    }

    setIsClearing(true);
    try {
      await clearCheckedGroceryItems(groceryList.id);
      toast.success(
        `Cleared ${checkedCount} item${checkedCount > 1 ? "s" : ""}`,
      );
      startTransition(() => router.refresh());
    } catch (error) {
      toast.error("Failed to clear items");
      console.error(error);
    } finally {
      setIsClearing(false);
    }
  };

  const handlePrint = () => {
    const el = document.getElementById("print-root");
    if (!el) return;

    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;

    w.document.open();
    w.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Grocery List</title>
        <style>
          @page { margin: 0.5in; size: letter; }
          body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; }
        </style>
      </head>
      <body>
        ${el.innerHTML}
      </body>
    </html>
  `);
    w.document.close();

    // ensure images/fonts/layout load before printing
    w.onload = () => {
      w.focus();
      w.print();
      w.close();
    };
  };

  const handleShare = async () => {
    const text = items
      .map((item) => {
        const amount = item.amount ? `${item.amount} ` : "";
        const unit = item.unit ? `${item.unit} ` : "";
        return `${item.isChecked ? "☑" : "☐"} ${amount}${unit}${item.ingredient}`;
      })
      .join("\n");

    if (navigator.share) {
      await navigator.share({ text, title: "Grocery List" });
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    }
  };

  // No list generated yet
  if (!groceryList) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="rounded-sm bg-brand-100 border border-border-brand-subtle p-8 text-center max-w-md">
          <h3 className="text-lg font-semibold mb-2">
            Generate Your Grocery List
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Create a shopping list from your meal plan recipes
          </p>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            variant="brand"
            className="w-full"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Generate List
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Empty list
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="rounded-sm bg-brand-100 border border-border-brand-subtle p-8 text-center max-w-md">
          <h3 className="text-lg font-semibold mb-2">No Items Yet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Add recipes to your meal plan to generate a grocery list
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div id="print-root">
        {groceryList && items.length > 0 && (
          <PrintableGroceryList
            items={items}
            checkedCount={checkedCount}
            totalCount={totalCount}
          />
        )}
      </div>

      <div className="space-y-4">
        {/* Header with actions - Only show on desktop */}
        <div className="hidden lg:flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Grocery List</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {checkedCount} of {totalCount} items checked
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {groceryList.isStale && (
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                variant="outline"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Update List
                  </>
                )}
              </Button>
            )}

            {checkedCount > 0 && (
              <DeleteDialog
                title="Clear Checked Items"
                description={`Remove ${checkedCount} checked item${checkedCount > 1 ? "s" : ""} from your grocery list?`}
                onConfirm={handleClearChecked}
                disabled={isClearing}
                trigger={
                  <Button
                    variant="outline"
                    disabled={isClearing}
                    className="border-border-light cursor-pointer"
                  >
                    {isClearing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Clearing...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear Checked ({checkedCount})
                      </>
                    )}
                  </Button>
                }
              />
            )}

            <Button
              onClick={handlePrint}
              variant="outline"
              size="icon"
              className="hidden sm:inline-flex border-border-light"
            >
              <Download className="h-4 w-4" />
            </Button>

            <Button
              onClick={handleShare}
              variant="outline"
              size="icon"
              className="hidden sm:inline-flex border-border-light"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile actions row */}
        <div className="flex lg:hidden items-center justify-between gap-2">
          {groceryList.isStale && (
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              variant="outline"
              size="sm"
              className="border-brand text-brand hover:bg-brand/10"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                  Update
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-2" />
                  Update
                </>
              )}
            </Button>
          )}

          {checkedCount > 0 && (
            <DeleteDialog
              title="Clear Checked Items"
              description={`Remove ${checkedCount} checked item${checkedCount > 1 ? "s" : ""} from your grocery list?`}
              onConfirm={handleClearChecked}
              disabled={isClearing}
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isClearing}
                  className="ml-auto cursor-pointer"
                >
                  {isClearing ? (
                    <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3 mr-2" />
                  )}
                  Clear ({checkedCount})
                </Button>
              }
            />
          )}
        </div>

        <div className="lg:hidden">
          <div>
            <h2 className="text-2xl font-semibold">Grocery List</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {checkedCount} of {totalCount} items checked
            </p>
          </div>
        </div>

        {/* Add manual item */}
        <div className="rounded-sm bg-brand-100 border border-border-brand-subtle p-3">
          <div className="flex gap-2">
            <IngredientAutocomplete
              value={newItemName}
              onChange={setNewItemName}
              onSubmit={handleAddManualItem}
              placeholder="Add custom item..."
              disabled={isPending}
            />
            <Button
              onClick={handleAddManualItem}
              disabled={!newItemName.trim() || isPending}
              variant="brand"
              size="icon"
              className="shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-2">
          {sortedCategories.map((category) => (
            <GroceryCategory
              key={category}
              category={category}
              label={CATEGORY_LABELS[category]}
              items={itemsByCategory[category]}
            />
          ))}
        </div>
      </div>
    </>
  );
}
