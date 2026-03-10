import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { CookMode } from "@/components/cook-mode";

export default async function CookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await currentUser();
  if (!user) return null;

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

  if (!recipe) notFound();

  return (
    <CookMode
      recipe={{
        id: recipe.id,
        title: recipe.title,
        servings: recipe.servings,
        totalTime: recipe.totalTime,
        imageUrl: recipe.imageUrl,
      }}
      ingredients={recipe.ingredients}
      instructions={recipe.instructions}
    />
  );
}
