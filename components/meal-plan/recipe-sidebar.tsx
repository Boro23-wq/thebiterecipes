"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Search, Clock, Users, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Recipe } from "@/app/dashboard/meal-plan/types";
import QuickAddDialog from "./quick-add-dialog";

export default function RecipeSidebar({
  recipes,
  weekDays,
  mealPlanId,
}: {
  recipes: Recipe[];
  weekDays: Date[];
  mealPlanId: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [quickAddRecipeId, setQuickAddRecipeId] = useState<string | null>(null);

  // fade state
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(false);

  const filteredRecipes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter((r) => r.title.toLowerCase().includes(q));
  }, [recipes, searchQuery]);

  function setSmallDragPreview(e: React.DragEvent, title: string) {
    const ghost = document.createElement("div");
    ghost.style.position = "fixed";
    ghost.style.top = "-1000px";
    ghost.style.left = "-1000px";
    ghost.style.width = "200px";
    ghost.style.padding = "10px 12px";
    ghost.style.borderRadius = "2px";
    ghost.style.background = "rgba(255, 255, 255, 0.92)";
    ghost.style.border = "1px solid rgba(255, 107, 53, 0.25)";
    ghost.style.boxShadow = "0 8px 24px rgba(0,0,0,0.06)";
    ghost.style.fontSize = "12px";
    ghost.style.fontWeight = "600";
    ghost.style.color = "#111827";
    ghost.style.whiteSpace = "nowrap";
    ghost.style.overflow = "hidden";
    ghost.style.textOverflow = "ellipsis";
    ghost.innerText = title;

    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 18, 16);

    window.setTimeout(() => {
      document.body.removeChild(ghost);
    }, 0);
  }

  function handleScroll() {
    const el = scrollerRef.current;
    if (!el) return;

    const top = el.scrollTop <= 0;
    const bottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;

    setAtTop(top);
    setAtBottom(bottom);
  }

  const fadeClass = atTop
    ? "scroll-fade-bottom"
    : atBottom
      ? "scroll-fade-top"
      : "scroll-fade-y";

  return (
    <aside
      className={[
        "relative overflow-hidden",
        "h-full min-h-0 lg:max-h-[calc(100vh-140px)]",
        "flex flex-col",
        "rounded-sm",
        "bg-brand-100",
        "border border-border-brand-subtle",
      ].join(" ")}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Recipes</h2>
            <p className="text-[11px] text-text-secondary mt-0.5">
              Drag a recipe onto a meal, or click{" "}
              <span className="font-medium">Add</span>
            </p>
          </div>

          <div className="text-[11px] text-text-secondary mt-1">
            {filteredRecipes.length}
          </div>
        </div>

        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
          <Input
            placeholder="Search recipes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={[
              "pl-9 rounded-sm",
              "bg-white/70",
              "border border-border-light",
              "focus:border-brand focus:ring-brand",
            ].join(" ")}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 px-3 pb-3">
        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          className={[
            "h-full overflow-y-auto pr-1",
            "scrollbar-bite",
            fadeClass,
          ].join(" ")}
        >
          {filteredRecipes.length === 0 ? (
            <div className="rounded-sm bg-brand-50 border border-border-light border-dashed ml-1 p-6 text-center">
              <p className="text-sm text-text-secondary">No recipes found</p>
            </div>
          ) : (
            <div className="space-y-2.5 pb-2">
              {filteredRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("recipeId", recipe.id);
                    e.dataTransfer.setData("text/plain", recipe.id);
                    e.dataTransfer.effectAllowed = "copy";
                    setSmallDragPreview(e, recipe.title);
                  }}
                  className={[
                    "group",
                    "rounded-sm overflow-hidden",
                    "bg-white/65 hover:bg-white/80 transition",
                    "cursor-grab active:cursor-grabbing",
                  ].join(" ")}
                >
                  {/* Media (ONLY when image exists) */}
                  {recipe.imageUrl ? (
                    <div className="relative h-28 bg-white/40">
                      <Image
                        src={recipe.imageUrl}
                        alt={recipe.title}
                        fill
                        className="object-cover"
                      />

                      <button
                        type="button"
                        onClick={() => setQuickAddRecipeId(recipe.id)}
                        className={[
                          "absolute top-2 right-2",
                          "inline-flex items-center gap-1",
                          "rounded-sm px-2 py-1",
                          "bg-[#FF6B35] text-white",
                          "text-[11px] font-semibold",
                          "cursor-pointer",
                          "transition-opacity",
                          "opacity-100 lg:opacity-0 lg:group-hover:opacity-100",
                        ].join(" ")}
                      >
                        <Plus className="h-3 w-3" />
                        Add
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end p-2">
                      <button
                        type="button"
                        onClick={() => setQuickAddRecipeId(recipe.id)}
                        className={[
                          "inline-flex items-center gap-1",
                          "rounded-sm px-2 py-1",
                          "bg-[#FF6B35] text-white",
                          "text-[11px] font-semibold",
                          "cursor-pointer",
                          "transition-opacity",
                          "opacity-100 lg:opacity-0 lg:group-hover:opacity-100",
                        ].join(" ")}
                      >
                        <Plus className="h-3 w-3" />
                        Add
                      </button>
                    </div>
                  )}

                  {/* Body */}
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-sm line-clamp-1 leading-snug text-text-primary break-all">
                        {recipe.title}
                      </p>

                      {/* <button
                        type="button"
                        onClick={() => setQuickAddRecipeId(recipe.id)}
                        className={[
                          "md:hidden",
                          "shrink-0 inline-flex items-center gap-1",
                          "rounded-sm px-2 py-1",
                          "bg-[#FF6B35] text-white",
                          "text-[11px] font-semibold",
                          "cursor-pointer",
                        ].join(" ")}
                      >
                        <Plus className="h-3 w-3" />
                        Add
                      </button> */}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-text-secondary">
                      {recipe.totalTime ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {recipe.totalTime}m
                        </span>
                      ) : null}
                      {recipe.servings ? (
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {recipe.servings}
                        </span>
                      ) : null}
                      {recipe.cuisine ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B35]/50" />
                          <p className="text-xs line-clamp-1 leading-snug text-text-secondary break-all">
                            {recipe.cuisine}
                          </p>
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <QuickAddDialog
        open={!!quickAddRecipeId}
        onOpenChange={(v) => {
          if (!v) setQuickAddRecipeId(null);
        }}
        recipeId={quickAddRecipeId}
        mealPlanId={mealPlanId}
        weekDays={weekDays}
      />
    </aside>
  );
}
