import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ArrowLeft, Sparkles, Wand2, Link2, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ImportRecipeForm } from "@/components/import-recipe-form";

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
      <div className="relative overflow-hidden rounded-sm border border-border-light mt-4">
        {/* Background layers */}
        <div className="absolute inset-0">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-linear-to-br from-brand-500 via-brand-600 to-brand-700" />

          {/* Radial glow layers (reduced opacity for richness without haze) */}
          <div className="absolute -top-32 -right-32 h-96 w-96 bg-pink-500/20 blur-3xl rounded-full" />
          <div className="absolute -bottom-32 -left-32 h-96 w-96 bg-cyan-400/20 blur-3xl rounded-full" />

          {/* Contrast overlay (keeps text readable) */}
          <div className="absolute inset-0 bg-black/15" />
        </div>

        <div className="relative z-10 p-8 text-white">
          <div className="inline-flex items-center justify-center rounded-sm bg-brand-400/30 p-3 mb-4">
            <Sparkles className="h-6 w-6 text-white" />
          </div>

          <h1 className="text-3xl font-bold mb-2 tracking-tight">
            Import Recipe from URL
          </h1>

          <p className="text-lg text-white/85 max-w-2xl">
            Paste a recipe link and let Bite magically extract ingredients,
            steps, times, and more — automatically.
          </p>

          <div className="mt-5 flex flex-wrap gap-2 text-xs">
            <div className="rounded-sm bg-brand-400/25 px-3 py-1">
              ⚡ Auto-detect ingredients
            </div>
            <div className="rounded-sm bg-brand-400/25 px-3 py-1">
              🪄 Extract instructions
            </div>
            <div className="rounded-sm bg-brand-400/25 px-3 py-1">
              ✨ Editable after import
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Step
          icon={<Link2 className="h-5 w-5" />}
          title="1. Paste the link"
          desc="Copy any recipe URL from your browser."
        />
        <Step
          icon={<Wand2 className="h-5 w-5" />}
          title="2. We extract it"
          desc="We scan structured recipe markup."
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
              Some sites may block parsing. Try the “print recipe” page if
              needed.
            </div>
          </div>
        </div>

        <ImportRecipeForm />
      </div>

      {/* Supported Sites */}
      <div className="relative overflow-hidden rounded-sm border border-border-light bg-white shadow-xs">
        {/* Subtle background accent */}
        <div className="absolute inset-0 bg-linear-to-br from-brand-50 via-transparent to-brand-75 opacity-60" />
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-brand-200/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-brand-300/20 blur-3xl" />

        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-start sm:items-center justify-between mb-4 flex-col sm:flex-row">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">
                Works with most recipe sites ✨
              </h3>
              <p className="text-xs text-text-secondary mt-1">
                We auto-detect structured recipe data.
              </p>
            </div>

            <div className="rounded-sm bg-brand-100 px-3 py-1 text-xs font-medium text-brand mt-2 sm:mt-0">
              JSON-LD Powered
            </div>
          </div>

          {/* Site grid */}
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

          {/* Bottom info strip */}
          <div className="mt-5 rounded-sm border border-border-light bg-brand-50 p-3">
            <p className="text-xs text-text-secondary leading-relaxed">
              We extract recipe data from sites using{" "}
              <span className="font-medium text-text-primary">
                schema.org/Recipe
              </span>{" "}
              markup (JSON-LD). If a site doesn’t import correctly, try its
              “Print Recipe” version for better results.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
