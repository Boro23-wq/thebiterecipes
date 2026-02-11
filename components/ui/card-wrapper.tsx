import { cn } from "@/lib/utils";
import { card } from "@/lib/design-tokens";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(card.base, className)} {...props} />;
}

export function CardSm({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(card.baseSm, className)} {...props} />;
}

export function StatsCard({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(card.stats, className)} {...props} />;
}

export function ContentCard({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(card.content, className)} {...props} />;
}

// For stat items inside cards
export function StatItem({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  description?: string;
}) {
  return (
    <div className="flex flex-col gap-1 p-3 bg-brand-100 rounded-sm">
      <div className="flex items-center gap-2 text-text-secondary">
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
      </div>
      <span className="text-lg font-semibold text-text-primary">{value}</span>
      {description && (
        <p className="text-xs text-text-secondary mt-0.5">{description}</p>
      )}
    </div>
  );
}
