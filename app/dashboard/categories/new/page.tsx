import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createCategory } from "../actions";

export default async function NewCategoryPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/dashboard/categories">
            <ArrowLeft className="h-4 w-4" />
            Back to Categories
          </Link>
        </Button>

        <h1 className="text-2xl font-semibold text-text-primary">
          Create New Category
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Organize your recipes into collections
        </p>
      </div>

      {/* Form */}
      <form action={createCategory} className="space-y-6">
        <div className="bg-white rounded-sm border border-border-light p-6 space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="text-sm font-medium text-text-primary"
            >
              Category Name *
            </Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="e.g. Weeknight Dinners, Holiday Baking"
              className="border-border-light focus:border-brand focus:ring-brand"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label
              htmlFor="description"
              className="text-sm font-medium text-text-primary"
            >
              Description
              <span className="text-text-muted font-normal ml-1">
                (Optional)
              </span>
            </Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              placeholder="Describe what recipes belong in this category..."
              className="border-border-light focus:border-brand focus:ring-brand resize-none"
            />
            <p className="text-xs text-text-muted">
              Help yourself remember what goes in this collection
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="submit" variant="brand" className="cursor-pointer">
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
      </form>
    </div>
  );
}
