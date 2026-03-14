"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, ChefHat, AlertTriangle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { text } from "@/lib/design-tokens";
import {
  addPantryItem,
  deletePantryItemsBatch,
} from "@/app/dashboard/pantry/actions";
import PantryItemAutocomplete from "./pantry-item-autocomplete";
import PantryVoiceInput from "./pantry-voice-input";
import PantryCategory from "./pantry-category";
import WhatCanICook from "./what-can-i-cook";

type PantryItemType = {
  id: string;
  userId: string;
  name: string;
  category: string;
  amount: string | null;
  unit: string | null;
  expirationDate: Date | null;
  isExpired: boolean;
  source: string;
  groceryItemId: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

interface PantryViewProps {
  initialItems: PantryItemType[];
  expiringItems: PantryItemType[];
}

const CATEGORY_ORDER = [
  "produce",
  "meat",
  "dairy",
  "pantry",
  "frozen",
  "other",
];
const CATEGORY_LABELS: Record<string, string> = {
  produce: "Produce",
  meat: "Meat & Seafood",
  dairy: "Dairy & Eggs",
  pantry: "Pantry Staples",
  frozen: "Frozen",
  other: "Other",
};

export default function PantryView({
  initialItems,
  expiringItems,
}: PantryViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newItemName, setNewItemName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCookSuggestions, setShowCookSuggestions] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const items = initialItems;

  // Filter by search
  const filteredItems = searchQuery
    ? items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : items;

  // Group by category
  const itemsByCategory = filteredItems.reduce(
    (acc, item) => {
      const category = item.category || "other";
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    },
    {} as Record<string, PantryItemType[]>,
  );

  const sortedCategories = CATEGORY_ORDER.filter(
    (cat) => itemsByCategory[cat]?.length > 0,
  );

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;

    try {
      await addPantryItem({ name: newItemName.trim(), source: "manual" });
      setNewItemName("");
      toast.success("Added to pantry");
      startTransition(() => router.refresh());
    } catch (error) {
      toast.error("Failed to add item");
      console.error(error);
    }
  };

  const handleVoiceItems = async (
    parsedItems: Array<{ name: string; amount?: string; unit?: string }>,
  ) => {
    // Items are already added by the voice input component
    startTransition(() => router.refresh());
  };

  const handleClearExpired = async () => {
    const expiredIds = items.filter((i) => i.isExpired).map((i) => i.id);
    if (expiredIds.length === 0) return;

    setIsClearing(true);
    try {
      await deletePantryItemsBatch(expiredIds);
      toast.success(`Removed ${expiredIds.length} expired items`);
      startTransition(() => router.refresh());
    } catch (error) {
      toast.error("Failed to clear expired items");
      console.error(error);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Expiring Soon Banner */}
      {expiringItems.length > 0 && (
        <div className="rounded-sm bg-amber-50 border border-amber-200 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-amber-800">
                {expiringItems.length} item{expiringItems.length > 1 ? "s" : ""}{" "}
                expiring soon
              </h3>
              <p className="text-xs text-amber-700 mt-0.5">
                {expiringItems
                  .slice(0, 3)
                  .map((i) => i.name)
                  .join(", ")}
                {expiringItems.length > 3 &&
                  ` +${expiringItems.length - 3} more`}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCookSuggestions(true)}
              className="shrink-0 border-amber-300 text-amber-800 hover:bg-amber-100"
            >
              <ChefHat className="h-4 w-4 mr-1" />
              Use them up
            </Button>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Add Item */}
        <div className="flex-1 rounded-sm bg-brand-100 border border-border-brand-subtle p-3">
          <div className="flex gap-2">
            <PantryItemAutocomplete
              value={newItemName}
              onChange={setNewItemName}
              onSubmit={handleAddItem}
              placeholder="Add item to pantry..."
              disabled={isPending}
            />
            <Button
              onClick={handleAddItem}
              disabled={!newItemName.trim() || isPending}
              variant="brand"
              size="icon"
              className="shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <PantryVoiceInput onItemsParsed={handleVoiceItems} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="brand"
            size="sm"
            onClick={() => setShowCookSuggestions(true)}
            className="whitespace-nowrap"
          >
            <ChefHat className="h-4 w-4" />
            What can I cook?
          </Button>
        </div>
      </div>

      {/* Search */}
      {items.length > 5 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pantry..."
            className="pl-9 bg-white border-border-light"
          />
        </div>
      )}

      {/* Categories */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border-light rounded-sm">
          <div className="rounded-sm bg-brand-100 p-2.5 mb-3">
            <Package className="h-5 w-5 text-brand" />
          </div>
          <h3 className={cn(text.body, "font-semibold mb-0.5")}>
            Your pantry is empty
          </h3>
          <p className={cn(text.small, "mb-3 max-w-sm")}>
            Add items manually, use voice input, or check off grocery list items
            to auto-populate your pantry.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedCategories.map((category) => (
            <PantryCategory
              key={category}
              category={category}
              label={CATEGORY_LABELS[category]}
              items={itemsByCategory[category]}
            />
          ))}

          {searchQuery && sortedCategories.length === 0 && (
            <p className={cn(text.muted, "text-center py-8")}>
              No items match &quot;{searchQuery}&quot;
            </p>
          )}
        </div>
      )}

      {/* What Can I Cook Modal */}
      {showCookSuggestions && (
        <WhatCanICook onClose={() => setShowCookSuggestions(false)} />
      )}
    </div>
  );
}

// Re-export for the empty state icon
function Package(
  props: React.SVGProps<SVGSVGElement> & { className?: string },
) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}
