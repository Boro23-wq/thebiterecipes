"use client";

import {
  ChevronDown,
  ChevronUp,
  CheckCheck,
  X,
  GripVertical,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import GroceryItem from "./grocery-item";
import { Button } from "@/components/ui/button";
import {
  toggleCategoryItems,
  reorderGroceryItems,
} from "@/app/dashboard/meal-plan/actions";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

function SortableItem({ item }: { item: GroceryItemType }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          {...attributes}
          {...listeners}
          className="p-1 hover:bg-brand-200 rounded cursor-grab active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
      <div className="pl-8">
        <GroceryItem item={item} />
      </div>
    </div>
  );
}

export default function GroceryCategory({
  category,
  label,
  items,
}: GroceryCategoryProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isExpanded, setIsExpanded] = useState(true);
  const [localItems, setLocalItems] = useState(items);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Update local items when props change
  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const uncheckedItems = localItems.filter((i) => !i.isChecked);
  const checkedItems = localItems.filter((i) => i.isChecked);
  const sortedItems = [...uncheckedItems, ...checkedItems];

  const allChecked = items.length > 0 && items.every((i) => i.isChecked);

  const handleToggleAll = async () => {
    if (items.length === 0) return;

    const groceryListId = items[0].groceryListId;
    const shouldCheck = !allChecked;

    try {
      await toggleCategoryItems({
        groceryListId,
        category,
        checked: shouldCheck,
      });
      toast.success(
        shouldCheck
          ? `Checked all ${label.toLowerCase()}`
          : `Unchecked all ${label.toLowerCase()}`,
      );
      startTransition(() => router.refresh());
    } catch (error) {
      toast.error("Failed to update items");
      console.error(error);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sortedItems.findIndex((item) => item.id === active.id);
    const newIndex = sortedItems.findIndex((item) => item.id === over.id);

    const reordered = arrayMove(sortedItems, oldIndex, newIndex);
    setLocalItems(reordered);

    const itemUpdates = reordered.map((item, index) => ({
      id: item.id,
      order: index,
    }));

    try {
      await reorderGroceryItems({
        groceryListId: items[0].groceryListId,
        itemUpdates,
      });
      startTransition(() => router.refresh());
    } catch (error) {
      toast.error("Failed to reorder items");
      console.error(error);
      // Revert on error
      setLocalItems(sortedItems);
    }
  };

  return (
    <div className="rounded-sm bg-white border border-border-brand-subtle overflow-hidden">
      <div className="w-full px-4 py-3 flex items-center justify-between bg-brand-100 hover:bg-brand-200 transition">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-3 flex-1 cursor-pointer"
        >
          <h3 className="text-sm font-semibold text-text-primary">{label}</h3>
          <span className="text-xs text-muted-foreground">
            {uncheckedItems.length}/{items.length}
          </span>
        </button>

        {/* Right side - actions */}
        <div className="flex items-center gap-1">
          {/* Check/Uncheck all button */}
          <Button
            onClick={handleToggleAll}
            disabled={isPending || items.length === 0}
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:bg-brand-300 hover:text-brand"
            title={allChecked ? "Uncheck all" : "Check all"}
          >
            {allChecked ? (
              <X className="h-4 w-4" />
            ) : (
              <CheckCheck className="h-4 w-4" />
            )}
          </Button>

          {/* Expand/collapse button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-7 w-7 hover:bg-brand-300 hover:text-brand"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Items with drag and drop */}
      {isExpanded && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedItems.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="divide-y divide-border-brand-light">
              {sortedItems.map((item) => (
                <div key={item.id} className="group">
                  <SortableItem item={item} />
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
