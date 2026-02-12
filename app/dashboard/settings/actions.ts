"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { userPreferences, recipes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updatePreferences(formData: FormData) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const data = {
    measurementUnit: formData.get("measurementUnit") as string,
    defaultServings: parseInt(formData.get("defaultServings") as string),
    language: formData.get("language") as string,
    timeFormat: formData.get("timeFormat") as string,
    defaultViewMode: formData.get("defaultViewMode") as string,
    updatedAt: new Date(),
  };

  // Upsert preferences
  const existing = await db.query.userPreferences.findFirst({
    where: eq(userPreferences.userId, user.id),
  });

  if (existing) {
    await db
      .update(userPreferences)
      .set(data)
      .where(eq(userPreferences.userId, user.id));
  } else {
    await db.insert(userPreferences).values({
      userId: user.id,
      ...data,
    });
  }

  revalidatePath("/dashboard/settings");
}

export async function updateNotifications(formData: FormData) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const data = {
    emailNotifications: formData.get("emailNotifications") === "on",
    weeklyDigest: formData.get("weeklyDigest") === "on",
    recipeReminders: formData.get("recipeReminders") === "on",
    updatedAt: new Date(),
  };

  const existing = await db.query.userPreferences.findFirst({
    where: eq(userPreferences.userId, user.id),
  });

  if (existing) {
    await db
      .update(userPreferences)
      .set(data)
      .where(eq(userPreferences.userId, user.id));
  } else {
    await db.insert(userPreferences).values({
      userId: user.id,
      ...data,
    });
  }

  revalidatePath("/dashboard/settings");
}

export async function exportRecipes() {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const userRecipes = await db.query.recipes.findMany({
    where: eq(recipes.userId, user.id),
    with: {
      ingredients: true,
      instructions: true,
    },
  });

  return JSON.stringify(userRecipes, null, 2);
}

export async function deleteAllRecipes() {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  await db.delete(recipes).where(eq(recipes.userId, user.id));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/recipes");
}
