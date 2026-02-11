"use client";

import { deleteCategory } from "@/app/dashboard/categories/actions";
import { useTransition } from "react";
import { DeleteDialog } from "./delete-dialog";

interface DeleteCategoryButtonProps {
  categoryId: string;
  categoryName: string;
}

export function DeleteCategoryButton({
  categoryId,
  categoryName,
}: DeleteCategoryButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      await deleteCategory(categoryId);
    });
  };

  return (
    <DeleteDialog
      title="Delete Category"
      description={`Are you sure you want to delete "${categoryName}"? This action cannot be undone. Recipes in this category will not be deleted.`}
      onConfirm={handleDelete}
      disabled={isPending}
    />
  );
}
