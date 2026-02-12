"use client";

import { Clock, Users, Star, ImageIcon } from "lucide-react";
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
}

export function RecipeCard({
  id,
  title,
  imageUrl,
  prepTime,
  cookTime,
  totalTime,
  servings,
  difficulty,
  cuisine,
  category,
  calories,
  isFavorite,
  rating,
  createdAt,
}: RecipeCardProps) {
  const src = recipeImageSrc(imageUrl, { mode: "stored" });

  const displayTime =
    totalTime ||
    (prepTime && cookTime ? prepTime + cookTime : prepTime || cookTime);

  const getTimeAgo = (
    date: Date | string | undefined,
  ): { text: string; isRecent: boolean } => {
    if (!date) return { text: "RECENTLY", isRecent: false };

    const now = new Date();
    const dateObj = typeof date === "string" ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) return { text: "RECENTLY", isRecent: false };

    const diffTime = Math.abs(now.getTime() - dateObj.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 1) return { text: "TODAY", isRecent: true };
    if (diffDays === 1) return { text: "YESTERDAY", isRecent: true };
    if (diffDays < 30) return { text: `${diffDays} DAYS AGO`, isRecent: false };
    if (diffDays < 365)
      return {
        text: `${Math.floor(diffDays / 30)} MONTHS AGO`,
        isRecent: false,
      };
    return { text: `${Math.floor(diffDays / 365)} YEARS AGO`, isRecent: false };
  };

  return (
    <Link href={`/dashboard/recipes/${id}`}>
      <div className="overflow-hidden transition-all hover:border-border-brand-subtle cursor-pointer h-full rounded-sm bg-white relative border border-border-brand-light flex flex-col">
        {/* Badge */}
        {category && (
          <div className="absolute top-3 left-3 z-10">
            <span className="bg-white/95 text-text-primary text-xs font-medium px-2.5 py-1 rounded-sm">
              {category}
            </span>
          </div>
        )}

        {/* Image Section - 60% */}
        <div className="h-52 w-full bg-[#FFF4ED] flex items-center justify-center relative">
          {src ? (
            <Image
              src={src}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <ImageIcon className="h-12 w-12 text-[#FF6B35]/30" />
          )}

          <div className="absolute top-3 right-3 z-10">
            <FavoriteButton recipeId={id} isFavorite={isFavorite} />
          </div>
        </div>

        <div className="p-4 space-y-4 bg-[#FFFAF7] flex-1 flex flex-col justify-between">
          <div className="space-y-1">
            {/* Title */}
            <h3 className="text-base font-semibold text-text-primary line-clamp-1">
              {title}
            </h3>

            {/* Cuisine */}
            {/* {cuisine && ( */}
            <p className="text-sm text-text-secondary line-clamp-1">
              {cuisine ? cuisine : "Unknown"}
            </p>
            {/* )} */}
          </div>

          {/* Metrics Row */}
          <div className="flex items-center gap-3 text-xs text-text-primary">
            {displayTime && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-text-secondary" />
                <span>{displayTime} min</span>
              </div>
            )}
            {servings && (
              <>
                <span className="text-text-secondary">•</span>
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-text-secondary" />
                  <span>{servings}</span>
                </div>
              </>
            )}
            {calories && (
              <>
                <span className="text-text-secondary">•</span>
                <span>{calories} cal</span>
              </>
            )}
          </div>

          {/* Footer - Date and Rating */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span
              className={`text-xs font-bold uppercase tracking-tight ${"text-[#FF6B35]"}`}
            >
              {getTimeAgo(createdAt).text}
            </span>
            {rating && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-[#F7B801] text-[#F7B801]" />
                <span className="text-xs text-text-primary font-medium">
                  {rating}/5
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
