"use client";

import { useState, useTransition } from "react";
import { FolderPlus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
        setLocalCategories(categories);
        console.error("Failed to update category:", error);
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="brand-light"
          size="sm"
          disabled={isPending}
          className="cursor-pointer"
        >
          <FolderPlus className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-56 rounded-sm border-none shadow-menu"
      >
        <DropdownMenuLabel className="text-sm text-text-primary">
          Categories
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
            <DropdownMenuItem
              key={category.id}
              onSelect={(e) => {
                e.preventDefault();
                handleToggle(category.id, category.isSelected);
              }}
              disabled={isPending}
              className="cursor-pointer flex items-center gap-2"
            >
              {/* Left icon space */}
              <div className="w-4 flex items-center justify-center ">
                {category.isSelected && (
                  <Check className="h-4 w-4 hover:text-white" />
                )}
              </div>

              <span className="flex-1">{category.name}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
