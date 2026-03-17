import * as cheerio from "cheerio";
import { parseRecipeWithGemini } from "./gemini";
import { type ExtractorResult } from "./types";

/**
 * Fetch video caption via oEmbed (no API key needed)
 */
async function fetchOEmbedData(
  url: string,
): Promise<{ title: string; authorName: string; thumbnailUrl: string } | null> {
  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    const res = await fetch(oembedUrl, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      title: data.title || "",
      authorName: data.author_name || "",
      thumbnailUrl: data.thumbnail_url || "",
    };
  } catch {
    return null;
  }
}
/**
 * Try to get more data from the page HTML
 * TikTok embeds video info in meta tags and __UNIVERSAL_DATA_FOR_REHYDRATION__
 */
async function fetchPageData(
  url: string,
): Promise<{ description: string; hashtags: string[] }> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      cache: "no-store",
    });
    if (!res.ok) return { description: "", hashtags: [] };

    const html = await res.text();
    const $ = cheerio.load(html);

    // Meta description often has the full caption
    const description =
      $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") ||
      "";

    // Try to extract from the hydration JSON
    let fullDesc = "";
    const hashtags: string[] = [];

    $("script").each((_, el) => {
      const text = $(el).text();
      if (text.includes("__UNIVERSAL_DATA_FOR_REHYDRATION__")) {
        const match = text.match(
          /__UNIVERSAL_DATA_FOR_REHYDRATION__\s*=\s*({[\s\S]+?});/,
        );
        if (match) {
          try {
            const data = JSON.parse(match[1]);
            // TikTok nests video data deeply — try common paths
            const videoData =
              data?.["__DEFAULT_SCOPE__"]?.["webapp.video-detail"]?.itemInfo
                ?.itemStruct;
            if (videoData) {
              fullDesc = videoData.desc || "";
              if (Array.isArray(videoData.textExtra)) {
                for (const tag of videoData.textExtra) {
                  if (tag.hashtagName) hashtags.push(tag.hashtagName);
                }
              }
            }
          } catch {
            // ignore
          }
        }
      }
    });

    return {
      description: fullDesc || description,
      hashtags,
    };
  } catch {
    return { description: "", hashtags: [] };
  }
}

/**
 * Main TikTok extractor
 */
export async function extractRecipeFromTikTok(
  url: string,
  measurementUnit?: string,
): Promise<ExtractorResult | null> {
  // Fetch oEmbed and page data in parallel
  const [oembed, pageData] = await Promise.all([
    fetchOEmbedData(url),
    fetchPageData(url),
  ]);

  const title = oembed?.title || "";
  const description = pageData.description || "";
  const hashtags = pageData.hashtags;

  console.log(`TikTok title: ${title}`);
  console.log(`Description length: ${description.length}`);
  console.log(`Description content: ${description}`);
  console.log(`Hashtags: ${hashtags.join(", ")}`);

  // Need at least something to work with
  if (!title && !description) {
    return null;
  }

  const parts: string[] = [];

  if (title) {
    parts.push(`Video caption: ${title}`);
  }

  if (description && description !== title) {
    parts.push(`Video description: ${description}`);
  }

  if (hashtags.length > 0) {
    parts.push(`Hashtags: ${hashtags.join(", ")}`);
  }

  if (oembed?.authorName) {
    parts.push(`Creator: ${oembed.authorName}`);
  }

  const rawText = parts.join("\n\n");

  const recipe = await parseRecipeWithGemini(
    rawText,
    "TikTok video",
    measurementUnit,
  );

  if (!recipe) return null;

  return {
    recipe,
    imageUrl: oembed?.thumbnailUrl || undefined,
    source: url,
  };
}
