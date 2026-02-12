import Image from "next/image";
import {
  Clock,
  Users,
  ChefHat,
  MapPin,
  Flame,
  Activity,
  Wheat,
  Droplet,
  ImageIcon,
} from "lucide-react";
import { recipeImageSrc } from "@/lib/recipe-image";

interface ParsedRecipe {
  title: string;
  imageUrl?: string;
  imageUrls?: string[];
  prepTime?: number;
  cookTime?: number;
  totalTime?: number;
  servings?: number;
  ingredients: string[];
  instructions: string[];
  cuisine?: string;
  category?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  notes?: string;
  source?: string;
}

interface RecipePreviewProps {
  recipe: ParsedRecipe;
}

export function RecipePreview({ recipe }: RecipePreviewProps) {
  return (
    <div className="bg-white rounded-sm border border-border-light overflow-hidden">
      {/* Header with Image */}
      <div className="grid md:grid-cols-2 gap-6 p-6">
        {/* Images Grid */}
        <div className="space-y-2">
          {recipe.imageUrls && recipe.imageUrls.length > 0 ? (
            <>
              {/* Main image - larger */}
              <div className="relative h-64 bg-brand-100 rounded-sm overflow-hidden">
                <Image
                  src={
                    recipeImageSrc(recipe.imageUrls[0], { mode: "preview" }) ||
                    ""
                  }
                  alt={recipe.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>

              {/* Secondary images - smaller grid */}
              {recipe.imageUrls.length > 1 && (
                <div
                  className={`grid gap-2 ${recipe.imageUrls.length === 2 ? "grid-cols-1" : "grid-cols-2"}`}
                >
                  {recipe.imageUrls.slice(1, 3).map((url, idx) => (
                    <div
                      key={idx}
                      className="relative h-32 bg-brand-100 rounded-sm overflow-hidden"
                    >
                      <Image
                        src={recipeImageSrc(url, { mode: "preview" }) || ""}
                        alt={`${recipe.title} - Image ${idx + 2}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="relative h-64 bg-brand-100 rounded-sm overflow-hidden">
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="h-16 w-16 text-brand/30" />
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              {recipe.title}
            </h2>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3">
            {recipe.prepTime && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-brand" />
                <span className="text-text-secondary">
                  Prep:{" "}
                  <span className="font-medium text-text-primary">
                    {recipe.prepTime}m
                  </span>
                </span>
              </div>
            )}
            {recipe.cookTime && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-brand" />
                <span className="text-text-secondary">
                  Cook:{" "}
                  <span className="font-medium text-text-primary">
                    {recipe.cookTime}m
                  </span>
                </span>
              </div>
            )}
            {recipe.servings && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-brand" />
                <span className="text-text-secondary">
                  <span className="font-medium text-text-primary">
                    {recipe.servings}
                  </span>{" "}
                  servings
                </span>
              </div>
            )}
            {recipe.calories && (
              <div className="flex items-center gap-2 text-sm">
                <Flame className="h-4 w-4 text-brand" />
                <span className="text-text-secondary">
                  <span className="font-medium text-text-primary">
                    {recipe.calories}
                  </span>{" "}
                  cal
                </span>
              </div>
            )}
            {recipe.protein && (
              <div className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4 text-brand" />
                <span className="text-text-secondary">
                  <span className="font-medium text-text-primary">
                    {recipe.protein}g
                  </span>{" "}
                  protein
                </span>
              </div>
            )}
            {recipe.carbs && (
              <div className="flex items-center gap-2 text-sm">
                <Wheat className="h-4 w-4 text-brand" />
                <span className="text-text-secondary">
                  <span className="font-medium text-text-primary">
                    {recipe.carbs}g
                  </span>{" "}
                  carbs
                </span>
              </div>
            )}
            {recipe.fat && (
              <div className="flex items-center gap-2 text-sm">
                <Droplet className="h-4 w-4 text-brand" />
                <span className="text-text-secondary">
                  <span className="font-medium text-text-primary">
                    {recipe.fat}g
                  </span>{" "}
                  fat
                </span>
              </div>
            )}
            {recipe.cuisine && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-brand" />
                <span className="font-medium text-text-primary">
                  {recipe.cuisine}
                </span>
              </div>
            )}
            {recipe.category && (
              <div className="flex items-center gap-2 text-sm">
                <ChefHat className="h-4 w-4 text-brand" />
                <span className="font-medium text-text-primary">
                  {recipe.category}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ingredients & Instructions */}
      <div className="grid md:grid-cols-2 gap-6 p-6 bg-brand-50 border-t border-border-light">
        {/* Ingredients */}
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            Ingredients ({recipe.ingredients.length})
          </h3>
          <ul className="space-y-2 text-sm text-text-secondary">
            {recipe.ingredients.slice(0, 5).map((ingredient, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-brand">•</span>
                <span>{ingredient}</span>
              </li>
            ))}
            {recipe.ingredients.length > 5 && (
              <li className="text-text-muted italic">
                + {recipe.ingredients.length - 5} more ingredients
              </li>
            )}
          </ul>
        </div>

        {/* Instructions */}
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            Instructions ({recipe.instructions.length} steps)
          </h3>
          <ol className="space-y-2 text-sm text-text-secondary">
            {recipe.instructions.slice(0, 3).map((instruction, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="font-semibold text-brand shrink-0">
                  {idx + 1}.
                </span>
                <span className="line-clamp-2">{instruction}</span>
              </li>
            ))}
            {recipe.instructions.length > 3 && (
              <li className="text-text-muted italic">
                + {recipe.instructions.length - 3} more steps
              </li>
            )}
          </ol>
        </div>
      </div>
    </div>
  );
}
