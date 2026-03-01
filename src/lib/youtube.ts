import { YoutubeTranscript } from "youtube-transcript";

/**
 * Fetches the video title from YouTube via oEmbed (no API key required).
 */
export async function getYoutubeVideoTitle(url: string): Promise<string> {
  const videoId = getYoutubeVideoId(url);
  const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
  const res = await fetch(oembedUrl, {
    headers: {
      "User-Agent": "QuickLearn/1.0 (https://www.quicklearn.me)",
    },
  });
  if (!res.ok) return `YouTube video ${videoId}`;
  const data = (await res.json()) as { title?: string };
  return data.title?.trim() || `YouTube video ${videoId}`;
}

export function getYoutubeVideoId(url: string): string {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  throw new Error("Invalid YouTube URL");
}

export function formatTranscript(
  items: { text: string; offset: number }[]
): string {
  return items.map((item) => item.text).join(" ");
}

export async function extractYoutubeTranscript(url: string): Promise<string> {
  const videoId = getYoutubeVideoId(url);
  const transcript = await YoutubeTranscript.fetchTranscript(videoId);
  return formatTranscript(
    transcript.map((item) => ({ text: item.text, offset: item.offset }))
  );
}
