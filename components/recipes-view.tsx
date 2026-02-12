"use client";

import { useState, useMemo, useTransition } from "react";
import { RecipeCard } from "@/components/recipe-card";
import {
  RecipeCardSkeleton,
  CompactRecipeSkeleton,
} from "@/components/recipe-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loadMoreRecipes } from "@/app/dashboard/recipes/actions";
import {
  Plus,
  LayoutGrid,
  List,
  Clock,
  Users,
  Star,
  ImageIcon,
  Search,
  Filter,
  X,
  LinkIcon,
} from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import Image from "next/image";

type ViewMode = "grid" | "compact";

interface Recipe {
  id: string;
  title: string;
  imageUrl?: string | null;
  prepTime?: number | null;
  cookTime?: number | null;
  totalTime?: number | null;
  servings?: number | null;
  difficulty?: string | null;
  cuisine?: string | null;
  category?: string | null;
  calories?: number | null;
  isFavorite?: boolean | null;
  rating?: number | null;
  createdAt: Date;
}

interface RecipesViewProps {
  initialRecipes: Recipe[];
  totalCount: number;
}

export function RecipesView({ initialRecipes, totalCount }: RecipesViewProps) {
  const CONTROL_H = "h-10";
  const RECIPES_PER_PAGE = 24;

  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [isPending, startTransition] = useTransition();

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>(
    [],
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const hasMore = recipes.length < totalCount;

  const loadMore = () => {
    startTransition(async () => {
      const moreRecipes = await loadMoreRecipes(
        recipes.length,
        RECIPES_PER_PAGE,
      );
      setRecipes((prev) => [...prev, ...moreRecipes]);
    });
  };

  const cuisines = useMemo(
    () => [...new Set(recipes.map((r) => r.cuisine).filter(Boolean))],
    [recipes],
  );
  const difficulties = useMemo(
    () => [...new Set(recipes.map((r) => r.difficulty).filter(Boolean))],
    [recipes],
  );
  const categories = useMemo(
    () => [...new Set(recipes.map((r) => r.category).filter(Boolean))],
    [recipes],
  );

  const sortLabels: Record<string, string> = {
    recent: "Most Recent",
    title: "Alphabetical",
    rating: "Highest Rated",
    time: "Quickest",
  };

  const filteredRecipes = useMemo(() => {
    let filtered = recipes;

    if (searchQuery) {
      filtered = filtered.filter(
        (recipe) =>
          recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          recipe.cuisine?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          recipe.category?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    if (selectedCuisines.length > 0) {
      filtered = filtered.filter(
        (recipe) => recipe.cuisine && selectedCuisines.includes(recipe.cuisine),
      );
    }

    if (selectedDifficulties.length > 0) {
      filtered = filtered.filter(
        (recipe) =>
          recipe.difficulty && selectedDifficulties.includes(recipe.difficulty),
      );
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(
        (recipe) =>
          recipe.category && selectedCategories.includes(recipe.category),
      );
    }

    if (showFavoritesOnly) {
      filtered = filtered.filter((recipe) => recipe.isFavorite);
    }

    switch (sortBy) {
      case "recent":
        filtered.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
      case "title":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "rating":
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "time":
        filtered.sort((a, b) => (a.totalTime || 0) - (b.totalTime || 0));
        break;
    }

    return filtered;
  }, [
    recipes,
    searchQuery,
    sortBy,
    selectedCuisines,
    selectedDifficulties,
    selectedCategories,
    showFavoritesOnly,
  ]);

  const activeFiltersCount =
    selectedCuisines.length +
    selectedDifficulties.length +
    selectedCategories.length +
    (showFavoritesOnly ? 1 : 0);

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCuisines([]);
    setSelectedDifficulties([]);
    setSelectedCategories([]);
    setShowFavoritesOnly(false);
    setSortBy("recent");
  };

  const separatorCls = "mx-2 bg-border-light";

  const menuItemCls = cn(
    "!border-0 !shadow-none !outline-none ring-0 cursor-pointer",
    "text-text-primary",
    "data-[highlighted]:bg-brand-100",
    "data-[highlighted]:text-brand",
    "data-[state=checked]:text-brand",
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            My Recipes
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {filteredRecipes.length} of {recipes.length} recipe
            {recipes.length !== 1 ? "s" : ""}
            {activeFiltersCount > 0 &&
              ` (${activeFiltersCount} filter${activeFiltersCount > 1 ? "s" : ""} active)`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/recipes/import">
              <LinkIcon className="h-4 w-4" />
              Import from URL
            </Link>
          </Button>
          <Button asChild variant="brand">
            <Link href="/dashboard/recipes/new">
              <Plus className="h-4 w-4" />
              Add Recipe
            </Link>
          </Button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            placeholder="Search recipes, cuisines, categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "pl-10 pr-10 bg-white",
              "border border-border-light",
              "focus:border-brand focus:ring-brand",
              CONTROL_H,
            )}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchQuery("")}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-text-muted hover:text-text-primary cursor-pointer"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Sort */}
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger
            className={cn(
              "w-full md:w-55 cursor-pointer",
              "md:shrink-0",
              "h-10! py-0! px-3",
              "flex items-center justify-between",
              "border border-border-light bg-white",
              "hover:border-border-light hover:bg-white",
              "focus:border-brand focus:ring-brand",
            )}
          >
            <span className="truncate text-sm leading-none">
              {sortLabels[sortBy] ?? "Sort by"}
            </span>
          </SelectTrigger>

          <SelectContent
            side="bottom"
            align="start"
            sideOffset={6}
            position="popper"
            className="border border-border-light bg-white"
          >
            <SelectGroup>
              <SelectLabel className="text-xs text-text-muted">
                Sort by
              </SelectLabel>
              <SelectItem value="recent" className="cursor-pointer">
                Most Recent
              </SelectItem>
              <SelectItem value="title" className="cursor-pointer">
                Alphabetical
              </SelectItem>
              <SelectItem value="rating" className="cursor-pointer">
                Highest Rated
              </SelectItem>
              <SelectItem value="time" className="cursor-pointer">
                Quickest
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "relative",
                "border border-border-light",
                "cursor-pointer",
                CONTROL_H,
              )}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            side="bottom"
            sideOffset={8}
            className={cn(
              "w-80 bg-white",
              "border border-border-light",
              "p-2 shadow-dropdown",
              "min-h-55",
              "max-h-90 overflow-y-auto",
              "[scrollbar-width:thin] [scrollbar-color:rgba(0,0,0,0.18)_transparent]",
              "[&::-webkit-scrollbar]:w-2",
              "[&::-webkit-scrollbar-track]:bg-transparent",
              "[&::-webkit-scrollbar-thumb]:bg-black/15",
              "[&::-webkit-scrollbar-thumb]:rounded-full",
              "[&::-webkit-scrollbar-thumb]:border-[3px]",
              "[&::-webkit-scrollbar-thumb]:border-transparent",
              "[&::-webkit-scrollbar-thumb]:bg-clip-content",
            )}
          >
            <DropdownMenuLabel className="text-sm text-text-primary">
              Filter by
            </DropdownMenuLabel>
            <DropdownMenuSeparator className={separatorCls} />

            {/* Favorites */}
            <DropdownMenuCheckboxItem
              checked={showFavoritesOnly}
              onCheckedChange={setShowFavoritesOnly}
              className={cn(menuItemCls)}
            >
              <Star className="mr-2 h-4 w-4 fill-brand text-brand" />
              Favorites Only
            </DropdownMenuCheckboxItem>

            {cuisines.length > 0 && (
              <>
                <DropdownMenuSeparator className={separatorCls} />
                <DropdownMenuLabel className="text-xs text-text-muted px-2">
                  Cuisine
                </DropdownMenuLabel>
                {cuisines.map((cuisine) => (
                  <DropdownMenuCheckboxItem
                    key={cuisine}
                    checked={selectedCuisines.includes(cuisine as string)}
                    onCheckedChange={(checked) => {
                      setSelectedCuisines(
                        checked
                          ? [...selectedCuisines, cuisine as string]
                          : selectedCuisines.filter((c) => c !== cuisine),
                      );
                    }}
                    className={cn(menuItemCls)}
                  >
                    {cuisine}
                  </DropdownMenuCheckboxItem>
                ))}
              </>
            )}

            {difficulties.length > 0 && (
              <>
                <DropdownMenuSeparator className={separatorCls} />
                <DropdownMenuLabel className="text-xs text-text-muted px-2">
                  Difficulty
                </DropdownMenuLabel>
                {difficulties.map((difficulty) => (
                  <DropdownMenuCheckboxItem
                    key={difficulty}
                    checked={selectedDifficulties.includes(
                      difficulty as string,
                    )}
                    onCheckedChange={(checked) => {
                      setSelectedDifficulties(
                        checked
                          ? [...selectedDifficulties, difficulty as string]
                          : selectedDifficulties.filter(
                              (d) => d !== difficulty,
                            ),
                      );
                    }}
                    className={cn(menuItemCls, "capitalize")}
                  >
                    {difficulty}
                  </DropdownMenuCheckboxItem>
                ))}
              </>
            )}

            {categories.length > 0 && (
              <>
                <DropdownMenuSeparator className={separatorCls} />
                <DropdownMenuLabel className="text-xs text-text-muted px-2">
                  Category
                </DropdownMenuLabel>
                {categories.map((category) => (
                  <DropdownMenuCheckboxItem
                    key={category}
                    checked={selectedCategories.includes(category as string)}
                    onCheckedChange={(checked) => {
                      setSelectedCategories(
                        checked
                          ? [...selectedCategories, category as string]
                          : selectedCategories.filter((c) => c !== category),
                      );
                    }}
                    className={cn(menuItemCls)}
                  >
                    {category}
                  </DropdownMenuCheckboxItem>
                ))}
              </>
            )}

            {activeFiltersCount > 0 && (
              <>
                <DropdownMenuSeparator className={separatorCls} />
                <div className="p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="w-full text-brand hover:text-brand hover:bg-brand-100 cursor-pointer"
                  >
                    Clear all filters
                  </Button>
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-brand-50 rounded-sm p-1 gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode("grid")}
            className={cn(
              "h-8 w-8 p-0 rounded-sm transition-colors cursor-pointer",
              viewMode === "grid"
                ? "bg-brand text-white hover:bg-brand/90 hover:text-white"
                : "text-text-secondary hover:bg-brand-200 hover:text-text-primary",
            )}
            title="Grid View"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode("compact")}
            className={cn(
              "h-8 w-8 p-0 rounded-sm transition-colors cursor-pointer",
              viewMode === "compact"
                ? "bg-brand text-white hover:bg-brand/90 hover:text-white"
                : "text-text-secondary hover:bg-brand-200 hover:text-text-primary",
            )}
            title="Compact View"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Active Filters Pills */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {showFavoritesOnly && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-brand-100 text-brand text-xs rounded-sm border border-brand-border">
              <Star className="h-3 w-3 fill-brand" />
              Favorites
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowFavoritesOnly(false)}
                className="ml-1 h-4 w-4 p-0 hover:bg-transparent hover:text-text-primary cursor-pointer"
              >
                <X className="h-3 w-3" />
              </Button>
            </span>
          )}
          {selectedCuisines.map((cuisine) => (
            <span
              key={cuisine}
              className="inline-flex items-center gap-1 px-3 py-1 bg-brand-100 text-text-primary text-xs rounded-sm border border-brand-border"
            >
              {cuisine}
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setSelectedCuisines(
                    selectedCuisines.filter((c) => c !== cuisine),
                  )
                }
                className="ml-1 h-4 w-4 p-0 hover:bg-transparent hover:text-brand cursor-pointer"
              >
                <X className="h-3 w-3" />
              </Button>
            </span>
          ))}
          {selectedDifficulties.map((difficulty) => (
            <span
              key={difficulty}
              className="inline-flex items-center gap-1 px-3 py-1 bg-brand-100 text-text-primary text-xs rounded-sm border border-brand-border capitalize"
            >
              {difficulty}
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setSelectedDifficulties(
                    selectedDifficulties.filter((d) => d !== difficulty),
                  )
                }
                className="ml-1 h-4 w-4 p-0 hover:bg-transparent hover:text-brand cursor-pointer"
              >
                <X className="h-3 w-3" />
              </Button>
            </span>
          ))}
          {selectedCategories.map((category) => (
            <span
              key={category}
              className="inline-flex items-center gap-1 px-3 py-1 bg-brand-100 text-text-primary text-xs rounded-sm border border-brand-border"
            >
              {category}
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setSelectedCategories(
                    selectedCategories.filter((c) => c !== category),
                  )
                }
                className="ml-1 h-4 w-4 p-0 hover:bg-transparent hover:text-brand cursor-pointer"
              >
                <X className="h-3 w-3" />
              </Button>
            </span>
          ))}
          <Button
            variant="ghost"
            onClick={clearAllFilters}
            className="text-xs text-brand hover:text-text-primary font-medium h-auto p-0 hover:bg-transparent cursor-pointer"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Results */}
      {filteredRecipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border-light rounded-md">
          <Search className="h-12 w-12 text-brand/30 mb-4" />
          <h3 className="text-base font-semibold mb-1">No recipes found</h3>
          <p className="text-sm text-text-secondary mb-4">
            Try adjusting your search or filters
          </p>
          <Button
            onClick={clearAllFilters}
            variant="brand-light"
            className="cursor-pointer"
          >
            Clear all filters
          </Button>
        </div>
      ) : (
        <>
          {viewMode === "grid" && (
            <div>
              {Object.entries(
                filteredRecipes.reduce(
                  (groups, recipe) => {
                    const date = new Date(recipe.createdAt);
                    const today = new Date();
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);

                    let group;
                    if (date.toDateString() === today.toDateString()) {
                      group = "Today";
                    } else if (
                      date.toDateString() === yesterday.toDateString()
                    ) {
                      group = "Yesterday";
                    } else {
                      group = date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      });
                    }

                    if (!groups[group]) groups[group] = [];
                    groups[group].push(recipe);
                    return groups;
                  },
                  {} as Record<string, Recipe[]>,
                ),
              ).map(([group, recipes]) => (
                <div key={group} className="mb-8">
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
                    {group}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                    {recipes.map((recipe) => (
                      <RecipeCard key={recipe.id} {...recipe} />
                    ))}
                  </div>
                </div>
              ))}

              {/* Loading Skeletons for Grid */}
              {isPending && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr mt-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <RecipeCardSkeleton key={i} />
                  ))}
                </div>
              )}
            </div>
          )}

          {viewMode === "compact" && (
            <div>
              {Object.entries(
                filteredRecipes.reduce(
                  (groups, recipe) => {
                    const date = new Date(recipe.createdAt);
                    const today = new Date();
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);

                    let group;
                    if (date.toDateString() === today.toDateString()) {
                      group = "Today";
                    } else if (
                      date.toDateString() === yesterday.toDateString()
                    ) {
                      group = "Yesterday";
                    } else {
                      group = date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      });
                    }

                    if (!groups[group]) groups[group] = [];
                    groups[group].push(recipe);
                    return groups;
                  },
                  {} as Record<string, Recipe[]>,
                ),
              ).map(([group, recipes]) => (
                <div key={group} className="mb-8">
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
                    {group}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {recipes.map((recipe) => (
                      <Link
                        key={recipe.id}
                        href={`/dashboard/recipes/${recipe.id}`}
                        className="flex gap-2.5 bg-white rounded-sm p-2.5 hover:border-border-brand-subtle transition-colors border border-border-brand-light  cursor-pointer"
                      >
                        <div className="w-14 h-14 bg-brand-200 rounded-sm shrink-0 flex items-center justify-center overflow-hidden">
                          {recipe.imageUrl ? (
                            <Image
                              src={recipe.imageUrl}
                              alt={recipe.title}
                              width={56}
                              height={56}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-brand/30" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <h3 className="text-sm font-semibold text-text-primary truncate leading-tight">
                              {recipe.title}
                            </h3>
                            {recipe.isFavorite && (
                              <Star className="h-3.5 w-3.5 fill-brand text-brand shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-text-muted">
                            {recipe.totalTime && (
                              <span className="flex items-center gap-0.5">
                                <Clock className="h-3 w-3" />
                                {recipe.totalTime}m
                              </span>
                            )}
                            {recipe.servings && (
                              <span className="flex items-center gap-0.5">
                                <Users className="h-3 w-3" />
                                {recipe.servings}
                              </span>
                            )}
                          </div>
                          {recipe.rating && (
                            <div className="flex items-center gap-1 text-xs text-text-muted mt-0.5">
                              <Star className="h-3 w-3 fill-yellow text-yellow" />
                              <span>{recipe.rating}/5</span>
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}

              {/* Loading Skeletons for Compact */}
              {isPending && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <CompactRecipeSkeleton key={i} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && !isPending && (
            <div className="flex justify-center pt-6">
              <Button
                onClick={loadMore}
                variant="brand-light"
                className="cursor-pointer w-full py-5"
              >
                Load More Recipes
              </Button>
            </div>
          )}

          {/* Loading indicator when loading more */}
          {isPending && (
            <div className="flex justify-center pt-6">
              <div className="flex items-center gap-2 text-text-muted">
                <div className="h-4 w-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Loading more recipes...</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
