"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Edit2, Check, X, Calendar, ShoppingCart } from "lucide-react";
import {
  deletePantryItem,
  updatePantryItem,
} from "@/app/dashboard/pantry/actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

interface PantryItemRowProps {
  item: PantryItemType;
}

export default function PantryItemRow({ item }: PantryItemRowProps) {
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

  const isExpiringSoon =
    item.expirationDate &&
    !item.isExpired &&
    (() => {
      const now = new Date();
      const expDate = new Date(item.expirationDate!);
      const daysLeft = Math.ceil(
        (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      return daysLeft <= 3;
    })();

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
    } catch (error) {
      toast.error("Failed to delete item");
      console.error(error);
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
    } catch (error) {
      toast.error("Failed to update");
      console.error(error);
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
        "group px-4 py-3 flex items-start gap-3 hover:bg-muted/20 transition",
        item.isExpired && "opacity-50",
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-tight line-clamp-2 wrap-break-word">
            {item.amount && (
              <span className="text-brand mr-1 font-semibold">
                {item.amount}
                {item.unit ? ` ${item.unit}` : ""}
              </span>
            )}
            {item.name}
          </p>

          <div className="flex items-center gap-1 shrink-0">
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

        {/* Badges */}
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          {/* Expiration badge */}
          {daysUntilExpiry !== null && (
            <span
              className={cn(
                "inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-sm",
                daysUntilExpiry <= 0
                  ? "bg-red-100 text-red-700"
                  : daysUntilExpiry <= 3
                    ? "bg-amber-100 text-amber-700"
                    : "bg-brand-100 text-brand",
              )}
            >
              <Calendar className="h-2.5 w-2.5 mr-1" />
              {daysUntilExpiry <= 0
                ? "Expired"
                : daysUntilExpiry === 1
                  ? "Expires tomorrow"
                  : `${daysUntilExpiry} days left`}
            </span>
          )}

          {/* Source badge */}
          {item.source === "grocery" && (
            <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-sm bg-emerald-100 text-emerald-700">
              <ShoppingCart className="h-2.5 w-2.5 mr-1" />
              From grocery list
            </span>
          )}

          {item.source === "voice" && (
            <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-sm bg-blue-100 text-blue-700">
              Voice added
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
