"use client";

import {
  exportRecipes,
  deleteAllRecipes,
} from "@/app/dashboard/settings/actions";
import { Button } from "@/components/ui/button";
import { Download, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { DeleteDialog } from "@/components/delete-dialog";

function ActionCard({
  title,
  description,
  children,
  tone = "default",
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  tone?: "default" | "danger";
}) {
  const isDanger = tone === "danger";

  return (
    <div
      className={[
        "rounded-sm border p-5",
        isDanger
          ? "border-red-200 bg-red-50/40"
          : "border-border-light bg-white",
      ].join(" ")}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h3
            className={[
              "text-sm font-semibold",
              isDanger ? "text-destructive" : "text-text-primary",
            ].join(" ")}
          >
            {title}
          </h3>
          <p className="mt-1 text-sm text-text-secondary">{description}</p>
        </div>

        <div className="shrink-0">{children}</div>
      </div>
    </div>
  );
}

export function DataManagement() {
  const [isPending, startTransition] = useTransition();

  const handleExport = () => {
    startTransition(async () => {
      const data = await exportRecipes();
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bite-recipes-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  const handleDeleteAll = () => {
    startTransition(async () => {
      await deleteAllRecipes();
    });
  };

  return (
    <div className="space-y-4">
      <ActionCard
        title="Export your recipes"
        description="Download everything as a JSON file (backup, migration, peace of mind)."
      >
        <Button
          onClick={handleExport}
          variant="outline"
          disabled={isPending}
          className="cursor-pointer"
        >
          <Download className="h-4 w-4" />
          {isPending ? "Working..." : "Export JSON"}
        </Button>
      </ActionCard>

      <ActionCard
        tone="danger"
        title="Danger zone: delete all recipes"
        description="This permanently deletes recipes, categories, and favorites. No undo."
      >
        <DeleteDialog
          title="Delete All Recipes"
          description="Are you absolutely sure? This will permanently delete all your recipes, categories, and favorites. This action cannot be undone."
          onConfirm={handleDeleteAll}
          disabled={isPending}
          trigger={
            <Button variant="destructive" className="cursor-pointer ">
              <Trash2 className="h-4 w-4" />
              Delete everything
            </Button>
          }
        />
      </ActionCard>

      <div className="rounded-sm border border-border-light bg-white p-4">
        <p className="text-xs text-text-secondary">
          Note: Exports include recipe content and metadata only. If you later
          add uploads/images stored elsewhere, you may want a separate export
          for those.
        </p>
      </div>
    </div>
  );
}
