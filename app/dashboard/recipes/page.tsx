import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { RecipesView } from "@/components/recipes-view";

export default async function RecipesPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const initialRecipes = await db.query.recipes.findMany({
    where: eq(recipes.userId, user.id),
    orderBy: (recipes, { desc }) => [desc(recipes.createdAt)],
    limit: 25,
  });

  const totalCount = await db.query.recipes.findMany({
    where: eq(recipes.userId, user.id),
  });

  return (
    <RecipesView
      initialRecipes={initialRecipes}
      totalCount={totalCount.length}
    />
  );
}
