"use client";

import { Trash2 } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DeleteDialog } from "@/components/delete-dialog"; // adjust path

export function DeleteRecipeButton({ recipeId }: { recipeId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/dashboard/recipes");
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to delete recipe:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DeleteDialog
      title="Delete Recipe?"
      description="This action cannot be undone. This will permanently delete your recipe."
      onConfirm={handleDelete}
      disabled={isDeleting}
      trigger={
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
          // important: prevent the dropdown from doing its default select behavior
          onSelect={(e) => e.preventDefault()}
        >
          <Trash2 className="mr-2 h-4 w-4 text-red-600" />
          {isDeleting ? "Deleting..." : "Delete Recipe"}
        </DropdownMenuItem>
      }
    />
  );
}
