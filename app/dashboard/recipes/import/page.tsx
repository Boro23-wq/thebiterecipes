import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ArrowLeft, Sparkles, Wand2, Link2, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ImportRecipeForm } from "@/components/import-recipe-form";
import { HeroBeforeAfter } from "@/components/import-hero";

function Step({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-sm border border-border-light bg-white p-4 shadow-xs">
      <div className="flex items-start gap-3">
        <div className="rounded-sm bg-brand-100 p-2 text-brand">{icon}</div>
        <div>
          <div className="text-sm font-semibold text-text-primary">{title}</div>
          <div className="mt-1 text-xs text-text-secondary">{desc}</div>
        </div>
      </div>
    </div>
  );
}

export default async function ImportRecipePage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back */}
      <Button variant="text" size="none" asChild className="cursor-pointer">
        <Link href="/dashboard/recipes">
          <ArrowLeft className="h-4 w-4" />
          Recipes
        </Link>
      </Button>

      {/* Hero */}
      <HeroBeforeAfter />

      {/* How it works */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Step
          icon={<Link2 className="h-5 w-5" />}
          title="1. Paste any link"
          desc="Recipe sites, YouTube, TikTok — we auto-detect the source."
        />
        <Step
          icon={<Wand2 className="h-5 w-5" />}
          title="2. We extract it"
          desc="Structured data for websites, AI for social media content."
        />
        <Step
          icon={<ListChecks className="h-5 w-5" />}
          title="3. Save & tweak"
          desc="Review, edit, and store in Bite."
        />
      </div>

      {/* Form */}
      <div className="rounded-sm border border-border-light bg-white p-6 shadow-xs">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-sm bg-brand-100 p-2 text-brand">
            <Wand2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-text-primary">
              Import URL
            </div>
            <div className="text-xs text-text-secondary">
              Works with recipe sites, YouTube, and TikTok. For Instagram or
              Pinterest, paste the caption text manually.
            </div>
          </div>
        </div>

        <ImportRecipeForm />
      </div>

      {/* Supported Sources */}
      <div className="relative overflow-hidden rounded-sm border border-border-light bg-white shadow-xs">
        <div className="absolute inset-0 bg-linear-to-br from-brand-50 via-transparent to-brand-75 opacity-60" />
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-brand-200/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-brand-300/20 blur-3xl" />

        <div className="relative p-6 space-y-6">
          {/* Recipe Sites */}
          <div>
            <div className="flex items-start sm:items-center justify-between mb-4 flex-col sm:flex-row">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">
                  Recipe Sites ✨
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  Auto-extracts using structured recipe data. Fast and accurate.
                </p>
              </div>
              <div className="rounded-sm bg-brand-100 px-3 py-1 text-xs font-medium text-brand mt-2 sm:mt-0">
                JSON-LD Powered
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {[
                "AllRecipes",
                "Food Network",
                "NYT Cooking",
                "Bon Appétit",
                "Serious Eats",
                "Simply Recipes",
                "Tasty",
                "And many more!",
              ].map((site) => (
                <div
                  key={site}
                  className="group rounded-sm border border-border-light bg-white px-3 py-2 text-text-secondary transition-all duration-200 hover:-translate-y-0.5 hover:border-brand hover:text-text-primary hover:shadow-sm"
                >
                  <span className="inline-flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand transition-all group-hover:scale-125" />
                    {site}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border-light" />

          {/* Social Media */}
          <div>
            <div className="flex items-start sm:items-center justify-between mb-4 flex-col sm:flex-row">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">
                  Social Media 🤖
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  AI reads captions, descriptions, and video transcripts to find
                  the recipe.
                </p>
              </div>
              <div className="rounded-sm bg-brand-100 px-3 py-1 text-xs font-medium text-brand mt-2 sm:mt-0">
                AI Powered
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {[
                {
                  name: "YouTube",
                  icon: "🎬",
                  note: "Transcripts + descriptions",
                },
                { name: "TikTok", icon: "🎵", note: "Captions + metadata" },
                { name: "Instagram", icon: "📸", note: "Manual paste" },
                { name: "Pinterest", icon: "📌", note: "Manual paste" },
              ].map((platform) => (
                <div
                  key={platform.name}
                  className="group rounded-sm border border-border-light bg-white px-3 py-2 text-text-secondary transition-all duration-200 hover:-translate-y-0.5 hover:border-brand hover:text-text-primary hover:shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <span>{platform.icon}</span>
                    <span>{platform.name}</span>
                  </div>
                  <p className="text-[11px] text-text-muted mt-1">
                    {platform.note}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom info strip */}
          <div className="rounded-sm border border-border-light bg-brand-50 p-3">
            <p className="text-xs text-text-secondary leading-relaxed">
              Recipe sites use{" "}
              <span className="font-medium text-text-primary">
                schema.org/Recipe
              </span>{" "}
              markup for fast, accurate extraction. Social media uses{" "}
              <span className="font-medium text-text-primary">Gemini AI</span>{" "}
              to parse recipe content from captions and transcripts. If
              auto-extraction doesn&apos;t work, you can always paste the recipe
              text manually.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
