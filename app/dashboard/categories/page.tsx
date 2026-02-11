import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Plus, FolderOpen } from "lucide-react";
import Link from "next/link";
import { CategoryCard } from "@/components/category-card";

export default async function CategoriesPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch all categories with recipe images
  const userCategories = await db.query.categories.findMany({
    where: eq(categories.userId, user.id),
    orderBy: [desc(categories.isPinned), desc(categories.createdAt)],
    with: {
      recipeCategories: {
        with: {
          recipe: {
            columns: {
              id: true,
              imageUrl: true,
            },
          },
        },
        limit: 4,
      },
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            Categories
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {userCategories.length}{" "}
            {userCategories.length === 1 ? "category" : "categories"}
          </p>
        </div>

        <Button asChild variant="brand">
          <Link href="/dashboard/categories/new">
            <Plus className="h-4 w-4" />
            New Category
          </Link>
        </Button>
      </div>

      {/* Categories Grid */}
      {userCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border-light rounded-md">
          <FolderOpen className="h-16 w-16 text-brand/30 mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            No categories yet
          </h3>
          <p className="text-sm text-text-secondary mb-6 max-w-sm">
            Create categories to organize your recipes into collections like
            &quot;Weeknight Dinners&quot; or &quot;Holiday Baking&quot;
          </p>
          <Button asChild variant="brand">
            <Link href="/dashboard/categories/new">
              <Plus className="h-4 w-4" />
              Create Your First Category
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userCategories.map((category) => (
            <CategoryCard
              key={category.id}
              id={category.id}
              name={category.name}
              description={category.description}
              isPinned={category.isPinned}
              recipeCount={category.recipeCategories.length}
              recipeImages={category.recipeCategories.map(
                (rc) => rc.recipe.imageUrl,
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
