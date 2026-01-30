import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createRecipe } from "../actions";

export default async function NewRecipePage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Add New Recipe</h1>

      <form action={createRecipe} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Recipe Title *
          </label>
          <input
            type="text"
            name="title"
            required
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            placeholder="e.g. Grandma's Pasta"
          />
        </div>

        {/* Ingredients */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Ingredients *
          </label>
          <textarea
            name="ingredients"
            required
            rows={6}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            placeholder="Enter each ingredient on a new line"
          />
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Instructions *
          </label>
          <textarea
            name="instructions"
            required
            rows={8}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            placeholder="Enter each step on a new line"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Save Recipe
          </button>
          <a
            href="/dashboard"
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
