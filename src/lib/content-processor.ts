import { incrementCredits } from "@/lib/credits";
import { db } from "@/lib/db";
import { extractTextFromUrl } from "@/lib/pdf";
import { extractYoutubeTranscript } from "@/lib/youtube";
import * as cheerio from "cheerio";

const MIN_EXTRACTED_LENGTH = 50;

function normalizeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

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

    const trimmed = (extractedText || "").trim();
    if (trimmed.length < MIN_EXTRACTED_LENGTH) {
      await db.content.update({
        where: { id: contentId },
        data: {
          status: "FAILED",
          processingError: trimmed.length
            ? "Extracted text was too short to process."
            : "No text could be extracted from this content.",
        },
      });
      throw new Error("No text could be extracted or text too short.");
    }

    await db.content.update({
      where: { id: contentId },
      data: {
        extractedText: trimmed,
        status: "COMPLETED",
        processingError: null,
      },
    });

    await incrementCredits(content.userId);
  } catch (error) {
    const message = normalizeError(error);
    await db.content.update({
      where: { id: contentId },
      data: {
        status: "FAILED",
        processingError: message,
      },
    });
    throw error;
  }
}

const LINK_FETCH_TIMEOUT_MS = 15_000;
const LINK_USER_AGENT =
  "Mozilla/5.0 (compatible; QuickLearn/1.0; +https://www.quicklearn.to)";

async function extractWebContent(url: string): Promise<string> {
  let response: Response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      LINK_FETCH_TIMEOUT_MS,
    );
    response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": LINK_USER_AGENT },
    });
    clearTimeout(timeoutId);
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === "AbortError") {
        throw new Error(
          "The link took too long to load. Try again or use a faster page.",
        );
      }
      if (
        err.cause instanceof Error &&
        /fetch failed|ECONNREFUSED|ENOTFOUND|ETIMEDOUT/i.test(err.cause.message)
      ) {
        throw new Error(
          "This link could not be reached. Check the URL and your connection.",
        );
      }
    }
    throw new Error(
      "This link could not be loaded. Check the URL and try again.",
    );
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        "Page not found (404). The link may be broken or removed.",
      );
    }
    if (response.status === 403) {
      throw new Error("Access denied (403). This page cannot be read.");
    }
    if (response.status >= 500) {
      throw new Error("The website is having problems. Try again later.");
    }
    throw new Error(
      `The link returned an error (${response.status}). Please check the URL.`,
    );
  }

  const contentType = (
    response.headers.get("content-type") ?? ""
  ).toLowerCase();

  if (contentType.includes("application/pdf")) {
    return extractTextFromUrl(url);
  }

  if (
    contentType.includes("text/markdown") ||
    contentType.includes("text/plain") ||
    contentType.includes("text/x-markdown") ||
    contentType.includes("text/x-md") ||
    contentType.includes("text/x-mdx")
  ) {
    const raw = await response.text();
    const trimmed = raw.replace(/\s+/g, " ").trim();
    if (trimmed.length < 50) {
      throw new Error("No readable content was found.");
    }
    return trimmed;
  }

  if (!contentType.includes("text/html")) {
    throw new Error(
      "This link is not a supported page (HTML, PDF, or Markdown). Use a different URL.",
    );
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  $("script, style, nav, footer, header, aside, iframe, noscript").remove();

  const selectors = [
    "article",
    "main",
    '[role="main"]',
    ".content",
    "#content",
  ];
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

  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length < 100) {
    throw new Error("No readable article content was found on this page.");
  }

  return trimmed;
}
