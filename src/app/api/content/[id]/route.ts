import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
});

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const content = await db.content.findUnique({
      where: { id },
      include: {
        summary: true,
        flashcards: { orderBy: { order: "asc" } },
        chatMessages: { orderBy: { createdAt: "asc" }, take: 50 },
      },
    });

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    if (content.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const safe = {
      id: content.id,
      type: content.type,
      title: content.title,
      description: content.description,
      status: content.status,
      createdAt: content.createdAt,
      hasExtractedText: !!content.extractedText,
      processingFailedMessage: content.processingError ?? null,
      summary: content.summary,
      flashcards: content.flashcards,
      chatMessages: content.chatMessages,
    };
    return NextResponse.json(safe);
  } catch (error) {
    console.error("[CONTENT_GET_BY_ID]", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const content = await db.content.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    if (content.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.content.delete({ where: { id } });

    return NextResponse.json({ message: "Content deleted" });
  } catch (error) {
    console.error("[CONTENT_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete content" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const content = await db.content.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    if (content.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.content.update({
      where: { id },
      data: { title: parsed.data.title },
    });

    return NextResponse.json({ message: "Title updated" });
  } catch (error) {
    console.error("[CONTENT_PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update content" },
      { status: 500 }
    );
  }
}
