import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ArrowLeft, Link2, Wand2, ListChecks, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ImportRecipeForm } from "@/components/import-recipe-form";
import { HeroBeforeAfter } from "@/components/import-hero";

function Step({
  number,
  icon,
  title,
  desc,
}: {
  number: number;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="relative rounded-sm bg-brand-50/60 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-brand-200 text-brand text-xs font-bold shrink-0">
          {number}
        </div>
        <div className="rounded-sm bg-white/80 p-1.5 text-brand shadow-xs">
          {icon}
        </div>
      </div>
      <div>
        <div className="text-sm font-semibold text-text-primary">{title}</div>
        <div className="mt-1 text-xs text-text-secondary leading-relaxed">
          {desc}
        </div>
      </div>
    </div>
  );
}

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

      {/* How it works */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Step
          number={1}
          icon={<Link2 className="h-4 w-4" />}
          title="Paste any link"
          desc="Recipe sites, YouTube, TikTok — we auto-detect the source."
        />
        <Step
          number={2}
          icon={<Wand2 className="h-4 w-4" />}
          title="We extract it"
          desc="Structured data for websites, AI for social media content."
        />
        <Step
          number={3}
          icon={<ListChecks className="h-4 w-4" />}
          title="Save & tweak"
          desc="Review, edit, and store in Bite."
        />
      </div>

      {/* Form */}
      <ImportRecipeForm />

      {/* Supported Sources */}
      <div className="relative overflow-hidden rounded-sm bg-brand/5 shadow-brand-sm">
        <div className="absolute inset-0 bg-linear-to-br from-brand-50 via-transparent to-brand-75 opacity-50" />
        <div className="absolute -top-20 -right-20 h-48 w-48 rounded-full bg-brand-200/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-brand-300/15 blur-3xl" />

        <div className="relative p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand" />
            <h3 className="text-sm font-semibold text-text-primary">
              Supported Sources
            </h3>
          </div>

          {/* Recipe Sites */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-primary">
                Recipe Sites
              </span>
              <span className="text-[11px] text-brand font-medium bg-brand-100 px-2 py-0.5 rounded-sm">
                JSON-LD Powered
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
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
                  className="inline-flex items-center gap-1.5 rounded-sm bg-white/80 px-2.5 py-1 text-xs text-text-secondary shadow-xs"
                >
                  <span className="h-1 w-1 rounded-full bg-brand" />
                  {site}
                </span>
              ))}
            </div>
          </div>

          <div className="border-t border-border-light" />

          {/* Social Media */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-primary">
                Social Media
              </span>
              <span className="text-[11px] text-brand font-medium bg-brand-100 px-2 py-0.5 rounded-sm">
                AI Powered
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { name: "YouTube", icon: "🎬" },
                { name: "TikTok", icon: "🎵" },
                { name: "Instagram", icon: "📸", note: "paste/screenshot" },
                { name: "Pinterest", icon: "📌", note: "paste/screenshot" },
              ].map((p) => (
                <span
                  key={p.name}
                  className="inline-flex items-center gap-1.5 rounded-sm bg-white/80 px-2.5 py-1 text-xs text-text-secondary shadow-xs"
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
