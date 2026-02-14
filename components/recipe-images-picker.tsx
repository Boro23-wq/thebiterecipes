"use client";

import * as React from "react";
import Image from "next/image";
import { ImagePlus, X, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { icon, text } from "@/lib/design-tokens";
import { Button } from "./ui/button";

type ExistingImage = { id: number | string; imageUrl: string };

type Props = {
  name?: string;
  maxSizeMB?: number;
  existingImages?: ExistingImage[];
  title?: string;
  helper?: string;
};

type Slot = {
  file: File | null;
  previewUrl: string | null;
  isNew: boolean;
};

export function RecipeImagesPickerSlots({
  name = "images",
  maxSizeMB = 4,
  existingImages = [],
  title = "Images",
  helper = "Click a slot to add/replace • Or use Change images to select up to 3",
}: Props) {
  const multiInputRef = React.useRef<HTMLInputElement | null>(null);
  const slotInputRef = React.useRef<HTMLInputElement | null>(null);

  const [activeSlotIndex, setActiveSlotIndex] = React.useState<number | null>(
    null,
  );

  // Track slots user explicitly cleared (so server can delete those orders)
  const [clearedSlots, setClearedSlots] = React.useState<number[]>([]);

  // Build initial slots from existing images (up to 3)
  const [slots, setSlots] = React.useState<Slot[]>(() => {
    const base: Slot[] = Array.from({ length: 3 }).map(() => ({
      file: null,
      previewUrl: null,
      isNew: false,
    }));

    existingImages.slice(0, 3).forEach((img, idx) => {
      base[idx] = { file: null, previewUrl: img.imageUrl, isNew: false };
    });

    return base;
  });

  // ✅ FIX: Only update slots if existingImages actually changes the URLs
  // This prevents "Maximum update depth exceeded" when parent passes a new array each render.
  React.useEffect(() => {
    setSlots((prev) => {
      const hasNew = prev.some((s) => s.isNew);
      if (hasNew) return prev;

      const next: Slot[] = Array.from({ length: 3 }).map(() => ({
        file: null,
        previewUrl: null,
        isNew: false,
      }));

      existingImages.slice(0, 3).forEach((img, idx) => {
        next[idx] = { file: null, previewUrl: img.imageUrl, isNew: false };
      });

      const prevUrls = prev.map((s) => s.previewUrl ?? "");
      const nextUrls = next.map((s) => s.previewUrl ?? "");

      const same =
        prevUrls.length === nextUrls.length &&
        prevUrls.every((u, i) => u === nextUrls[i]);

      return same ? prev : next;
    });
  }, [existingImages]);

  function syncMultiInput(nextSlots: Slot[]) {
    const dt = new DataTransfer();
    // IMPORTANT: keep file order in slot order (0 -> 2)
    for (const s of nextSlots) {
      if (s.file) dt.items.add(s.file);
    }
    if (multiInputRef.current) multiInputRef.current.files = dt.files;
  }

  function validateFile(f: File) {
    if (!f.type.startsWith("image/")) return `"${f.name}" is not an image.`;
    if (f.size > maxSizeMB * 1024 * 1024)
      return `"${f.name}" is larger than ${maxSizeMB}MB.`;
    return null;
  }

  function setSlotFile(idx: number, file: File | null) {
    // If user sets a new file for a slot, it should no longer be considered "cleared"
    if (file) {
      setClearedSlots((prev) => prev.filter((n) => n !== idx));
    }

    setSlots((prev) => {
      const next = [...prev];

      const cur = next[idx];
      if (cur?.isNew && cur.previewUrl) URL.revokeObjectURL(cur.previewUrl);

      if (!file) {
        next[idx] = { file: null, previewUrl: null, isNew: false };
      } else {
        const previewUrl = URL.createObjectURL(file);
        next[idx] = { file, previewUrl, isNew: true };
      }

      syncMultiInput(next);
      return next;
    });
  }

  function onClickSlot(idx: number) {
    setActiveSlotIndex(idx);
    slotInputRef.current?.click();
  }

  function onSlotInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";

    if (activeSlotIndex == null || !file) return;

    const err = validateFile(file);
    if (err) {
      alert(err);
      return;
    }

    setSlotFile(activeSlotIndex, file);
    setActiveSlotIndex(null);
  }

  // "Change images" -> user can select up to 3; we treat this as full replace into slots 0..n
  function onMultiChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 3);
    e.target.value = "";

    for (const f of files) {
      const err = validateFile(f);
      if (err) {
        alert(err);
        return;
      }
    }

    // Full replace means previous clears are irrelevant
    setClearedSlots([]);

    setSlots((prev) => {
      // revoke any existing object URLs from previous new selections
      for (const s of prev) {
        if (s.isNew && s.previewUrl) URL.revokeObjectURL(s.previewUrl);
      }

      const filled: Slot[] = Array.from({ length: 3 }).map(() => ({
        file: null,
        previewUrl: null,
        isNew: false,
      }));

      files.forEach((f, i) => {
        filled[i] = {
          file: f,
          previewUrl: URL.createObjectURL(f),
          isNew: true,
        };
      });

      syncMultiInput(filled);
      return filled;
    });
  }

  function clearSlot(idx: number) {
    // Mark this slot as explicitly cleared (so server can delete existing image at this order)
    setClearedSlots((prev) => (prev.includes(idx) ? prev : [...prev, idx]));

    setSlots((prev) => {
      const next = [...prev];
      const cur = next[idx];
      if (cur.isNew && cur.previewUrl) URL.revokeObjectURL(cur.previewUrl);

      next[idx] = { file: null, previewUrl: null, isNew: false };
      syncMultiInput(next);
      return next;
    });
  }

  function clearAll() {
    // Mark all slots cleared (server deletes all)
    setClearedSlots([0, 1, 2]);

    setSlots((prev) => {
      for (const s of prev) {
        if (s.isNew && s.previewUrl) URL.revokeObjectURL(s.previewUrl);
      }
      const empty: Slot[] = Array.from({ length: 3 }).map(() => ({
        file: null,
        previewUrl: null,
        isNew: false,
      }));
      syncMultiInput(empty);
      return empty;
    });
  }

  // Cleanup object URLs on unmount
  React.useEffect(() => {
    return () => {
      for (const s of slots) {
        if (s.isNew && s.previewUrl) URL.revokeObjectURL(s.previewUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-primary">{title}</p>
          <p className={cn(text.muted, "text-xs")}>
            {helper} • Max {maxSizeMB}MB each
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => multiInputRef.current?.click()}
            className="text-xs cursor-pointer w-full sm:w-auto whitespace-nowrap"
          >
            Change images
          </Button>

          <Button
            type="button"
            variant="destructive"
            onClick={clearAll}
            className="text-xs cursor-pointer w-full sm:w-auto whitespace-nowrap"
          >
            Clear all
          </Button>
        </div>
      </div>

      {/* Grid (click each slot to upload one) */}
      <div className="grid grid-cols-3 gap-1 rounded-sm overflow-hidden border border-brand-300 bg-brand-200">
        {slots.map((slot, idx) => {
          const hasImg = !!slot.previewUrl;

          return (
            <div
              key={idx}
              className={cn(
                "relative h-40 bg-brand-200 cursor-pointer group",
                "hover:bg-brand-300 transition-colors",
              )}
              onClick={() => onClickSlot(idx)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onClickSlot(idx);
              }}
            >
              {hasImg ? (
                <>
                  <Image
                    src={slot.previewUrl!}
                    alt={`Recipe image ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

                  <div className="cursor-pointer absolute bottom-2 left-2 bg-white/90 rounded-sm px-2 py-1 text-xs flex items-center gap-1 shadow">
                    <Pencil className="h-3 w-3" />
                    Replace
                  </div>

                  <Button
                    type="button"
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearSlot(idx);
                    }}
                    className="absolute top-2 right-2 rounded-sm shadow p-1"
                    aria-label={`Clear slot ${idx + 1}`}
                    size="xs"
                  >
                    <X />
                  </Button>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <ImagePlus className={cn(icon.large, "text-brand/30")} />
                  <span className={cn(text.muted, "text-xs mt-2")}>
                    Add image
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {slots.map((s, idx) =>
        s.file ? (
          <input
            key={`slot-${idx}`}
            type="hidden"
            name="imageSlot"
            value={String(idx)}
          />
        ) : null,
      )}

      {clearedSlots.map((idx) => (
        <input
          key={`clear-${idx}`}
          type="hidden"
          name="clearSlot"
          value={String(idx)}
        />
      ))}

      <input
        ref={multiInputRef}
        name={name}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onMultiChange}
      />

      <input
        ref={slotInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onSlotInputChange}
      />
    </div>
  );
}
