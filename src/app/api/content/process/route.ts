import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { processContent } from "@/lib/content-processor";

const processSchema = z.object({
  contentId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = processSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const content = await db.content.findUnique({
      where: { id: parsed.data.contentId },
    });

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    if (content.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await processContent(parsed.data.contentId);

    const updated = await db.content.findUnique({
      where: { id: parsed.data.contentId },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[CONTENT_PROCESS]", error);
    const message =
      error instanceof Error ? error.message : "Processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
