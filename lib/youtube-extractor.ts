import { YoutubeTranscript } from "youtube-transcript";
import { extractVideoId } from "./platform-detector";
import { parseRecipeWithGemini } from "./gemini";
import { type ExtractorResult } from "./types";

async function fetchVideoData(
  videoId: string,
): Promise<{ title: string; description: string }> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet&key=${process.env.YOUTUBE_API_KEY}`,
      { cache: "no-store" },
    );
    if (!res.ok) return { title: "", description: "" };
    const data = await res.json();
    const snippet = data.items?.[0]?.snippet;
    return {
      title: snippet?.title || "",
      description: snippet?.description || "",
    };
  } catch {
    return { title: "", description: "" };
  }
}

async function fetchTranscript(videoId: string): Promise<string> {
  try {
    const items = await YoutubeTranscript.fetchTranscript(videoId);
    return items.map((item) => item.text).join(" ");
  } catch {
    return "";
  }
}

async function getBestThumbnail(videoId: string): Promise<string> {
  const qualities = ["maxresdefault", "sddefault", "hqdefault"];

  for (const quality of qualities) {
    const url = `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
    try {
      const res = await fetch(url, { method: "HEAD" });
      if (res.ok) return url;
    } catch {
      continue;
    }
  }

  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export async function extractRecipeFromYouTube(
  url: string,
  measurementUnit?: string,
): Promise<ExtractorResult | null> {
  const videoId = extractVideoId(url, "youtube");
  if (!videoId) return null;

  // Fetch metadata and transcript in parallel
  const [{ title, description }, transcript] = await Promise.all([
    fetchVideoData(videoId),
    fetchTranscript(videoId),
  ]);

  console.log(`YouTube videoId: ${videoId}`);
  console.log(`Title: ${title}`);
  console.log(`Description length: ${description.length}`);
  console.log(`Transcript length: ${transcript.length}`);
  console.log(`Description content: ${description}`);

  if (!transcript && description.length < 200) {
    console.log("No transcript + short description — manual paste needed");
  }

  if (!description && !title && !transcript) return null;

  const parts: string[] = [];
  if (title) parts.push(`Video title: ${title}`);
  if (description) parts.push(`Video description:\n${description}`);
  if (transcript) {
    const trimmed =
      transcript.length > 8000 ? transcript.slice(0, 8000) : transcript;
    parts.push(`Video transcript:\n${trimmed}`);
  }

  const recipe = await parseRecipeWithGemini(
    parts.join("\n\n"),
    "YouTube video",
    measurementUnit,
  );
  if (!recipe) return null;

  return {
    recipe,
    imageUrl: await getBestThumbnail(videoId),
    source: url,
  };
}
