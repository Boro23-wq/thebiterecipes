import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  // Fetch user's recipes
  const userRecipes = await db.query.recipes.findMany({
    where: eq(recipes.userId, user.id),
    orderBy: (recipes, { desc }) => [desc(recipes.createdAt)],
  });

  return (
    <div className="min-h-screen p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">
          Welcome, {user.firstName || "Chef"}! 👨‍🍳
        </h1>
        <Link
          href="/recipes/new"
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium"
        >
          + Add Recipe
        </Link>
      </div>

      <p className="text-gray-600 mb-8">
        You have {userRecipes.length} recipe
        {userRecipes.length !== 1 ? "s" : ""}
      </p>

      {userRecipes.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <p className="text-gray-400">
            No recipes yet. Let&apos;s add your first one!
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {userRecipes.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
              className="border rounded-lg p-6 hover:shadow-lg transition-shadow block"
            >
              <h3 className="text-xl font-semibold mb-2">{recipe.title}</h3>
              <p className="text-sm text-gray-500">
                {new Date(recipe.createdAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
