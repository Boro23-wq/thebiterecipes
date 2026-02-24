"use client";

import * as React from "react";
import { ImagePlus, X, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { icon, text } from "@/lib/design-tokens";
import { Button } from "./ui/button";
import Image from "next/image";

type ExistingImage = { id: number | string; imageUrl: string };

type Props = {
  maxSizeMB?: number;
  existingImages?: ExistingImage[];
  title?: string;
  helper?: string;
};

type Slot = {
  previewUrl: string | null;
  uploadedUrl: string | null;
  isUploading: boolean;
};

export function RecipeImagesPickerSlots({
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
  const [clearedSlots, setClearedSlots] = React.useState<number[]>([]);

  const [slots, setSlots] = React.useState<Slot[]>(() => {
    const base: Slot[] = Array.from({ length: 3 }).map(() => ({
      previewUrl: null,
      uploadedUrl: null,
      isUploading: false,
    }));

    existingImages.slice(0, 3).forEach((img, idx) => {
      base[idx] = {
        previewUrl: img.imageUrl,
        uploadedUrl: img.imageUrl,
        isUploading: false,
      };
    });

    return base;
  });

  React.useEffect(() => {
    setSlots((prev) => {
      if (prev.some((s) => s.isUploading)) return prev;

      const next: Slot[] = Array.from({ length: 3 }).map(() => ({
        previewUrl: null,
        uploadedUrl: null,
        isUploading: false,
      }));

      existingImages.slice(0, 3).forEach((img, idx) => {
        next[idx] = {
          previewUrl: img.imageUrl,
          uploadedUrl: img.imageUrl,
          isUploading: false,
        };
      });

      const prevUrls = prev.map((s) => s.uploadedUrl ?? "");
      const nextUrls = next.map((s) => s.uploadedUrl ?? "");
      const same =
        prevUrls.length === nextUrls.length &&
        prevUrls.every((u, i) => u === nextUrls[i]);

      return same ? prev : next;
    });
  }, [existingImages]);

  function validateFile(f: File) {
    if (!f.type.startsWith("image/")) return `"${f.name}" is not an image.`;
    if (f.size > maxSizeMB * 1024 * 1024)
      return `"${f.name}" is larger than ${maxSizeMB}MB.`;
    return null;
  }

  async function uploadFileToSlot(idx: number, file: File) {
    const blobUrl = URL.createObjectURL(file);

    setSlots((prev) => {
      const next = [...prev];
      const old = next[idx]?.previewUrl;
      if (old?.startsWith("blob:")) URL.revokeObjectURL(old);
      next[idx] = { previewUrl: blobUrl, uploadedUrl: null, isUploading: true };
      return next;
    });

    setClearedSlots((prev) => prev.filter((n) => n !== idx));

    try {
      const body = new FormData();
      body.append("file", file);

      const res = await fetch("/api/upload-image", { method: "POST", body });
      const data = await res.json();

      if (!res.ok || !data.url) throw new Error(data.error || "Upload failed");

      setSlots((prev) => {
        const next = [...prev];
        next[idx] = {
          previewUrl: data.url,
          uploadedUrl: data.url,
          isUploading: false,
        };
        return next;
      });
    } catch (err) {
      setSlots((prev) => {
        const next = [...prev];
        if (next[idx]?.previewUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(next[idx].previewUrl!);
        }
        next[idx] = { previewUrl: null, uploadedUrl: null, isUploading: false };
        return next;
      });
      throw err;
    }
  }

  function onClickSlot(idx: number) {
    setActiveSlotIndex(idx);
    slotInputRef.current?.click();
  }

  async function onSlotInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";

    if (activeSlotIndex == null || !file) return;

    const err = validateFile(file);
    if (err) {
      alert(err);
      return;
    }

    try {
      await uploadFileToSlot(activeSlotIndex, file);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setActiveSlotIndex(null);
    }
  }

  async function onMultiChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 3);
    e.target.value = "";

    for (const f of files) {
      const err = validateFile(f);
      if (err) {
        alert(err);
        return;
      }
    }

    setClearedSlots([]);

    for (let i = 0; i < files.length; i++) {
      try {
        await uploadFileToSlot(i, files[i]);
      } catch (e) {
        alert(e instanceof Error ? e.message : "Upload failed.");
        return;
      }
    }

    if (files.length < 3) {
      setSlots((prev) => {
        const next = [...prev];
        for (let i = files.length; i < 3; i++) {
          if (next[i]?.previewUrl?.startsWith("blob:")) {
            URL.revokeObjectURL(next[i].previewUrl!);
          }
          next[i] = { previewUrl: null, uploadedUrl: null, isUploading: false };
        }
        return next;
      });
    }
  }

  function clearSlot(idx: number) {
    setClearedSlots((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
    setSlots((prev) => {
      const next = [...prev];
      if (next[idx]?.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(next[idx].previewUrl!);
      }
      next[idx] = { previewUrl: null, uploadedUrl: null, isUploading: false };
      return next;
    });
  }

  function clearAll() {
    setClearedSlots([0, 1, 2]);
    setSlots((prev) => {
      for (const s of prev) {
        if (s.previewUrl?.startsWith("blob:"))
          URL.revokeObjectURL(s.previewUrl);
      }
      return Array.from({ length: 3 }).map(() => ({
        previewUrl: null,
        uploadedUrl: null,
        isUploading: false,
      }));
    });
  }

  React.useEffect(() => {
    return () => {
      for (const s of slots) {
        if (s.previewUrl?.startsWith("blob:"))
          URL.revokeObjectURL(s.previewUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isAnyUploading = slots.some((s) => s.isUploading);

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
                  {/* Use <img> so no next.config remotePatterns needed for blob URLs */}
                  <Image
                    src={slot.previewUrl!}
                    alt={`Recipe image ${idx + 1}`}
                    fill
                    className="object-cover"
                    unoptimized={slot.previewUrl!.startsWith("blob:")}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

                  {slot.isUploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-xs font-medium">
                        Uploading…
                      </span>
                    </div>
                  )}

                  {!slot.isUploading && (
                    <div className="cursor-pointer absolute bottom-2 left-2 bg-white/90 rounded-sm px-2 py-1 text-xs flex items-center gap-1 shadow">
                      <Pencil className="h-3 w-3" />
                      Replace
                    </div>
                  )}

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
                    disabled={slot.isUploading}
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

      {/* Hidden inputs: only URLs, no raw files */}
      {slots.map((s, idx) =>
        s.uploadedUrl ? (
          <input
            key={`img-${idx}`}
            type="hidden"
            name="slotImageUrl"
            value={`${idx}:${s.uploadedUrl}`}
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

      {/* File inputs for selection only — NOT part of the form (no name attr) */}
      <input
        ref={multiInputRef}
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

      {isAnyUploading && (
        <p className="text-xs text-text-muted mt-2">
          Please wait for uploads to finish before submitting.
        </p>
      )}
    </div>
  );
}
