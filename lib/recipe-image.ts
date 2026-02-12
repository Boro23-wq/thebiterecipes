export function recipeImageSrc(
  imageUrl?: string | null,
  opts?: { mode?: "preview" | "stored" },
) {
  if (!imageUrl) return null;

  const mode = opts?.mode ?? "stored";

  // Stored recipes should already be hosted (UploadThing/etc.)
  if (mode === "stored") return imageUrl;

  // Preview can be any random host → proxy it
  return `/api/image?url=${encodeURIComponent(imageUrl)}`;
}
