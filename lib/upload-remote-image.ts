"use server";

import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

function isHttpUrl(raw: string) {
  try {
    const u = new URL(raw);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function uploadRemoteImageToUploadThing(remoteUrl: string) {
  if (!isHttpUrl(remoteUrl)) throw new Error("Invalid image URL");

  const u = new URL(remoteUrl);

  const res = await fetch(remoteUrl, {
    redirect: "follow",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      Referer: u.origin,
    },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    throw new Error(`Not an image (content-type: ${contentType})`);
  }

  const buf = await res.arrayBuffer();

  const ext = contentType.includes("png")
    ? "png"
    : contentType.includes("webp")
      ? "webp"
      : contentType.includes("gif")
        ? "gif"
        : "jpg";

  const file = new File([buf], `recipe.${ext}`, { type: contentType });

  const result = await utapi.uploadFiles(file);

  // uploadFiles can return either a single result or an array (depending on version)
  const first = Array.isArray(result) ? result[0] : result;

  const hostedUrl = first?.data?.url;

  if (!hostedUrl) {
    // dump something useful into logs
    console.error("UploadThing upload result:", result);
    throw new Error(
      `UploadThing upload failed${first?.error ? `: ${JSON.stringify(first.error)}` : ""}`,
    );
  }

  return hostedUrl;
}
