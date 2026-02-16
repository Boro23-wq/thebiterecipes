// components/meal-plan/grocery-list/grocery-category.tsx
"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import GroceryItem from "./grocery-item";

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

interface GroceryCategoryProps {
  category: string;
  label: string;
  items: GroceryItemType[];
}

export default function GroceryCategory({
  category,
  label,
  items,
}: GroceryCategoryProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const uncheckedItems = items.filter((i) => !i.isChecked);
  const checkedItems = items.filter((i) => i.isChecked);
  const sortedItems = [...uncheckedItems, ...checkedItems];

  return (
    <div className="rounded-sm bg-white border border-border-brand-subtle overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-brand-100 hover:bg-brand-200 transition cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-text-primary">{label}</h3>
          <span className="text-xs text-muted-foreground">
            {uncheckedItems.length}/{items.length}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Items */}
      {isExpanded && (
        <div className="divide-y divide-border-brand-light">
          {sortedItems.map((item) => (
            <GroceryItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
