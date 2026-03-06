"use client";

import Link from "next/link";
import { MoreVertical, Pin, Edit, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  togglePinCategory,
  deleteCategory,
} from "@/app/dashboard/categories/actions";
import { useTransition } from "react";
import Image from "next/image";
import { DeleteMenuItem } from "./delete-menu-item";

interface CategoryCardProps {
  id: string;
  name: string;
  description?: string | null;
  isPinned: boolean | null;
  recipeCount: number;
  recipeImages?: (string | null)[];
}

export function CategoryCard({
  id,
  name,
  description,
  isPinned,
  recipeCount,
  recipeImages = [],
}: CategoryCardProps) {
  const [isPending, startTransition] = useTransition();

  const handlePin = () => {
    startTransition(async () => {
      try {
        await togglePinCategory(id);
      } catch (error) {
        alert(
          error instanceof Error ? error.message : "Failed to pin category",
        );
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteCategory(id);
    });
  };

  const images = recipeImages.filter((img): img is string => !!img);
  const count = images.length;

  return (
    <div className="group relative bg-white rounded-sm border border-border-brand-light hover:border-border-brand-subtle transition-all overflow-hidden">
      <Link href={`/dashboard/categories/${id}`}>
        {/* Dynamic Image Layout */}
        <div className="relative h-32 bg-brand-100 overflow-hidden">
          {count === 4 && (
            <div className="grid grid-cols-2 grid-rows-2 h-full gap-0.5">
              {images.map((img, i) => (
                <div key={i} className="relative">
                  <Image
                    src={img}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {count === 3 && (
            <div className="grid grid-rows-2 h-full gap-0.5">
              <div className="relative">
                <Image
                  src={images[0]}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-cover"
                />
              </div>
              <div className="grid grid-cols-2 gap-0.5">
                <div className="relative">
                  <Image src={images[1]} alt="" fill className="object-cover" />
                </div>
                <div className="relative">
                  <Image src={images[2]} alt="" fill className="object-cover" />
                </div>
              </div>
            </div>
          )}

          {count === 2 && (
            <div className="grid grid-rows-2 h-full gap-0.5">
              {images.map((img, i) => (
                <div key={i} className="relative">
                  <Image
                    src={img}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {count === 1 && (
            <div className="relative h-full">
              <Image
                src={images[0]}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 25vw"
                className="object-cover"
              />
            </div>
          )}

          {count === 0 && (
            <div className="flex items-center justify-center h-full bg-brand-200">
              <ImageIcon className="h-8 w-8 text-brand/30" />
            </div>
          )}

          {/* Pin badge */}
          {isPinned && (
            <div className="absolute mt-2 left-2 z-10">
              <div className="bg-white/95 backdrop-blur-sm rounded-sm p-1">
                <Pin className="h-3 w-3 text-brand fill-brand" />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="text-base font-semibold text-text-primary line-clamp-1 flex-1">
              {name}
            </h3>
            <span className="bg-brand-100 text-brand text-xs font-semibold px-2 py-0.5 rounded-sm shrink-0">
              {recipeCount} {recipeCount >= 2 ? "recipes" : "recipe"}
            </span>
          </div>

          {description && (
            <p className="text-sm text-text-secondary line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </Link>

      {/* Actions Menu */}
      <div className="absolute top-2 right-2 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 bg-white/95 backdrop-blur-sm cursor-pointer shadow-xs"
              disabled={isPending}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-48 border-none shadow-menu rounded-sm"
          >
            <DropdownMenuItem
              asChild
              className="cursor-pointer hover:bg-brand-100 hover:text-brand"
            >
              <Link href={`/dashboard/categories/${id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Category
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={handlePin}
              className="cursor-pointer hover:bg-brand-100 hover:text-brand"
              disabled={isPending}
            >
              <Pin className="mr-2 h-4 w-4" />
              {isPinned ? "Unpin" : "Pin to Dashboard"}
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-border-light" />

            <DeleteMenuItem
              label="Delete Category"
              title="Delete Category?"
              description="This action cannot be undone. Recipes inside this category will not be deleted."
              onConfirm={handleDelete}
              disabled={isPending}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
