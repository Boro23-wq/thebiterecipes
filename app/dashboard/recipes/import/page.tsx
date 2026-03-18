import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ImportRecipeForm } from "@/components/import-recipe-form";
import { HeroBeforeAfter } from "@/components/import-hero";

export default async function ImportRecipePage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Back */}
      <Button variant="text" size="none" asChild className="cursor-pointer">
        <Link href="/dashboard/recipes">
          <ArrowLeft className="h-4 w-4" />
          Recipes
        </Link>
      </Button>

      {/* Hero */}
      <HeroBeforeAfter />

      {/* How it works — inline text */}
      <div className="text-center space-y-1">
        <p className="text-sm text-text-secondary">
          <span className="font-medium text-brand">Paste a link</span>
          <span className="mx-2 text-border-light">/</span>
          <span className="font-medium text-brand">AI extracts</span>
          <span className="mx-2 text-border-light">/</span>
          <span className="font-medium text-brand">Save & cook</span>
        </p>
        <p className="text-xs text-text-muted">
          Works with 100+ recipe sites, YouTube, TikTok, and screenshots
        </p>
      </div>

      {/* Form */}
      <ImportRecipeForm />

      {/* Supported sources */}
      <div className="rounded-sm border border-border-light p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-brand" />
          <h3 className="text-xs font-semibold text-text-primary">
            Supported sources
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Recipe sites */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-primary">
                Recipe sites
              </span>
              <span className="text-[10px] text-brand font-medium bg-brand-50 border border-brand-200 px-1.5 py-0.5 rounded-sm">
                JSON-LD
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                "AllRecipes",
                "Food Network",
                "NYT Cooking",
                "Bon Appétit",
                "Serious Eats",
                "Simply Recipes",
                "Tasty",
                "100+ more",
              ].map((site) => (
                <span
                  key={site}
                  className="inline-flex items-center gap-1 rounded-sm border border-border-light px-2 py-0.5 text-[11px] text-text-secondary"
                >
                  <span className="h-1 w-1 rounded-full bg-brand" />
                  {site}
                </span>
              ))}
            </div>
          </div>

          {/* Social media */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-primary">
                Social media
              </span>
              <span className="text-[10px] text-brand font-medium bg-brand-50 border border-brand-200 px-1.5 py-0.5 rounded-sm">
                AI
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { name: "YouTube", icon: "🎬" },
                { name: "TikTok", icon: "🎵" },
                { name: "Instagram", icon: "📸", note: "paste/screenshot" },
                { name: "Pinterest", icon: "📌", note: "paste/screenshot" },
              ].map((p) => (
                <span
                  key={p.name}
                  className="inline-flex items-center gap-1 rounded-sm border border-border-light px-2 py-0.5 text-[11px] text-text-secondary"
                >
                  <span>{p.icon}</span>
                  {p.name}
                  {p.note && (
                    <span className="text-text-muted">· {p.note}</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
