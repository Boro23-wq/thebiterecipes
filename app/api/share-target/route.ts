import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const title = formData.get("title") as string | null;
    const text = formData.get("text") as string | null;
    const url = formData.get("url") as string | null;

    const importUrl = new URL("/dashboard/recipes/import", request.url);

    const sharedUrl = url || extractUrlFromText(text) || "";
    const sharedText = text || "";

    if (sharedUrl) {
      importUrl.searchParams.set("url", sharedUrl);
    }
    if (sharedText && !sharedUrl) {
      importUrl.searchParams.set("text", sharedText);
    }
    if (title) {
      importUrl.searchParams.set("title", title);
    }

    const images = formData.getAll("images") as File[];
    if (images.length > 0) {
      importUrl.searchParams.set("hasImages", String(images.length));
    }

    return NextResponse.redirect(importUrl.toString(), 303);
  } catch (error) {
    console.error("Share target error:", error);
    return NextResponse.redirect(
      new URL("/dashboard/recipes/import", request.url).toString(),
      303,
    );
  }
}

function extractUrlFromText(text: string | null): string | null {
  if (!text) return null;
  const urlMatch = text.match(/https?:\/\/[^\s]+/);
  return urlMatch ? urlMatch[0] : null;
}
