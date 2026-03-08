export type Platform =
  | "youtube"
  | "tiktok"
  | "instagram"
  | "pinterest"
  | "recipe_site"
  | "unknown";

export interface PlatformInfo {
  platform: Platform;
  label: string;
  supportsAI: boolean;
}

const PLATFORM_MATCHERS: { platform: Platform; patterns: RegExp[] }[] = [
  {
    platform: "youtube",
    patterns: [
      /^https?:\/\/(www\.)?youtube\.com\/watch/,
      /^https?:\/\/youtu\.be\//,
      /^https?:\/\/(www\.)?youtube\.com\/shorts\//,
    ],
  },
  {
    platform: "tiktok",
    patterns: [
      /^https?:\/\/(www\.)?tiktok\.com\/@[\w.-]+\/video\//,
      /^https?:\/\/vm\.tiktok\.com\//,
      /^https?:\/\/(www\.)?tiktok\.com\/t\//,
    ],
  },
  {
    platform: "instagram",
    patterns: [/^https?:\/\/(www\.)?instagram\.com\/(p|reel|reels)\//],
  },
  {
    platform: "pinterest",
    patterns: [
      /^https?:\/\/(www\.)?pinterest\.(com|co\.uk|ca|com\.au)\/pin\//,
      /^https?:\/\/pin\.it\//,
    ],
  },
];

const PLATFORM_INFO: Record<Platform, { label: string; supportsAI: boolean }> =
  {
    youtube: { label: "YouTube", supportsAI: true },
    tiktok: { label: "TikTok", supportsAI: true },
    instagram: { label: "Instagram", supportsAI: true },
    pinterest: { label: "Pinterest", supportsAI: true },
    recipe_site: { label: "Recipe Website", supportsAI: false },
    unknown: { label: "Unknown", supportsAI: false },
  };

export function detectPlatform(url: string): PlatformInfo {
  const trimmed = url.trim();

  for (const { platform, patterns } of PLATFORM_MATCHERS) {
    if (patterns.some((p) => p.test(trimmed))) {
      return { platform, ...PLATFORM_INFO[platform] };
    }
  }

  // If it's a valid URL but not social media, assume recipe site
  try {
    new URL(trimmed);
    return { platform: "recipe_site", ...PLATFORM_INFO.recipe_site };
  } catch {
    return { platform: "unknown", ...PLATFORM_INFO.unknown };
  }
}

/**
 * Extract video/post ID from platform URLs
 */
export function extractVideoId(url: string, platform: Platform): string | null {
  try {
    switch (platform) {
      case "youtube": {
        const u = new URL(url);
        // youtube.com/watch?v=xxx
        if (u.searchParams.has("v")) return u.searchParams.get("v");
        // youtu.be/xxx
        if (u.hostname === "youtu.be") return u.pathname.slice(1);
        // youtube.com/shorts/xxx
        const shortsMatch = u.pathname.match(/\/shorts\/([^/?]+)/);
        if (shortsMatch) return shortsMatch[1];
        return null;
      }
      case "tiktok": {
        const match = url.match(/\/video\/(\d+)/);
        return match ? match[1] : null;
      }
      case "instagram": {
        const match = url.match(/\/(p|reel|reels)\/([^/?]+)/);
        return match ? match[2] : null;
      }
      case "pinterest": {
        const match = url.match(/\/pin\/(\d+)/);
        return match ? match[1] : null;
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}
