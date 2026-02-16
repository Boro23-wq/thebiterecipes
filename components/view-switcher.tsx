"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

type ViewOption = {
  value: string;
  icon: LucideIcon;
  label: string;
};

type ViewSwitcherProps = {
  options: ViewOption[];
  currentView: string;
  className?: string;
} & (
  | {
      mode: "onClick";
      onViewChange: (view: string) => void;
    }
  | {
      mode: "link";
      getLinkHref: (view: string) => string;
    }
);

export default function ViewSwitcher(props: ViewSwitcherProps) {
  const { options, currentView, className } = props;

  return (
    <div
      className={cn(
        "inline-flex w-fit shrink-0 items-center bg-brand-300 rounded-sm p-1.5 gap-1",
        className,
      )}
    >
      {options.map((option) => {
        const isActive = currentView === option.value;
        const Icon = option.icon;

        const buttonContent = (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-7 w-7 p-0 rounded-sm transition-colors cursor-pointer",
              isActive
                ? "bg-brand text-white hover:bg-brand/90 hover:text-white"
                : "text-text-secondary hover:bg-brand-200 hover:text-text-primary",
            )}
            title={option.label}
            {...(props.mode === "onClick"
              ? { onClick: () => props.onViewChange(option.value) }
              : {})}
          >
            <Icon className="h-4 w-4" />
          </Button>
        );

        if (props.mode === "link") {
          return (
            <Link key={option.value} href={props.getLinkHref(option.value)}>
              {buttonContent}
            </Link>
          );
        }

        return <div key={option.value}>{buttonContent}</div>;
      })}
    </div>
  );
}
