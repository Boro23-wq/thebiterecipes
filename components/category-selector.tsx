"use client";

import { useState, useTransition } from "react";
import { FolderPlus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  addRecipeToCategory,
  removeRecipeFromCategory,
} from "@/app/dashboard/categories/actions";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  isSelected: boolean;
}

interface CategorySelectorProps {
  recipeId: string;
  categories: Category[];
}

export function CategorySelector({
  recipeId,
  categories,
}: CategorySelectorProps) {
  const [isPending, startTransition] = useTransition();
  const [localCategories, setLocalCategories] = useState(categories);

  const handleToggle = (categoryId: string, isSelected: boolean) => {
    // Optimistic update
    setLocalCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId ? { ...cat, isSelected: !isSelected } : cat,
      ),
    );

    startTransition(async () => {
      try {
        if (isSelected) {
          await removeRecipeFromCategory(recipeId, categoryId);
        } else {
          await addRecipeToCategory(recipeId, categoryId);
        }
      } catch (error) {
        // Revert on error
        setLocalCategories(categories);
        alert(
          error instanceof Error ? error.message : "Failed to update category",
        );
      }
    });
  };

  const selectedCount = localCategories.filter((c) => c.isSelected).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          className="cursor-pointer"
        >
          <FolderPlus className="h-4 w-4" />
          {selectedCount > 0
            ? `In ${selectedCount} ${selectedCount === 1 ? "category" : "categories"}`
            : "Add to Category"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 border-none shadow-menu rounded-sm"
      >
        <DropdownMenuLabel className="text-sm text-text-primary">
          Add to Categories
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border-light" />
        {localCategories.length === 0 ? (
          <div className="px-2 py-6 text-center">
            <p className="text-sm text-text-muted mb-3">No categories yet</p>
            <Button
              variant="brand-light"
              size="sm"
              asChild
              className="cursor-pointer"
            >
              <Link href="/dashboard/categories/new">Create Category</Link>
            </Button>
          </div>
        ) : (
          localCategories.map((category) => (
            <DropdownMenuCheckboxItem
              key={category.id}
              checked={category.isSelected}
              onCheckedChange={() =>
                handleToggle(category.id, category.isSelected)
              }
              className={cn("cursor-pointer")}
              disabled={isPending}
            >
              <span className="flex-1">{category.name}</span>
            </DropdownMenuCheckboxItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
