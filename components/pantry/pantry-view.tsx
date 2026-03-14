"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Plus,
  ChefHat,
  AlertTriangle,
  Search,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  Check,
  X,
  Calendar,
  ShoppingCart,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { text } from "@/lib/design-tokens";
import {
  addPantryItem,
  deletePantryItem,
  updatePantryItem,
  deletePantryItemsBatch,
} from "@/app/dashboard/pantry/actions";
import PantryItemAutocomplete from "./pantry-item-autocomplete";
import PantryVoiceInput from "./pantry-voice-input";
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

interface PantryViewUnifiedProps {
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

// ─── Inline Item Row ─────────────────────────────────────────────────────────

function UnifiedItemRow({ item }: { item: PantryItemType }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [editAmount, setEditAmount] = useState(item.amount || "");
  const [editExpiration, setEditExpiration] = useState(
    item.expirationDate
      ? new Date(item.expirationDate).toISOString().split("T")[0]
      : "",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const daysUntilExpiry = item.expirationDate
    ? Math.ceil(
        (new Date(item.expirationDate).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deletePantryItem(item.id);
      toast.success(`Removed ${item.name}`);
      startTransition(() => router.refresh());
    } catch {
      toast.error("Failed to delete item");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setIsSaving(true);
    try {
      await updatePantryItem({
        id: item.id,
        name: editName.trim(),
        amount: editAmount.trim() || undefined,
        expirationDate: editExpiration ? new Date(editExpiration) : null,
      });
      toast.success("Updated");
      setIsEditing(false);
      startTransition(() => router.refresh());
    } catch {
      toast.error("Failed to update");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName(item.name);
    setEditAmount(item.amount || "");
    setEditExpiration(
      item.expirationDate
        ? new Date(item.expirationDate).toISOString().split("T")[0]
        : "",
    );
  };

  if (isEditing) {
    return (
      <div className="px-4 py-3 space-y-2 bg-brand-50/50">
        <div className="flex items-center gap-2">
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="h-8 text-sm rounded-sm border-border-light flex-1"
            placeholder="Item name"
            autoFocus
            disabled={isSaving}
          />
          <Input
            value={editAmount}
            onChange={(e) => setEditAmount(e.target.value)}
            className="h-8 w-24 text-sm rounded-sm border-border-light"
            placeholder="Amount"
            disabled={isSaving}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="date"
              value={editExpiration}
              onChange={(e) => setEditExpiration(e.target.value)}
              className="h-8 w-40 text-sm rounded-sm border-border-light"
              disabled={isSaving}
            />
          </div>
          <div className="flex items-center gap-1">
            <Button
              onClick={handleSaveEdit}
              disabled={isSaving}
              size="icon"
              className="h-7 w-7 bg-white hover:bg-green-50"
            >
              <Check className="h-3.5 w-3.5 text-green-600" />
            </Button>
            <Button
              onClick={handleCancelEdit}
              disabled={isSaving}
              size="icon"
              className="h-7 w-7 bg-white hover:bg-red-50"
            >
              <X className="h-3.5 w-3.5 text-red-600" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group px-4 py-2.5 flex items-center justify-between hover:bg-muted/20 transition",
        item.isExpired && "opacity-50",
      )}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <p className="text-sm leading-tight truncate">
          {item.amount && (
            <span className="text-brand mr-1 font-semibold">
              {item.amount}
              {item.unit ? ` ${item.unit}` : ""}
            </span>
          )}
          {item.name}
        </p>

        {/* Inline badges */}
        {daysUntilExpiry !== null && (
          <span
            className={cn(
              "inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-sm shrink-0",
              daysUntilExpiry <= 0
                ? "bg-red-100 text-red-700"
                : daysUntilExpiry <= 3
                  ? "bg-amber-100 text-amber-700"
                  : "bg-brand-100 text-brand",
            )}
          >
            {daysUntilExpiry <= 0
              ? "Expired"
              : daysUntilExpiry === 1
                ? "1d"
                : `${daysUntilExpiry}d`}
          </span>
        )}

        {item.source === "grocery" && (
          <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-sm bg-emerald-100 text-emerald-700 shrink-0">
            <ShoppingCart className="h-2.5 w-2.5 mr-0.5" />
            Grocery
          </span>
        )}
      </div>

      <div className="flex items-center gap-0.5 shrink-0">
        <Button
          onClick={() => setIsEditing(true)}
          variant="text"
          size="icon-xs"
          className="h-7 w-7 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          onClick={handleDelete}
          disabled={isDeleting || isPending}
          variant="ghost"
          size="icon-xs"
          className="h-7 w-7 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Inline Category Section ─────────────────────────────────────────────────

function UnifiedCategory({
  label,
  items,
  isLast,
}: {
  label: string;
  items: PantryItemType[];
  isLast: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className={cn(!isLast && "border-b border-border-light")}>
      {/* Category header — flat divider style */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2.5 flex items-center justify-between bg-brand-50 hover:bg-brand-200 transition cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-text-primary">
            {label}
          </span>
          <span className="text-[10px] text-brand bg-brand-300 px-1.5 py-0.5 rounded-sm">
            {items.length}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      {/* Items */}
      {isExpanded && (
        <div className="divide-y divide-border-light/50">
          {items.map((item) => (
            <UnifiedItemRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main View ───────────────────────────────────────────────────────────────

export default function PantryViewUnified({
  initialItems,
  expiringItems,
}: PantryViewUnifiedProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newItemName, setNewItemName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCookSuggestions, setShowCookSuggestions] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const items = initialItems;

  const filteredItems = searchQuery
    ? items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : items;

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
    } catch {
      toast.error("Failed to add item");
    }
  };

  const handleVoiceItems = async () => {
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
    } catch {
      toast.error("Failed to clear expired items");
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
                {expiringItems.length} item
                {expiringItems.length > 1 ? "s" : ""} expiring soon
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
        <div className="flex-1">
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

      {/* Unified Card: Search + Categories + Items */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border-light rounded-sm">
          <div className="rounded-sm bg-brand-100 p-2.5 mb-3">
            <PackageIcon className="h-5 w-5 text-brand" />
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
        <div className="rounded-sm border border-border-light overflow-hidden bg-white">
          {/* Pinned Search */}
          {items.length > 5 && (
            <div className="sticky top-0 z-10 bg-white border-b border-border-light px-3 py-2.5">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search pantry..."
                  className="pl-8 h-8 text-sm bg-[#FAFAF9] border-border-light rounded-sm"
                />
              </div>
            </div>
          )}

          {/* Category sections as flat dividers */}
          {sortedCategories.length > 0 ? (
            sortedCategories.map((category, idx) => (
              <UnifiedCategory
                key={category}
                label={CATEGORY_LABELS[category]}
                items={itemsByCategory[category]}
                isLast={idx === sortedCategories.length - 1}
              />
            ))
          ) : (
            <p className={cn(text.muted, "text-center py-8")}>
              No items match &quot;{searchQuery}&quot;
            </p>
          )}
        </div>
      )}

      <WhatCanICook
        open={showCookSuggestions}
        onOpenChange={setShowCookSuggestions}
      />
    </div>
  );
}

function PackageIcon(
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
