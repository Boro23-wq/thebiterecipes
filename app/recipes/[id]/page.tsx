import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>; // <- Changed to Promise
}) {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  const { id } = await params; // <- Await params first

  // Fetch recipe with ingredients and instructions
  const recipe = await db.query.recipes.findFirst({
    where: and(
      eq(recipes.id, id), // <- Use id instead of params.id
      eq(recipes.userId, user.id),
    ),
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
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      <Link
        href="/dashboard"
        className="text-blue-600 hover:underline mb-4 inline-block"
      >
        ← Back to Dashboard
      </Link>

      <h1 className="text-4xl font-bold mb-8">{recipe.title}</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Ingredients */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Ingredients</h2>
          <ul className="space-y-2">
            {recipe.ingredients.map((ing) => (
              <li key={ing.id} className="flex gap-2">
                <span className="text-gray-400">•</span>
                <span>
                  {ing.amount && <strong>{ing.amount}</strong>} {ing.ingredient}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Instructions */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Instructions</h2>
          <ol className="space-y-4">
            {recipe.instructions.map((inst) => (
              <li key={inst.id} className="flex gap-3">
                <span className="font-bold text-green-600">{inst.order}.</span>
                <span>{inst.step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mt-8 text-sm text-gray-500">
        Added on {new Date(recipe.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
}
