import { getSession } from "@/lib/auth";
import { checkContentTypeAllowed, checkCredits } from "@/lib/credits";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";

const LINK_PREFLIGHT_TIMEOUT_MS = 10_000;

/** Validate that a link URL is reachable and returns HTML. Returns error message or null. */
async function validateLinkUrl(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      LINK_PREFLIGHT_TIMEOUT_MS,
    );
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; QuickLearn/1.0)",
      },
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      if (res.status === 404)
        return 'This link returns "Page not found" (404). Check the URL.';
      if (res.status === 403) return "This link is not accessible (403).";
      if (res.status >= 500)
        return "The website is having problems. Try again later.";
      return `This link returned an error (${res.status}). Please check the URL.`;
    }
    const contentType = (res.headers.get("content-type") ?? "").toLowerCase();
    const allowed =
      contentType.includes("text/html") ||
      contentType.includes("application/pdf") ||
      contentType.includes("text/markdown") ||
      contentType.includes("text/plain") ||
      contentType.includes("text/x-markdown") ||
      contentType.includes("text/x-md") ||
      contentType.includes("text/x-mdx");
    if (!allowed) {
      return "This URL is not a supported page (HTML, PDF, or Markdown). Paste a link to an article, PDF, or markdown page.";
    }
    return null;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return "This link took too long to respond. Try again or use a different page.";
    }
    return "This link could not be reached. Check the URL and your internet connection.";
  }
}

function sanitizeContentForClient(content: {
  id: string;
  type: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: Date;
}) {
  return {
    id: content.id,
    type: content.type,
    title: content.title,
    description: content.description,
    status: content.status,
    createdAt: content.createdAt,
  };
}

const createContentSchema = z.object({
  type: z.enum(["PDF", "YOUTUBE", "AUDIO", "LINK"]),
  title: z.string().max(255).optional(),
  sourceUrl: z.string().url().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "10") || 10),
    );
    const type = searchParams.get("type");
    const skip = (page - 1) * limit;

    const where: {
      userId: string;
      type?: "PDF" | "YOUTUBE" | "AUDIO" | "LINK";
    } = {
      userId: user.id,
    };

    if (type && ["PDF", "YOUTUBE", "AUDIO", "LINK"].includes(type)) {
      where.type = type as "PDF" | "YOUTUBE" | "AUDIO" | "LINK";
    }

    const [contents, total] = await Promise.all([
      db.content.findMany({
        where,
        select: {
          id: true,
          type: true,
          title: true,
          description: true,
          status: true,
          createdAt: true,
          summary: { select: { id: true } },
          _count: { select: { flashcards: true, chatMessages: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.content.count({ where }),
    ]);

    const data = contents.map((c) => ({
      id: c.id,
      type: c.type,
      title: c.title,
      description: c.description,
      status: c.status,
      createdAt: c.createdAt,
      hasSummary: !!c.summary,
      _count: c._count,
    }));

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[CONTENT_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }
    const parsed = createContentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { type, sourceUrl } = parsed.data;
    let title = parsed.data.title;

    if (type === "YOUTUBE" || type === "AUDIO") {
      return NextResponse.json(
        { error: "YouTube and Audio are temporarily disabled." },
        { status: 400 },
      );
    }

    if (type === "PDF") {
      return NextResponse.json(
        { error: "Use POST /api/content/upload for PDF uploads" },
        { status: 400 },
      );
    }

    if (!checkContentTypeAllowed(user.plan, type)) {
      return NextResponse.json(
        {
          error: `Your ${user.plan} plan does not support ${type} content. Please upgrade to access this content type.`,
        },
        { status: 403 },
      );
    }

    const creditCheck = await checkCredits(user.id, user.plan);
    if (!creditCheck.allowed) {
      return NextResponse.json({ error: creditCheck.error }, { status: 429 });
    }

    if (type === "LINK" && sourceUrl) {
      const linkError = await validateLinkUrl(sourceUrl);
      if (linkError) {
        return NextResponse.json({ error: linkError }, { status: 400 });
      }
    }

    if (!title?.trim()) {
      title =
        type === "LINK" && sourceUrl
          ? new URL(sourceUrl).hostname
          : `${type} content`;
    }

    const content = await db.content.create({
      data: {
        userId: user.id,
        type,
        title: title.trim().slice(0, 255),
        sourceUrl,
        status: "PROCESSING",
      },
    });

    return NextResponse.json(sanitizeContentForClient(content), {
      status: 201,
    });
  } catch (error) {
    console.error("[CONTENT_POST]", error);
    return NextResponse.json(
      { error: "Failed to create content" },
      { status: 500 },
    );
  }
}
