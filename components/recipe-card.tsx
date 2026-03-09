"use client";

import { Clock, Users, Flame, ImageIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FavoriteButton } from "./favorite-button";
import { recipeImageSrc } from "@/lib/recipe-image";

interface RecipeCardProps {
  id: string;
  title: string;
  imageUrl?: string | null;
  prepTime?: number | null;
  cookTime?: number | null;
  totalTime?: number | null;
  servings?: number | null;
  difficulty?: string | null;
  cuisine?: string | null;
  category?: string | null;
  calories?: number | null;
  isFavorite?: boolean | null;
  isSeeded?: boolean | null;
  rating?: number | null;
  createdAt?: Date | string;
  actions?: React.ReactNode;
}

export function RecipeCard({
  id,
  title,
  imageUrl,
  prepTime,
  cookTime,
  totalTime,
  servings,
  cuisine,
  category,
  calories,
  isFavorite,
  createdAt,
  actions,
}: RecipeCardProps) {
  const src = recipeImageSrc(imageUrl, { mode: "stored" });
  const hasImage = !!src;

  const displayTime =
    totalTime ||
    (prepTime && cookTime ? prepTime + cookTime : prepTime || cookTime);

  const getTimeAgo = (date: Date | string | undefined): string => {
    if (!date) return "RECENTLY";

    const now = new Date();
    const dateObj = typeof date === "string" ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) return "RECENTLY";

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const created = new Date(
      dateObj.getFullYear(),
      dateObj.getMonth(),
      dateObj.getDate(),
    );

    const diffDays = Math.round(
      (today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0) return "TODAY";
    if (diffDays === 1) return "YESTERDAY";
    if (diffDays < 30) return `${diffDays}D AGO`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}MO AGO`;

    return `${Math.floor(diffDays / 365)}Y AGO`;
  };

  return (
    <Link href={`/dashboard/recipes/${id}`}>
      <div className="group relative overflow-hidden rounded-sm border border-border-brand-light hover:border-brand-200 hover:shadow-xs transition-all cursor-pointer h-full">
        <div className="relative h-56 w-full bg-brand-50 flex items-center justify-center overflow-hidden">
          {hasImage ? (
            <Image
              src={src}
              alt={title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <ImageIcon className="h-10 w-10 text-brand/20 absolute top-[25%]" />
          )}

          {/* Top overlays */}
          <div className="absolute top-2 left-2 right-2 flex items-start gap-2 z-10">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span
                className={`backdrop-blur-sm text-[10px] font-semibold px-2 py-0.5 rounded-sm uppercase tracking-wide truncate max-w-[70%] ${
                  hasImage
                    ? "bg-black/50 text-white"
                    : "bg-white/90 text-text-primary"
                }`}
              >
                {category || "RECIPE"}
              </span>
            </div>

            <div className="shrink-0 flex items-center">
              <FavoriteButton recipeId={id} isFavorite={isFavorite} />
              {actions}
            </div>
          </div>

          {/* Gradient */}
          <div
            className={`absolute inset-x-0 bottom-0 h-[75%] bg-linear-to-t z-1 ${
              hasImage
                ? "[background:linear-gradient(to_top,rgba(0,0,0,0.85)_0%,rgba(0,0,0,0.7)_25%,rgba(0,0,0,0.45)_50%,rgba(0,0,0,0.15)_75%,transparent_100%)]"
                : "from-white via-white/70 to-transparent"
            }`}
          />

          {/* Content */}
          <div className="absolute inset-x-0 bottom-0 p-3 z-2">
            <div className="space-y-2">
              <div>
                <h3
                  className={`text-sm font-semibold leading-snug line-clamp-2 ${
                    hasImage ? "text-white" : "text-text-primary"
                  }`}
                >
                  {title}
                </h3>

                <p
                  className={`text-[11px] mt-0.5 truncate ${
                    hasImage ? "text-white/70" : "text-text-muted"
                  }`}
                >
                  {cuisine
                    ? cuisine.charAt(0).toUpperCase() + cuisine.slice(1)
                    : "Unknown cuisine"}
                </p>
              </div>

              <div
                className={`flex items-center justify-between pt-1.5 border-t ${
                  hasImage ? "border-white/15" : "border-brand-100"
                }`}
              >
                <div
                  className={`flex items-center gap-2.5 text-[10px] ${
                    hasImage ? "text-white/70" : "text-text-secondary"
                  }`}
                >
                  {!!displayTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {displayTime}m
                    </span>
                  )}

                  {!!servings && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {servings}
                    </span>
                  )}

                  {!!calories && (
                    <span className="flex items-center gap-1">
                      <Flame className="h-3 w-3" />
                      {calories}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[10px] tracking-wide px-2 py-0.5 ${
                    hasImage
                      ? "bg-black/50 text-white"
                      : "bg-white/90 text-text-primary"
                  }`}
                >
                  {getTimeAgo(createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
