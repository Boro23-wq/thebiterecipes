import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Star,
  Clock,
  Heart,
  Search,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";

export default async function LandingPage() {
  const user = await currentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand text-white font-bold text-xl shadow-sm">
                B
              </div>
              <span className="text-xl font-bold text-text-primary">Bite</span>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-text-secondary "
                asChild
              >
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button variant="brand" size="sm" asChild>
                <Link href="/sign-in">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-linear-to-br from-brand-50 via-white to-brand-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-100 border border-border-brand-light rounded-full">
              <Sparkles className="h-4 w-4 text-brand" />
              <span className="text-sm font-medium text-text-primary">
                Your personal recipe companion
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-text-primary tracking-tight">
              Cook with confidence.
              <br />
              <span className="text-brand">Save every bite.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
              Organize your favorite recipes, import new dishes, and make every
              meal memorable. Your digital cookbook that actually works.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button
                variant="brand"
                size="lg"
                className="text-base px-8 h-12"
                asChild
              >
                <Link href="/sign-in">
                  Start Cooking Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-base px-8 h-12"
                asChild
              >
                <Link href="#features">See How It Works</Link>
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center justify-center gap-8 pt-8 text-sm text-text-secondary">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-brand" />
                <span>Free forever</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-brand" />
                <span>No credit card</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-brand" />
                <span>Unlimited recipes</span>
              </div>
            </div>
          </div>

          {/* Hero Image/Mockup */}
          <div className="mt-20">
            <div
              className="max-w-6xl mx-auto overflow-hidden rounded-sm"
              style={{
                WebkitMaskImage: `
                  linear-gradient(to right,
                    transparent 0%,
                    black 18%,
                    black 82%,
                    transparent 100%
                  ),
                  linear-gradient(to top,
                    transparent 0%,
                    black 35%,
                    black 100%
                  )
                `,
                WebkitMaskComposite: "source-in",
                maskImage: `
                  linear-gradient(to right,
                    transparent 0%,
                    black 18%,
                    black 82%,
                    transparent 100%
                  ),
                  linear-gradient(to top,
                    transparent 0%,
                    black 35%,
                    black 100%
                  )
                `,
                maskComposite: "intersect",
              }}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {heroRecipes.map((recipe, i) => (
                  <div
                    key={i}
                    className={`
                        rounded-sm overflow-hidden bg-white/90
                        shadow-[0_8px_24px_rgba(0,0,0,0.06)]
                      `}
                  >
                    <div className="relative h-40">
                      <Image
                        src={recipe.imageUrl}
                        alt={recipe.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 25vw"
                        priority={i === 0}
                      />
                    </div>

                    <div className="p-4 space-y-2">
                      <h3 className="font-semibold text-text-primary text-sm line-clamp-1">
                        {recipe.title}
                      </h3>

                      <div className="flex items-center gap-4 text-xs text-text-secondary">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{recipe.time}m</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-[#F7B801] text-[#F7B801]" />
                          <span>{recipe.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-brand mb-2">
                Unlimited
              </div>
              <div className="text-text-secondary">Recipes</div>
            </div>

            <div>
              <div className="text-3xl sm:text-4xl font-bold text-brand mb-2">
                Private
              </div>
              <div className="text-text-secondary">By default</div>
            </div>

            <div>
              <div className="text-3xl sm:text-4xl font-bold text-brand mb-2">
                1-click
              </div>
              <div className="text-text-secondary">Save favorites</div>
            </div>

            <div>
              <div className="text-3xl sm:text-4xl font-bold text-brand mb-2">
                Free
              </div>
              <div className="text-text-secondary">While in beta</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-24 bg-linear-to-b from-white to-brand-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-text-primary mb-4">
              Everything you need to organize your recipes
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Powerful features designed to make recipe management effortless
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-sm shadow-xs transition-all border border-brand-200 group cursor-pointer"
              >
                <div className="w-12 h-12 bg-brand-100 rounded-sm flex items-center justify-center mb-6 group-hover:bg-brand group-hover:scale-110 transition-all">
                  <feature.icon className="h-6 w-6 text-brand group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-3">
                  {feature.title}
                </h3>
                <p className="text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-text-primary mb-4">
              Get started in 3 simple steps
            </h2>
            <p className="text-xl text-text-secondary">
              From sign-up to your first recipe in under 2 minutes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {steps.map((step, index) => (
              <div key={index} className="text-center space-y-4">
                <div className="relative">
                  <div className="w-20 h-20 bg-brand rounded-full flex items-center justify-center mx-auto shadow-lg relative z-10">
                    <span className="text-3xl font-bold text-white">
                      {index + 1}
                    </span>
                  </div>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-1/2 left-[calc(50%+2.5rem)] w-[calc(100%-2rem)] h-0.5 bg-brand-300" />
                  )}
                </div>
                <h3 className="text-xl font-semibold text-text-primary">
                  {step.title}
                </h3>
                <p className="text-text-secondary">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-linear-to-br from-brand to-brand-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to organize your recipes?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of home cooks who&apos;ve already transformed their
            cooking experience with Bite.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="text-base px-8 h-12 bg-white text-brand hover:bg-gray-50"
              asChild
            >
              <Link href="/sign-in">
                Start Free Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          <p className="text-white/80 text-sm mt-6">
            No credit card required • Free forever • Get started in seconds
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-white font-bold text-sm">
                B
              </div>
              <span className="text-lg font-bold text-text-primary">Bite</span>
            </div>
            <div className="text-text-secondary text-sm">
              © 2026 Bite. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const heroRecipes = [
  {
    title: "Spaghetti Carbonara",
    time: 25,
    rating: 4.8,
    imageUrl:
      "https://images.unsplash.com/photo-1608756687911-aa1599ab3bd9?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Grilled Salmon Bowl",
    time: 30,
    rating: 4.9,
    imageUrl:
      "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Caesar Salad",
    time: 15,
    rating: 4.7,
    imageUrl:
      "https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Blueberry Pancakes",
    time: 20,
    rating: 4.8,
    imageUrl:
      "https://images.unsplash.com/photo-1495214783159-3503fd1b572d?auto=format&fit=crop&w=1200&q=80",
  },
];

const features = [
  {
    icon: BookOpen,
    title: "Save & Organize",
    description:
      "Store all your recipes in one beautiful, organized place. Add images, ingredients, and step-by-step instructions.",
  },
  {
    icon: Search,
    title: "Smart Search",
    description:
      "Find any recipe instantly with powerful search and filtering. Search by cuisine, difficulty, or cooking time.",
  },
  {
    icon: Heart,
    title: "Favorites & Ratings",
    description:
      "Mark your go-to recipes as favorites and rate them. Never lose track of what works best for you.",
  },
  {
    icon: Clock,
    title: "Cooking Time Tracking",
    description:
      "See prep time, cook time, and total time at a glance. Plan your meals efficiently.",
  },
  {
    icon: Star,
    title: "Categories & Tags",
    description:
      "Organize by cuisine, meal type, or custom categories. Create your own system that makes sense.",
  },
  {
    icon: TrendingUp,
    title: "Nutrition Info",
    description:
      "Track calories, protein, carbs, and more. Make informed decisions about what you cook.",
  },
];

const steps = [
  {
    title: "Create Your Account",
    description:
      "Sign up in seconds with email or Google. No credit card needed, ever.",
  },
  {
    title: "Add Your Recipes",
    description:
      "Start adding your favorite recipes with our simple, intuitive form. Include photos, ingredients, and instructions.",
  },
  {
    title: "Start Cooking",
    description:
      "Access your recipes anytime, anywhere. Cook with confidence knowing everything is organized.",
  },
];
