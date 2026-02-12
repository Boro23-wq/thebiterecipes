import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isSafeHttpUrl(raw: string) {
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;

    const host = u.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0")
      return false;
    if (host.endsWith(".local")) return false;

    return true;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get("url");
  if (!rawUrl || !isSafeHttpUrl(rawUrl)) {
    return new Response("Invalid url", { status: 400 });
  }

  const u = new URL(rawUrl);

  try {
    const upstream = await fetch(rawUrl, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: u.origin,
        Origin: u.origin,
        "Accept-Language": "en-US,en;q=0.9",
      },
      cache: "no-store",
    });

    if (!upstream.ok) {
      const ct = upstream.headers.get("content-type") || "";
      return new Response(
        `Upstream error ${upstream.status}. content-type=${ct}`,
        { status: 502 },
      );
    }

    const contentType = upstream.headers.get("content-type") || "";

    if (!contentType.startsWith("image/")) {
      const text = await upstream.text().catch(() => "");
      const preview = text.slice(0, 200);
      return new Response(
        `Not an image. content-type=${contentType}. preview=${preview}`,
        { status: 415 },
      );
    }

    if (!upstream.body) {
      const buf = await upstream.arrayBuffer();
      return new Response(buf, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400, s-maxage=86400",
        },
      });
    }

    return new Response(upstream.body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (e) {
    return new Response("Proxy error", { status: 500 });
  }
}
