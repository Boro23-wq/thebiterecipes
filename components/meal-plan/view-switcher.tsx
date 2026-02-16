// components/meal-plan/view-switcher.tsx
"use client";

import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export type ViewMode = "calendar" | "list";

export default function ViewSwitcher({
  currentView,
  weekOffset,
}: {
  currentView: ViewMode;
  weekOffset: number;
}) {
  const baseUrl = `/dashboard/meal-plan?week=${weekOffset}`;

  return (
    <div className="flex items-center gap-1 rounded-sm border border-gray-200 bg-white/70 p-1">
      <Link href={`${baseUrl}&view=calendar`}>
        <Button
          variant={currentView === "calendar" ? "brand" : "ghost"}
          size="icon"
          className="h-7 w-7 rounded-sm"
          aria-label="Calendar view"
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
      </Link>

      <Link href={`${baseUrl}&view=list`}>
        <Button
          variant={currentView === "list" ? "brand" : "ghost"}
          size="icon"
          className="h-7 w-7 rounded-sm"
          aria-label="List view"
        >
          <List className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}
