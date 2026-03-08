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

  const displayTime =
    totalTime ||
    (prepTime && cookTime ? prepTime + cookTime : prepTime || cookTime);

  const getTimeAgo = (date: Date | string | undefined): string => {
    if (!date) return "RECENTLY";

    const now = new Date();
    const dateObj = typeof date === "string" ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) return "RECENTLY";

    const diffTime = Math.abs(now.getTime() - dateObj.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 1) return "TODAY";
    if (diffDays === 1) return "YESTERDAY";
    if (diffDays < 30) return `${diffDays}D AGO`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}MO AGO`;
    return `${Math.floor(diffDays / 365)}Y AGO`;
  };

  return (
    <Link href={`/dashboard/recipes/${id}`}>
      <div className="group overflow-hidden rounded-sm border border-border-brand-light bg-white hover:border-brand-200 hover:shadow-xs transition-all cursor-pointer h-full flex flex-col">
        {/* Image */}
        <div className="relative h-40 w-full bg-brand-50 flex items-center justify-center overflow-hidden">
          {src ? (
            <Image
              src={src}
              alt={title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <ImageIcon className="h-10 w-10 text-brand/20" />
          )}

          {/* Overlays */}
          <div className="absolute top-2 left-2 right-2 flex items-start gap-2">
            {/* LEFT SIDE */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {category && (
                <span className="bg-white/90 backdrop-blur-sm text-text-primary text-[10px] font-semibold px-2 py-0.5 rounded-sm uppercase tracking-wide truncate max-w-[70%]">
                  {category}
                </span>
              )}
            </div>

            {/* RIGHT SIDE - ALWAYS RIGHT */}
            <div className="shrink-0 flex items-center">
              <FavoriteButton recipeId={id} isFavorite={isFavorite} />
              {actions}
            </div>
          </div>

          {/* Time pill on image */}
          {!!displayTime && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-sm">
              <Clock className="h-2.5 w-2.5" />
              {displayTime}m
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 flex-1 flex flex-col justify-between gap-2 bg-brand-50/30">
          <div>
            <h3 className="text-sm font-semibold text-text-primary leading-snug line-clamp-2  transition-colors">
              {title}
            </h3>
            <p className="text-[11px] text-text-muted mt-0.5 truncate">
              {cuisine || "Unknown cuisine"}
            </p>
          </div>

          {/* Bottom row */}
          <div className="flex items-center justify-between pt-2 border-t border-brand-100">
            <div className="flex items-center gap-2.5 text-[10px] text-text-secondary">
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
            <span className="text-[10px] font-bold tracking-tight text-brand">
              {getTimeAgo(createdAt)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
