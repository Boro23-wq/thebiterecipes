"use client";

import {
  useState,
  useMemo,
  useTransition,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { RecipeCard } from "@/components/recipe-card";
import {
  RecipeCardSkeleton,
  CompactRecipeSkeleton,
} from "@/components/recipe-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchRecipes } from "@/app/dashboard/recipes/actions";
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

import type { RecipesCursor } from "@/app/dashboard/recipes/actions";

type ViewMode = "grid" | "compact";
type SortBy = "recent" | "title" | "rating" | "time";

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

function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);

  return debounced;
}

export function RecipesView({ initialRecipes, totalCount }: RecipesViewProps) {
  const CONTROL_H = "h-10";
  const RECIPES_PER_PAGE = 24;

  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [isPending, startTransition] = useTransition();

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>(
    [],
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // counts from server
  const [totalCountState, setTotalCountState] = useState(totalCount);
  const [filteredCount, setFilteredCount] = useState(totalCount);
  const [nextCursor, setNextCursor] = useState<RecipesCursor | null>(null);

  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const hasMore = Boolean(nextCursor);

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

  const sortLabels: Record<SortBy, string> = {
    recent: "Most Recent",
    title: "Alphabetical",
    rating: "Highest Rated",
    time: "Quickest",
  };

  useEffect(() => {
    startTransition(async () => {
      const res = await searchRecipes({
        q: debouncedSearch,
        sortBy,
        cuisines: selectedCuisines,
        difficulties: selectedDifficulties,
        categories: selectedCategories,
        favoritesOnly: showFavoritesOnly,
        cursor: null,
        limit: RECIPES_PER_PAGE,
      });

      setRecipes(res.items);
      setFilteredCount(res.filteredCount);
      setTotalCountState(res.totalCount);
      setNextCursor(res.nextCursor);
    });
  }, [
    debouncedSearch,
    sortBy,
    selectedCuisines,
    selectedDifficulties,
    selectedCategories,
    showFavoritesOnly,
    RECIPES_PER_PAGE,
  ]);

  const loadMore = useCallback(() => {
    if (!nextCursor || isPending) return;

    startTransition(async () => {
      const res = await searchRecipes({
        q: debouncedSearch,
        sortBy,
        cuisines: selectedCuisines,
        difficulties: selectedDifficulties,
        categories: selectedCategories,
        favoritesOnly: showFavoritesOnly,
        cursor: nextCursor,
        limit: RECIPES_PER_PAGE,
      });

      setRecipes((prev) => [...prev, ...res.items]);
      setFilteredCount(res.filteredCount);
      setTotalCountState(res.totalCount);
      setNextCursor(res.nextCursor);
    });
  }, [
    nextCursor,
    isPending,
    debouncedSearch,
    sortBy,
    selectedCuisines,
    selectedDifficulties,
    selectedCategories,
    showFavoritesOnly,
    RECIPES_PER_PAGE,
  ]);

  useEffect(() => {
    if (!hasMore || isPending) return;
    const el = sentinelRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      {
        root: null,
        rootMargin: "700px 0px",
        threshold: 0,
      },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, isPending, loadMore]);

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

  const separatorCls = "mx-2 my-2 h-0 bg-transparent border-0";

  const menuItemCls = cn(
    "!border-0 !shadow-none !outline-none ring-0 cursor-pointer",
    "text-text-primary",
    "data-[highlighted]:bg-brand-100",
    "data-[highlighted]:text-brand",
    "data-[state=checked]:text-brand",
  );

  const groupedRecipes = useMemo(() => {
    const groups: Record<string, Recipe[]> = {};

    recipes.forEach((recipe) => {
      const date = new Date(recipe.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let group: string;
      if (date.toDateString() === today.toDateString()) group = "Today";
      else if (date.toDateString() === yesterday.toDateString())
        group = "Yesterday";
      else
        group = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

      (groups[group] ??= []).push(recipe);
    });

    return Object.entries(groups);
  }, [recipes]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            My Recipes
          </h1>

          <p className="text-sm text-text-secondary mt-1">
            {recipes.length} of{" "}
            {activeFiltersCount > 0 || debouncedSearch
              ? filteredCount
              : totalCountState}{" "}
            recipe
            {(activeFiltersCount > 0 || debouncedSearch
              ? filteredCount
              : totalCountState) !== 1
              ? "s"
              : ""}
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
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-text-muted hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Sort */}
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
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
            className="border border-border-light bg-white  shadow-xs"
          >
            <SelectGroup>
              <SelectLabel className="text-xs text-text-muted">
                Sort by
              </SelectLabel>
              <SelectItem className="cursor-pointer" value="recent">
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

        {/* Filters */}
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
                <span className="absolute -top-2 -right-1 bg-brand text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
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
              "p-2 shadow-xs",
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

            <DropdownMenuCheckboxItem
              checked={showFavoritesOnly}
              onCheckedChange={setShowFavoritesOnly}
              className={cn(
                menuItemCls,
                "flex items-center justify-start text-left",
                "pl-2 pr-2", // control padding
              )}
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
                    key={cuisine as string}
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
                    {cuisine as string}
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
                    key={difficulty as string}
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
                    {difficulty as string}
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
                    key={category as string}
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
                    {category as string}
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
                    className="w-full text-brand bg-brand-100 hover:text-brand hover:bg-brand-200 cursor-pointer"
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

      {/* Results */}
      {recipes.length === 0 && !isPending ? (
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
          {/* Grid */}
          {viewMode === "grid" && (
            <div>
              {groupedRecipes.map(([group, groupRecipes]) => (
                <div key={group} className="mb-8">
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
                    {group}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                    {groupRecipes.map((recipe) => (
                      <RecipeCard key={recipe.id} {...recipe} />
                    ))}
                  </div>
                </div>
              ))}

              {/* Grid skeletons while loading */}
              {isPending && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr mt-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <RecipeCardSkeleton key={i} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Compact */}
          {viewMode === "compact" && (
            <div>
              {groupedRecipes.map(([group, groupRecipes]) => (
                <div key={group} className="mb-8">
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
                    {group}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {groupRecipes.map((recipe) => (
                      <Link
                        key={recipe.id}
                        href={`/dashboard/recipes/${recipe.id}`}
                        className="flex gap-2.5 bg-white rounded-sm p-2.5 hover:border-border-brand-subtle transition-colors border border-border-brand-light cursor-pointer"
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

              {/* Compact skeletons while loading */}
              {isPending && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <CompactRecipeSkeleton key={i} />
                  ))}
                </div>
              )}
            </div>
          )}

          {hasMore && <div ref={sentinelRef} className="h-10" />}

          {hasMore && isPending && (
            <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
              <div className="flex items-center gap-2 rounded-full bg-white border border-border-light px-4 py-2 shadow-sm">
                <div className="h-4 w-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-text-secondary">
                  Loading more recipes…
                </span>
              </div>
            </div>
          )}

          {!hasMore && (
            <div className="mt-10 rounded-md border border-dashed border-border-light bg-white p-4 text-center">
              <p className="text-sm text-text-secondary">
                You’re all caught up ✨
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <Button asChild variant="outline">
                  <Link href="/dashboard/recipes/import">Import from URL</Link>
                </Button>
                <Button asChild variant="brand">
                  <Link href="/dashboard/recipes/new">Add Recipe</Link>
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
