import { db } from "@/lib/db";
import { extractTextFromUrl } from "@/lib/pdf";
import { extractYoutubeTranscript } from "@/lib/youtube";
import * as cheerio from "cheerio";

export async function processContent(contentId: string): Promise<void> {
  const content = await db.content.findUnique({
    where: { id: contentId },
  });

  if (!content) {
    throw new Error("Content not found");
  }

  try {
    let extractedText = "";

    switch (content.type) {
      case "PDF": {
        if (!content.fileUrl) throw new Error("No file URL for PDF content");
        extractedText = await extractTextFromUrl(content.fileUrl);
        break;
      }
      case "YOUTUBE": {
        if (!content.sourceUrl)
          throw new Error("No source URL for YouTube content");
        extractedText = await extractYoutubeTranscript(content.sourceUrl);
        break;
      }
      case "AUDIO": {
        extractedText =
          content.description || "Audio content processing placeholder";
        break;
      }
      case "LINK": {
        if (!content.sourceUrl)
          throw new Error("No source URL for link content");
        extractedText = await extractWebContent(content.sourceUrl);
        break;
      }
    }

    await db.content.update({
      where: { id: contentId },
      data: {
        extractedText,
        status: "COMPLETED",
      },
    });
  } catch (error) {
    await db.content.update({
      where: { id: contentId },
      data: { status: "FAILED" },
    });
    throw error;
  }
}

async function extractWebContent(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; QuickLearn/1.0; +https://quicklearn.app)",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  $("script, style, nav, footer, header, aside, iframe, noscript").remove();

  const selectors = ["article", "main", '[role="main"]', ".content", "#content"];
  let text = "";

  for (const selector of selectors) {
    const el = $(selector);
    if (el.length) {
      text = el.text();
      break;
    }
  }

  if (!text) {
    text = $("body").text();
  }

  return text.replace(/\s+/g, " ").trim();
}
