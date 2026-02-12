"use client";

import { Trash2 } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { DeleteDialog } from "@/components/delete-dialog";
import * as React from "react";
import { cn } from "@/lib/utils";

type Props = {
  label?: string;
  title: string;
  description: string;
  onConfirm: () => Promise<void> | void;
  disabled?: boolean;
  className?: string;
};

export function DeleteMenuItem({
  label = "Delete",
  title,
  description,
  onConfirm,
  disabled,
  className,
}: Props) {
  const [isDeleting, setIsDeleting] = React.useState(false);

  async function handleConfirm() {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <DeleteDialog
      title={title}
      description={description}
      onConfirm={handleConfirm}
      disabled={disabled || isDeleting}
      trigger={
        <DropdownMenuItem
          className={cn(
            // keep “danger” look, don’t turn white
            "cursor-pointer rounded-sm text-red-600 focus:text-red-600 focus:bg-red-50",
            className,
          )}
          onSelect={(e) => e.preventDefault()} // keep dropdown from auto-closing before dialog
          disabled={disabled || isDeleting}
        >
          <Trash2 className="mr-2 h-4 w-4 text-red-600" />
          {isDeleting ? "Deleting..." : label}
        </DropdownMenuItem>
      }
    />
  );
}
