import { currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { RecipeCard } from "@/components/recipe-card";
import { ArrowLeft, Edit, Pin, Plus } from "lucide-react";
import Link from "next/link";
import { TogglePinButton } from "@/components/toggle-pin-button";
import { DeleteCategoryButton } from "@/components/delete-category-button";

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

  const recipes = category.recipeCategories.map((rc) => rc.recipe);

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link href="/dashboard/categories">
            <ArrowLeft className="h-4 w-4" />
            Back to Categories
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

      {/* Hero / header card */}
      <div className="relative overflow-hidden rounded-sm border border-border-light bg-background">
        {/* subtle brand glow */}
        <div className="pointer-events-none absolute -top-20 -right-24 h-56 w-56 rounded-full bg-brand-100 blur-3xl opacity-70" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-brand-100 blur-3xl opacity-60" />

        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-3 mb-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <h1 className="truncate text-2xl font-semibold tracking-tight text-text-primary">
                      {category.name}
                    </h1>

                    {category.isPinned && (
                      <span className="inline-flex items-center gap-2 rounded-md bg-brand-100 px-3 py-1 text-xs font-medium text-text-primary">
                        <Pin className="h-3.5 w-3.5 text-brand fill-brand" />
                        <span className="text-brand">Pinned</span>
                      </span>
                    )}
                  </div>

                  {category.description ? (
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
                      {category.description}
                    </p>
                  ) : (
                    <p className="mt-2 max-w-2xl text-sm text-text-muted">
                      No description yet.
                    </p>
                  )}
                </div>
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-secondary inline-flex items-center rounded-sm px-3 py-1 text-sm">
                  <span className=" font-medium text-white ">
                    {recipes.length}
                  </span>
                  <span className="ml-1  text-white ">
                    {recipes.length === 1 ? "recipe" : "recipes"}
                  </span>
                </div>

                <div className="h-5 w-px bg-border-light hidden sm:block" />

                <p className="text-sm text-text-muted">
                  Manage recipes in this category from recipe pages.
                </p>
              </div>
            </div>

            {/* Optional: right-side “actions” block spacing */}
            <div className="hidden sm:block">
              <div className="h-10 w-10 rounded-full border border-border-light bg-background" />
            </div>
          </div>
        </div>
      </div>

      {/* Content header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Recipes</h2>
          <p className="mt-1 text-sm text-text-secondary">
            {recipes.length === 0
              ? "Nothing here yet — add some from your recipes."
              : "All recipes assigned to this category."}
          </p>
        </div>

        <Button asChild variant="brand" className="cursor-pointer">
          <Link href="/dashboard/recipes">Browse Recipes</Link>
        </Button>
      </div>

      {/* Recipes Grid / Empty */}
      {recipes.length === 0 ? (
        <div className="relative overflow-hidden rounded-xl border border-border-light bg-background">
          <div className="pointer-events-none absolute -top-16 right-10 h-40 w-40 rounded-full bg-brand-100 blur-3xl opacity-60" />
          <div className="p-8 sm:p-10">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100">
                <Plus className="h-7 w-7 text-brand" />
              </div>

              <h3 className="text-xl font-semibold text-text-primary">
                No recipes in this category
              </h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-text-secondary">
                Pick a recipe, then add it to{" "}
                <span className="font-medium text-text-primary">
                  {category.name}
                </span>{" "}
                from the recipe detail page.
              </p>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <Button asChild variant="brand" className="cursor-pointer">
                  <Link href="/dashboard/recipes">Browse Recipes</Link>
                </Button>
                <Button asChild variant="outline" className="cursor-pointer">
                  <Link href="/dashboard/categories">View All Categories</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} {...recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
