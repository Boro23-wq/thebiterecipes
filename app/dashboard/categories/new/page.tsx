import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Tag,
  Wand2,
  Flame,
  Leaf,
  Clock3,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createCategory } from "../actions";

const SUGGESTIONS = [
  { icon: Flame, label: "Weeknight Wins", desc: "Fast, cozy, repeatable." },
  { icon: Leaf, label: "High-Protein", desc: "Macros-first meals." },
  { icon: Clock3, label: "15-Minute", desc: "Minimal prep, max taste." },
  { icon: Tag, label: "Meal Prep", desc: "Batch-friendly recipes." },
];

export default async function NewCategoryPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  return (
    <div className="relative">
      <div className="max-w-2xl mx-auto space-y-6 px-4 sm:px-0">
        {/* Header */}
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link href="/dashboard/categories" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Categories
            </Link>
          </Button>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-text-primary">
                Create a category ✨
              </h1>
              <p className="text-sm text-text-secondary mt-1">
                Give your recipes a home you’ll actually want to use.
              </p>
            </div>
          </div>
        </div>

        {/* Suggestions */}
        <div className="rounded-sm border border-border-light bg-white/70 backdrop-blur p-4 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
            <Wand2 className="h-4 w-4 text-brand" />
            Need a vibe? Try one of these
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SUGGESTIONS.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="group flex items-start gap-3 rounded-sm border border-border-light bg-white/60 px-3 py-2.5 hover:bg-white transition-colors"
              >
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-sm bg-brand-100 text-brand group-hover:bg-brand-75 transition-colors">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-text-primary">
                    {label}
                  </div>
                  <div className="text-xs text-text-muted">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <form action={createCategory} className="space-y-5">
          <div className="rounded-sm border border-border-light bg-white/80 backdrop-blur p-6 shadow-xs space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-sm font-medium text-text-primary"
              >
                Category Name <span className="text-brand">*</span>
              </Label>

              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <Input
                  id="name"
                  name="name"
                  required
                  placeholder="e.g. Weeknight Wins, High-Protein, Holiday Baking"
                  className="pl-9 border-border-light focus:border-brand focus:ring-brand"
                />
              </div>

              <p className="text-xs text-text-muted">
                Tip: short + specific = easier to reuse.
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-sm font-medium text-text-primary"
              >
                Description{" "}
                <span className="text-text-muted font-normal ml-1">
                  (Optional)
                </span>
              </Label>

              <Textarea
                id="description"
                name="description"
                rows={4}
                placeholder="Tell future-you what belongs here…"
                className="border-border-light focus:border-brand focus:ring-brand resize-none"
              />

              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>Make it obvious at a glance.</span>
                <span className="hidden sm:inline">
                  Example: “Recipes under 30 minutes & low cleanup”
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <Button
                type="submit"
                variant="brand"
                className="cursor-pointer gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Create Category
              </Button>

              <Button
                type="button"
                variant="outline"
                asChild
                className="cursor-pointer"
              >
                <Link href="/dashboard/categories">Cancel</Link>
              </Button>
            </div>

            <div className="text-xs text-text-muted">
              You can pin it later from the category menu.
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
