"use client";

import { useRouter } from "next/navigation";
import { DeleteMenuItem } from "@/components/delete-menu-item";

export function DeleteRecipeButton({ recipeId }: { recipeId: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    const response = await fetch(`/api/recipes/${recipeId}`, {
      method: "DELETE",
    });
    if (response.ok) {
      router.push("/dashboard/recipes");
      router.refresh();
    }
  };

  return (
    <DeleteMenuItem
      label="Delete Recipe"
      title="Delete Recipe?"
      description="This action cannot be undone. This will permanently delete your recipe."
      onConfirm={handleDelete}
    />
  );
}
