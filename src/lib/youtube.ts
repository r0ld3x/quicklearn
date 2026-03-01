import { YoutubeTranscript } from "youtube-transcript";

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
