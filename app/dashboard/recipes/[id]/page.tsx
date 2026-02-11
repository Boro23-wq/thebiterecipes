import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardSm } from "@/components/ui/card-wrapper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  ImagePlus,
  Clock,
  Users,
  Star,
  TrendingUp,
  Edit,
  Share2,
  Bookmark,
  ChefHat,
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
import { cn } from "@/lib/utils";

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
    },
  });

  if (!recipe) {
    notFound();
  }

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
            <Button variant="brand-light" className="cursor-pointer" size="sm">
              <Share2 className={icon.base} />
            </Button>
            <Button variant="brand-light" className="cursor-pointer" size="sm">
              <Bookmark className={icon.base} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="brand-light"
                  className="cursor-pointer"
                  size="sm"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={icon.base}
                  >
                    <path
                      d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM12.5 8.625C13.1213 8.625 13.625 8.12132 13.625 7.5C13.625 6.87868 13.1213 6.375 12.5 6.375C11.8787 6.375 11.375 6.87868 11.375 7.5C11.375 8.12132 11.8787 8.625 12.5 8.625Z"
                      fill="currentColor"
                    />
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 border-none shadow-menu rounded-sm"
              >
                <DropdownMenuItem
                  asChild
                  className="hover:bg-brand hover:text-white cursor-pointer group rounded-sm"
                >
                  <Link href={`/dashboard/recipes/${recipe.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4 group-hover:text-white" />
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
        <div className="grid grid-cols-3 gap-1 h-125">
          {/* Main large image */}
          <div className="col-span-2 row-span-2 bg-linear-to-br from-brand-200 to-brand-300 flex items-center justify-center relative group cursor-pointer overflow-hidden">
            {recipe.imageUrl ? (
              <Image
                src={recipe.imageUrl}
                alt={recipe.title}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="flex flex-col items-center gap-3">
                <ChefHat className={cn(icon.xlarge, "text-brand/20")} />
                <span className="text-sm text-brand/40">No image yet</span>
              </div>
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Small images */}
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
          <Card className="p-6 mb-6">
            <div className={spacing.cardLarge}>
              <div>
                <h1 className="text-3xl font-semibold text-text-primary mb-2">
                  {recipe.title}
                </h1>
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

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {recipe.totalTime && (
                  <div className="flex flex-col gap-1 p-3 bg-brand-100 rounded-sm">
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Clock className={icon.base} />
                      <span className="text-xs">Total Time</span>
                    </div>
                    <span className="text-lg font-semibold text-text-primary">
                      {recipe.totalTime}m
                    </span>
                  </div>
                )}
                {recipe.servings && (
                  <div className="flex flex-col gap-1 p-3 bg-brand-100 rounded-sm">
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Users className={icon.base} />
                      <span className="text-xs">Servings</span>
                    </div>
                    <span className="text-lg font-semibold text-text-primary">
                      {recipe.servings}
                    </span>
                  </div>
                )}
                {recipe.calories && (
                  <div className="flex flex-col gap-1 p-3 bg-brand-100 rounded-sm">
                    <div className="flex items-center gap-2 text-text-secondary">
                      <TrendingUp className={icon.base} />
                      <span className="text-xs">Calories</span>
                    </div>
                    <span className="text-lg font-semibold text-text-primary">
                      {recipe.calories}
                    </span>
                  </div>
                )}
                {recipe.rating && (
                  <div className="flex flex-col gap-1 p-3 bg-brand-highlight rounded-sm">
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Star
                        className={cn(
                          icon.base,
                          "fill-[#F7B801] text-[#F7B801]",
                        )}
                      />
                      <span className="text-xs">Rating</span>
                    </div>
                    <span className="text-lg font-semibold text-text-primary">
                      {recipe.rating}/5
                    </span>
                  </div>
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
                  {recipe.source && (
                    <span className={badge.base}>
                      <span className={badge.label}>Source:</span>
                      <span className={badge.value}>{recipe.source}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Tabs Section */}
          <Tabs defaultValue="ingredients" className="w-full">
            <TabsList className="grid w-full grid-cols-3 gap-1.5 rounded-md bg-brand-300 p-1.5">
              <TabsTrigger
                value="ingredients"
                className="data-[state=active]:bg-brand data-[state=active]:text-white cursor-pointer"
              >
                Ingredients
              </TabsTrigger>

              <TabsTrigger
                value="instructions"
                className="data-[state=active]:bg-brand data-[state=active]:text-white cursor-pointer"
              >
                Instructions
              </TabsTrigger>

              <TabsTrigger
                value="notes"
                className="data-[state=active]:bg-brand data-[state=active]:text-white cursor-pointer"
              >
                Notes
              </TabsTrigger>
            </TabsList>

            {/* Ingredients Tab */}
            <TabsContent value="ingredients" className="mt-6">
              <CardSm className="p-6">
                <h3 className={cn(text.h2, "mb-8 flex items-center gap-2")}>
                  <span className="w-1 h-6 bg-brand" />
                  Ingredients
                </h3>
                <ul className={spacing.card}>
                  {recipe.ingredients.map((ing, index) => (
                    <li
                      key={ing.id}
                      className="flex items-start gap-3 p-2 hover:bg-brand-100 rounded-sm transition-colors"
                    >
                      <span className="shrink-0 w-6 h-6 rounded-sm bg-brand-100 text-brand flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className={cn(text.body, "flex-1")}>
                        {ing.amount && (
                          <span className="font-semibold">{ing.amount}</span>
                        )}{" "}
                        {ing.ingredient}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardSm>
            </TabsContent>

            {/* Instructions Tab */}
            <TabsContent value="instructions" className="mt-6">
              <CardSm className="border border-gray-200 p-6">
                <h3 className={cn(text.h2, "mb-8 flex items-center gap-2")}>
                  <span className="w-1 h-6 bg-brand" />
                  Instructions
                </h3>
                <ol className={spacing.cardLarge}>
                  {recipe.instructions.map((inst) => (
                    <li key={inst.id} className="flex gap-4">
                      <span className="shrink-0 w-8 h-8 rounded-sm bg-brand text-white flex items-center justify-center text-sm font-semibold shadow-brand-focus">
                        {inst.order}
                      </span>
                      <span
                        className={cn(text.body, "flex-1 pt-1 leading-relaxed")}
                      >
                        {inst.step}
                      </span>
                    </li>
                  ))}
                </ol>
              </CardSm>
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes" className="mt-6">
              <CardSm className="border border-gray-200 p-6">
                <h3 className={cn(text.h2, "mb-8 flex items-center gap-2")}>
                  <span className="w-1 h-6 bg-brand" />
                  Notes
                </h3>
                {recipe.notes ? (
                  <p
                    className={cn(
                      text.body,
                      "leading-relaxed bg-brand-100 p-4 rounded-sm",
                    )}
                  >
                    {recipe.notes}
                  </p>
                ) : (
                  <p className="text-sm text-text-muted italic">
                    No notes added yet
                  </p>
                )}
              </CardSm>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
