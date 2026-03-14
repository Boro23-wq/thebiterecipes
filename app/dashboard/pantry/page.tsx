import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getPantryItems, getPantryStats, getExpiringItems } from "./actions";
import { text, spacing, icon } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { StatsCard } from "@/components/ui/card-wrapper";
import { Package, AlertTriangle, ShoppingBasket, Flame } from "lucide-react";
import PantryView from "@/components/pantry/pantry-view";

export default async function PantryPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const [items, stats, expiringItems] = await Promise.all([
    getPantryItems({ sortBy: "created" }),
    getPantryStats(),
    getExpiringItems(3),
  ]);

  return (
    <div className={spacing.section}>
      {/* Header */}
      <div>
        <h1 className={text.h1}>Pantry</h1>
        <p className={cn(text.small, "mt-0.5")}>
          Track what&apos;s in your kitchen and find recipes to cook
        </p>
      </div>

      {/* Stats */}
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] md:grid md:grid-cols-4">
        <StatsCard className="min-w-44 snap-start shrink-0 md:min-w-0 md:shrink">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-secondary">
              Total Items
            </span>
            <Package className={cn(icon.small, icon.brand)} />
          </div>
          <div className={text.statValue}>{stats.totalItems}</div>
          <p className={cn(text.muted, "mt-1")}>In your pantry</p>
        </StatsCard>

        <StatsCard className="min-w-44 snap-start shrink-0 md:min-w-0 md:shrink">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-secondary">
              Expiring Soon
            </span>
            <AlertTriangle
              className={cn(
                icon.small,
                expiringItems.length > 0 ? "text-amber-500" : icon.brand,
              )}
            />
          </div>
          <div className={text.statValue}>{expiringItems.length}</div>
          <p className={cn(text.muted, "mt-1")}>Within 3 days</p>
        </StatsCard>

        <StatsCard className="min-w-44 snap-start shrink-0 md:min-w-0 md:shrink">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-secondary">
              Produce
            </span>
            <ShoppingBasket className={cn(icon.small, icon.brand)} />
          </div>
          <div className={text.statValue}>{stats.byCategory.produce ?? 0}</div>
          <p className={cn(text.muted, "mt-1")}>Fresh items</p>
        </StatsCard>

        <StatsCard className="min-w-44 snap-start shrink-0 md:min-w-0 md:shrink">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-secondary">
              Frozen
            </span>
            <Flame className={cn(icon.small, icon.brand)} />
          </div>
          <div className={text.statValue}>{stats.byCategory.frozen ?? 0}</div>
          <p className={cn(text.muted, "mt-1")}>Frozen items</p>
        </StatsCard>
      </div>

      {/* Main Pantry View */}
      <PantryView initialItems={items} expiringItems={expiringItems} />
    </div>
  );
}
