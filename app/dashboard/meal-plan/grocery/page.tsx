import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { eq, and } from "drizzle-orm";
import { mealPlans } from "@/db/schema";
import GroceryListView from "@/components/meal-plan/grocery-list/grocery-list-view";
import { ArrowLeft, Download, Share2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function GroceryListPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const params = await searchParams;
  const mealPlanId = params.id;

  if (!mealPlanId) {
    redirect("/dashboard/meal-plan");
  }

  // Verify ownership and get meal plan
  const mealPlan = await db.query.mealPlans.findFirst({
    where: and(eq(mealPlans.id, mealPlanId), eq(mealPlans.userId, user.id)),
    with: {
      groceryList: {
        with: {
          items: {
            orderBy: (gli, { asc }) => [asc(gli.category), asc(gli.order)],
          },
        },
      },
    },
  });

  if (!mealPlan) {
    redirect("/dashboard/meal-plan");
  }

  const items = mealPlan.groceryList?.items || [];
  const checkedCount = items.filter((i) => i.isChecked).length;
  const totalCount = items.length;

  return (
    <div className="container mx-auto px-4 pb-8 no-print">
      {/* Mobile Header */}
      <div className="lg:hidden py-4 space-y-4">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-text-secondary -ml-2"
        >
          <Link href="/dashboard/meal-plan">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Meal Plan
          </Link>
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold">Grocery List</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {checkedCount} of {totalCount} items checked
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="icon" aria-label="Print">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" aria-label="Share">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <GroceryListView
        mealPlanId={mealPlanId}
        groceryList={mealPlan.groceryList}
      />
    </div>
  );
}
