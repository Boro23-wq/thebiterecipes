"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import PantryItemRow from "./pantry-item-row";

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

interface PantryCategoryProps {
  category: string;
  label: string;
  items: PantryItemType[];
}

export default function PantryCategory({
  //   category,
  label,
  items,
}: PantryCategoryProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="rounded-sm bg-white border border-border-brand-subtle overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-brand-100 hover:bg-brand-200 transition cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-text-primary">{label}</h3>
          <span className="text-xs text-muted-foreground">
            {items.length} item{items.length !== 1 ? "s" : ""}
          </span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 hover:bg-brand-300 hover:text-brand"
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </button>

      {isExpanded && (
        <div className="divide-y divide-border-brand-light">
          {items.map((item) => (
            <PantryItemRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
