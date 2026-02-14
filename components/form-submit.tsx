"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FormSubmitButton({
  children,
  loadingText,
  className,
  variant = "brand",
}: {
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
  variant?: "brand" | "outline" | "destructive" | "brand-light";
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={variant}
      className={cn("cursor-pointer", className)}
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
          {loadingText ?? "Saving..."}
        </span>
      ) : (
        children
      )}
    </Button>
  );
}
