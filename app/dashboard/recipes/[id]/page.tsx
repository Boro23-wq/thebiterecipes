import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card-wrapper";
import { FavoriteButton } from "@/components/favorite-button";
import { CategorySelector } from "@/components/category-selector";
import {
  ArrowLeft,
  ImagePlus,
  Star,
  Edit,
  Share2,
  ChefHat,
  MoreHorizontal,
} from "lucide-react";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteRecipeButton } from "@/components/delete-recipe-button";
import { text, icon, badge, spacing, layout } from "@/lib/design-tokens";
import { categories, recipeCategories } from "@/db/schema";
import { cn } from "@/lib/utils";
import { SourceBadge } from "@/components/source-badge";
import { RecipeDetailClient } from "@/components/recipe-detail-client";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  const { id } = await params;

  const recipe = await db.query.recipes.findFirst({
    where: and(eq(recipes.id, id), eq(recipes.userId, user.id)),
    with: {
      ingredients: {
        orderBy: (ingredients, { asc }) => [asc(ingredients.order)],
      },
      instructions: {
        orderBy: (instructions, { asc }) => [asc(instructions.order)],
      },
      images: {
        orderBy: (images, { asc }) => [asc(images.order)],
      },
    },
  });

  if (!recipe) {
    notFound();
  }

  // Fetch all user categories and check which ones have this recipe
  const userCategories = await db.query.categories.findMany({
    where: eq(categories.userId, user.id),
    orderBy: [desc(categories.createdAt)],
    with: {
      recipeCategories: {
        where: eq(recipeCategories.recipeId, id),
      },
    },
  });

  const categoriesWithSelection = userCategories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    isSelected: cat.recipeCategories.length > 0,
  }));

  return (
    <div className="min-h-screen bg-linear-to-b from-white to-brand-50">
      {/* Header Bar */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto py-3 mb-2 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-text-secondary"
          >
            <Link href="/dashboard/recipes">
              <ArrowLeft />
              Back to Recipes
            </Link>
          </Button>

          <div className="flex items-center gap-2">
            <CategorySelector
              recipeId={recipe.id}
              categories={categoriesWithSelection}
            />
            <FavoriteButton
              recipeId={recipe.id}
              isFavorite={recipe.isFavorite}
            />
            <Button variant="brand-light" className="cursor-pointer" size="sm">
              <Share2 className={icon.base} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="brand-light"
                  size="sm"
                  className="cursor-pointer"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/recipes/${recipe.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Recipe
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-brand-200" />

                <DeleteRecipeButton recipeId={recipe.id} />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Hero Section with Images */}
      <div className="relative pb-8">
        {recipe.images && recipe.images.length > 0 ? (
          <>
            {/* 1 image - full width */}
            {recipe.images.length === 1 && (
              <div className="h-125 bg-linear-to-br from-brand-200 to-brand-300 flex items-center justify-center relative group cursor-pointer overflow-hidden">
                <Image
                  src={recipe.images[0].imageUrl}
                  alt={recipe.title}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}

            {/* 2 images - split */}
            {recipe.images.length === 2 && (
              <div className="grid grid-cols-2 gap-1 h-125">
                {recipe.images.map((img, idx) => (
                  <div
                    key={img.id}
                    className="bg-linear-to-br from-brand-200 to-brand-300 flex items-center justify-center relative group cursor-pointer overflow-hidden"
                  >
                    <Image
                      src={img.imageUrl}
                      alt={`${recipe.title} - Image ${idx + 1}`}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            )}

            {/* 3+ images - main + grid */}
            {recipe.images.length >= 3 && (
              <div className="grid grid-cols-3 gap-1 h-125">
                {/* Main large image */}
                <div className="col-span-2 row-span-2 bg-linear-to-br from-brand-200 to-brand-300 flex items-center justify-center relative group cursor-pointer overflow-hidden">
                  <Image
                    src={recipe.images[0].imageUrl}
                    alt={recipe.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Secondary images */}
                {recipe.images.slice(1, 3).map((img, idx) => (
                  <div
                    key={img.id}
                    className="col-span-1 bg-linear-to-br from-brand-200 to-brand-300 flex items-center justify-center relative group cursor-pointer overflow-hidden"
                  >
                    <Image
                      src={img.imageUrl}
                      alt={`${recipe.title} - Image ${idx + 2}`}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          // No images fallback
          <div className="grid grid-cols-3 gap-1 h-125">
            <div className="col-span-2 row-span-2 bg-linear-to-br from-brand-200 to-brand-300 flex items-center justify-center relative group cursor-pointer overflow-hidden">
              <div className="flex flex-col items-center gap-3">
                <ChefHat className={cn(icon.xlarge, "text-brand/20")} />
                <span className="text-sm text-brand/40">No image yet</span>
              </div>
            </div>
            <div className="col-span-1 bg-brand-200 flex items-center justify-center group cursor-pointer hover:bg-brand-300 transition-colors">
              <ImagePlus
                className={cn(
                  icon.large,
                  "text-brand/30 group-hover:text-brand/50 transition-colors",
                )}
              />
            </div>
            <div className="col-span-1 bg-brand-200 flex items-center justify-center group cursor-pointer hover:bg-brand-300 transition-colors">
              <ImagePlus
                className={cn(
                  icon.large,
                  "text-brand/30 group-hover:text-brand/50 transition-colors",
                )}
              />
            </div>
          </div>
        )}

        {/* Floating Category Badge */}
        {recipe.category && (
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-sm shadow-brand-sm">
            <span className="text-xs font-medium text-text-primary">
              {recipe.category}
            </span>
          </div>
        )}

        {/* Floating Favorite */}
        {recipe.isFavorite && (
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm p-2 rounded-sm shadow-brand-sm">
            <Star className={cn(icon.medium, "fill-brand text-brand")} />
          </div>
        )}

        {/* Content Container - Overlapping */}
        <div className={cn(layout.container, "relative -mt-16")}>
          {/* Recipe Header Card */}
          <Card className="p-6 mb-6 shadow-xs shadow-black/5">
            <div className={spacing.cardLarge}>
              <div>
                <h1 className="text-3xl font-semibold text-text-primary mb-2">
                  {recipe.title}
                </h1>

                {recipe.description && (
                  <p className="text-base text-text-secondary mb-3 leading-relaxed">
                    {recipe.description}
                  </p>
                )}

                {recipe.cuisine && (
                  <p
                    className={cn(
                      text.bodyLarge,
                      "flex items-center gap-2 text-text-secondary",
                    )}
                  >
                    <span className="w-1 h-1 rounded-full bg-brand" />
                    {recipe.cuisine} Cuisine
                  </p>
                )}
              </div>

              {/* Difficulty & Source */}
              {(recipe.difficulty || recipe.source) && (
                <div className="flex flex-wrap gap-3 pt-4 border-t border-brand-300">
                  {recipe.difficulty && (
                    <span className={badge.base}>
                      <span className={badge.label}>Difficulty:</span>
                      <span className={cn(badge.value, "capitalize")}>
                        {recipe.difficulty}
                      </span>
                    </span>
                  )}
                  {recipe.source && <SourceBadge url={recipe.source} />}
                </div>
              )}
            </div>
          </Card>

          {/* Client component with stats + tabs */}
          <RecipeDetailClient
            recipe={recipe}
            ingredients={recipe.ingredients}
            instructions={recipe.instructions}
          />
        </div>
      </div>
    </div>
  );
}
