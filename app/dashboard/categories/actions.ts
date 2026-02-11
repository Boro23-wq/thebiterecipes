"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { categories, recipeCategories } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createCategory(formData: FormData) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  const [category] = await db
    .insert(categories)
    .values({
      userId: user.id,
      name,
      description: description || null,
    })
    .returning();

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/categories");
  redirect(`/dashboard/categories/${category.id}`);
}

export async function updateCategory(categoryId: string, formData: FormData) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  await db
    .update(categories)
    .set({
      name,
      description: description || null,
      updatedAt: new Date(),
    })
    .where(and(eq(categories.id, categoryId), eq(categories.userId, user.id)));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/categories");
  revalidatePath(`/dashboard/categories/${categoryId}`);
  redirect(`/dashboard/categories/${categoryId}`);
}

export async function deleteCategory(categoryId: string) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  await db
    .delete(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, user.id)));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/categories");
  redirect("/dashboard/categories");
}

export async function togglePinCategory(categoryId: string) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  // Get current category
  const category = await db.query.categories.findFirst({
    where: and(eq(categories.id, categoryId), eq(categories.userId, user.id)),
  });

  if (!category) throw new Error("Category not found");

  // If trying to pin, check limit
  if (!category.isPinned) {
    const pinnedCount = await db.query.categories.findMany({
      where: and(eq(categories.userId, user.id), eq(categories.isPinned, true)),
    });

    if (pinnedCount.length >= 5) {
      throw new Error("Maximum 5 pinned categories allowed");
    }
  }

  // Toggle pin
  await db
    .update(categories)
    .set({
      isPinned: !category.isPinned,
      updatedAt: new Date(),
    })
    .where(eq(categories.id, categoryId));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/categories");
}

export async function addRecipeToCategory(
  recipeId: string,
  categoryId: string,
) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  // Check if already exists
  const existing = await db.query.recipeCategories.findFirst({
    where: and(
      eq(recipeCategories.recipeId, recipeId),
      eq(recipeCategories.categoryId, categoryId),
    ),
  });

  if (existing) return;

  await db.insert(recipeCategories).values({
    recipeId,
    categoryId,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/categories");
  revalidatePath(`/dashboard/categories/${categoryId}`);
}

export async function removeRecipeFromCategory(
  recipeId: string,
  categoryId: string,
) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  await db
    .delete(recipeCategories)
    .where(
      and(
        eq(recipeCategories.recipeId, recipeId),
        eq(recipeCategories.categoryId, categoryId),
      ),
    );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/categories");
  revalidatePath(`/dashboard/categories/${categoryId}`);
}
