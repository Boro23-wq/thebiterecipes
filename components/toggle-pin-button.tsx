"use client";

import { Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { togglePinCategory } from "@/app/dashboard/categories/actions";
import { useTransition } from "react";

interface TogglePinButtonProps {
  categoryId: string;
  isPinned: boolean | null;
}

export function TogglePinButton({
  categoryId,
  isPinned,
}: TogglePinButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handlePin = () => {
    startTransition(async () => {
      try {
        await togglePinCategory(categoryId);
      } catch (error) {
        alert(
          error instanceof Error ? error.message : "Failed to pin category",
        );
      }
    });
  };

  return (
    <Button
      variant="brand-light"
      size="sm"
      onClick={handlePin}
      disabled={isPending}
      className="cursor-pointer"
    >
      <Pin className={`h-4 w-4 ${isPinned ? "fill-brand text-brand" : ""}`} />
    </Button>
  );
}
