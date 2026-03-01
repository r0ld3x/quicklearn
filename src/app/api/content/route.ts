import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

const createContentSchema = z.object({
  type: z.enum(["PDF", "YOUTUBE", "AUDIO", "LINK"]),
  title: z.string().min(1).max(255),
  sourceUrl: z.string().url().optional(),
  fileUrl: z.string().url().optional(),
  fileKey: z.string().optional(),
  originalFilename: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const type = searchParams.get("type");
    const skip = (page - 1) * limit;

    const where: { userId: string; type?: "PDF" | "YOUTUBE" | "AUDIO" | "LINK" } = {
      userId: user.id,
    };

    if (type && ["PDF", "YOUTUBE", "AUDIO", "LINK"].includes(type)) {
      where.type = type as "PDF" | "YOUTUBE" | "AUDIO" | "LINK";
    }

    const [contents, total] = await Promise.all([
      db.content.findMany({
        where,
        include: {
          summary: { select: { id: true } },
          _count: { select: { flashcards: true, chatMessages: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.content.count({ where }),
    ]);

    const data = contents.map((c: (typeof contents)[number]) => ({
      ...c,
      hasSummary: !!c.summary,
      summary: undefined,
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
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createContentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { type, title, sourceUrl, fileUrl, fileKey, originalFilename } =
      parsed.data;

    const content = await db.content.create({
      data: {
        userId: user.id,
        type,
        title,
        sourceUrl,
        fileUrl,
        fileKey,
        originalFilename,
        status: "PROCESSING",
      },
    });

    return NextResponse.json(content, { status: 201 });
  } catch (error) {
    console.error("[CONTENT_POST]", error);
    return NextResponse.json(
      { error: "Failed to create content" },
      { status: 500 }
    );
  }
}
