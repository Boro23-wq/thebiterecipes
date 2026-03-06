import { currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { categories, recipes as allRecipes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, FolderOpen, Pin, Plus } from "lucide-react";
import Link from "next/link";
import { TogglePinButton } from "@/components/toggle-pin-button";
import { DeleteCategoryButton } from "@/components/delete-category-button";
import AddRecipeToCategoryButton from "@/components/add-recipe-to-category-button";
import { RecipeGridView } from "@/components/recipes-grid-view";

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { id } = await params;

  const category = await db.query.categories.findFirst({
    where: and(eq(categories.id, id), eq(categories.userId, user.id)),
    with: {
      recipeCategories: {
        with: {
          recipe: true,
        },
      },
    },
  });

  if (!category) {
    notFound();
  }

  // Recipes already in this category
  const categoryRecipes = category.recipeCategories.map((rc) => rc.recipe);

  // All user recipes (for dialog)
  const userRecipes = await db.query.recipes.findMany({
    where: eq(allRecipes.userId, user.id),
    columns: {
      id: true,
      title: true,
      imageUrl: true,
      totalTime: true,
      servings: true,
    },
  });

  const existingRecipeIds = categoryRecipes.map((r) => r.id);

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <Button variant="text" size="none" asChild className="gap-2">
          <Link href="/dashboard/categories">
            <ArrowLeft className="h-4 w-4" />
            Categories
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <TogglePinButton
            categoryId={category.id}
            isPinned={category.isPinned}
          />
          <Button
            variant="brand-light"
            size="sm"
            asChild
            className="cursor-pointer"
          >
            <Link href={`/dashboard/categories/${category.id}/edit`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
          <DeleteCategoryButton
            categoryId={category.id}
            categoryName={category.name}
          />
        </div>
      </div>

      {/* Hero */}
      <div className="rounded-sm border border-border-brand-light bg-white overflow-hidden flex">
        <div className="w-1 shrink-0 bg-brand" />

        <div className="flex-1 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <FolderOpen className="h-5 w-5 shrink-0 text-brand" />
              <h1 className="text-lg font-bold text-text-primary truncate">
                {category.name}
              </h1>
              {category.isPinned && (
                <span className="shrink-0 flex items-center gap-1 bg-brand-50 px-2 py-0.5 rounded-sm">
                  <Pin className="h-3 w-3 text-brand fill-brand" />
                  <span className="text-[10px] font-medium text-brand">
                    Pinned
                  </span>
                </span>
              )}
            </div>

            <div className="shrink-0 ml-4 flex items-center gap-1.5 text-sm">
              <span className="font-bold text-brand">
                {categoryRecipes.length}
              </span>
              <span className="text-text-muted">
                {categoryRecipes.length === 1 ? "recipe" : "recipes"}
              </span>
            </div>
          </div>

          {category.description && (
            <p className="text-sm text-text-muted mt-1 pl-8 truncate">
              {category.description}
            </p>
          )}
        </div>
      </div>

      {/* Content header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Recipes</h2>
          <p className="mt-1 text-sm text-text-secondary">
            {categoryRecipes.length === 0
              ? "Nothing here yet — add some recipes."
              : "All recipes assigned to this category."}
          </p>
        </div>

        <AddRecipeToCategoryButton
          categoryId={category.id}
          categoryName={category.name}
          categoryDescription={category.description ?? undefined}
          recipes={userRecipes}
          existingRecipeIds={existingRecipeIds}
        />
      </div>

      {/* Recipes */}
      {categoryRecipes.length === 0 ? (
        <div className="relative overflow-hidden rounded-sm border border-border-light border-dashed bg-background">
          <div className="pointer-events-none absolute -top-16 right-10 h-40 w-40 rounded-sm bg-brand-100 blur-3xl opacity-60" />
          <div className="p-8 sm:p-10">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-sm bg-brand-100">
                <Plus className="h-7 w-7 text-brand" />
              </div>

              <h3 className="text-xl font-semibold text-text-primary">
                No recipes in this category
              </h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-text-secondary">
                Click <span className="font-medium">Add Recipe</span> to add one
                to <span className="font-medium">{category.name}</span>.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <RecipeGridView
          initialRecipes={categoryRecipes}
          totalCount={categoryRecipes.length}
          context="category"
          categoryId={category.id}
        />
      )}
    </div>
  );
}
