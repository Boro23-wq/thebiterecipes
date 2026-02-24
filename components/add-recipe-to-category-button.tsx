"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  addRecipeToCategory,
  removeRecipeFromCategory,
} from "@/app/dashboard/categories/actions";
import { Plus, X, Search, Clock, Users, ChefHat } from "lucide-react";
import Image from "next/image";

type Recipe = {
  id: string;
  title: string;
  imageUrl?: string | null;
  totalTime?: number | null;
  servings?: number | null;
};

export default function AddRecipeToCategoryButton({
  categoryId,
  categoryName,
  recipes,
  existingRecipeIds = [],
}: {
  categoryId: string;
  categoryName?: string;
  recipes: Recipe[];
  existingRecipeIds?: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [pending, startTransition] = useTransition();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const existingSet = useMemo(
    () => new Set(existingRecipeIds),
    [existingRecipeIds],
  );

  const { existing, available } = useMemo(() => {
    const q = search.toLowerCase().trim();
    const matchesSearch = (r: Recipe) =>
      !q || r.title.toLowerCase().includes(q);

    return {
      existing: recipes.filter(
        (r) => existingSet.has(r.id) && matchesSearch(r),
      ),
      available: recipes.filter(
        (r) => !existingSet.has(r.id) && matchesSearch(r),
      ),
    };
  }, [recipes, search, existingSet]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function onAdd() {
    if (selectedIds.size === 0) return;
    await Promise.all(
      [...selectedIds].map((id) => addRecipeToCategory(id, categoryId)),
    );
    setOpen(false);
    setSelectedIds(new Set());
    setSearch("");
    startTransition(() => router.refresh());
  }

  async function onRemove(recipeId: string) {
    setRemovingId(recipeId);
    try {
      await removeRecipeFromCategory(recipeId, categoryId);
      startTransition(() => router.refresh());
    } finally {
      setRemovingId(null);
    }
  }

  function onOpenChange(v: boolean) {
    setOpen(v);
    if (!v) {
      setSelectedIds(new Set());
      setSearch("");
    }
  }

  function RecipeRow({
    recipe,
    mode,
  }: {
    recipe: Recipe;
    mode: "existing" | "available";
  }) {
    const isExisting = mode === "existing";
    const selected = selectedIds.has(recipe.id);
    const isRemoving = removingId === recipe.id;

    return (
      <div
        className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-sm transition ${
          isExisting
            ? "bg-brand-50"
            : selected
              ? "bg-brand-100 cursor-pointer"
              : "hover:bg-muted/40 cursor-pointer"
        }`}
        onClick={() => !isExisting && toggleSelect(recipe.id)}
        role={isExisting ? undefined : "button"}
        tabIndex={isExisting ? undefined : 0}
        onKeyDown={(e) => {
          if (!isExisting && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            toggleSelect(recipe.id);
          }
        }}
      >
        {/* Thumbnail */}
        <div className="h-10 w-10 shrink-0 rounded-sm overflow-hidden bg-brand-100 flex items-center justify-center">
          {recipe.imageUrl ? (
            <Image
              src={recipe.imageUrl}
              alt={recipe.title}
              width={40}
              height={40}
              className="h-full w-full object-cover"
            />
          ) : (
            <ChefHat className="h-4 w-4 text-brand/30" />
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate text-text-primary">
            {recipe.title}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-text-muted">
            {recipe.totalTime != null && recipe.totalTime > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {recipe.totalTime}m
              </span>
            )}
            {recipe.servings != null && recipe.servings > 0 && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {recipe.servings}
              </span>
            )}
          </div>
        </div>

        {/* Action */}
        {isExisting ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(recipe.id);
            }}
            disabled={isRemoving}
            className="shrink-0 h-7 w-7 p-0 text-text-muted hover:text-red-600 hover:bg-red-50 cursor-pointer"
            aria-label={`Remove ${recipe.title}`}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <span
            className={`shrink-0 rounded-sm px-3 py-1 text-xs font-semibold transition ${
              selected ? "bg-brand-200 text-brand" : "bg-brand text-white"
            }`}
          >
            {selected ? "Selected" : "Add"}
          </span>
        )}
      </div>
    );
  }

  return (
    <>
      <Button
        variant="brand"
        className="cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-4 w-4" />
        Add Recipe
      </Button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="sm:max-w-md overflow-hidden [&>button]:hidden"
          style={{
            maxHeight: "70vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <DialogHeader className="flex flex-row items-center justify-between space-y-0">
            <DialogTitle className="text-base font-semibold">
              {categoryName ? `Manage ${categoryName}` : "Manage Recipes"}
            </DialogTitle>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="sm"
                className="cursor-pointer -mr-2"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </DialogHeader>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input
              placeholder="Search recipes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-sm"
            />
          </div>

          {/* Recipe list */}
          <div
            className="overflow-y-auto scrollbar-bite -mx-1 px-1 space-y-1"
            style={{ minHeight: 0 }}
          >
            {/* Existing recipes in category */}
            {existing.length > 0 && (
              <div>
                <p className="text-xs font-medium text-text-muted px-2 py-1.5">
                  In this category ({existing.length})
                </p>
                {existing.map((r) => (
                  <RecipeRow key={r.id} recipe={r} mode="existing" />
                ))}
              </div>
            )}

            {/* Available recipes */}
            {available.length > 0 && (
              <div>
                {existing.length > 0 && <div className="my-2" />}
                <p className="text-xs font-medium text-text-muted px-2 py-1.5">
                  Available recipes ({available.length})
                </p>
                {available.map((r) => (
                  <RecipeRow key={r.id} recipe={r} mode="available" />
                ))}
              </div>
            )}

            {existing.length === 0 && available.length === 0 && (
              <div className="rounded-sm border border-dashed border-border-light p-4 text-sm text-text-secondary text-center">
                No recipes found
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 pt-2">
            <span className="text-xs text-text-muted text-center sm:text-left">
              {selectedIds.size > 0
                ? `${selectedIds.size} selected to add`
                : "Select recipes to add"}
            </span>
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={pending}
                className="rounded-sm w-full sm:w-auto cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={onAdd}
                disabled={selectedIds.size === 0 || pending}
                className="rounded-sm bg-brand hover:bg-brand/90 text-white w-full sm:w-auto cursor-pointer"
              >
                {pending
                  ? "Adding..."
                  : selectedIds.size > 1
                    ? `Add (${selectedIds.size})`
                    : "Add"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
