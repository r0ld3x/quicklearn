import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { checkCredits, incrementCredits } from "@/lib/credits";
import { createPlaceholderSummary, scheduleSummaryGeneration } from "@/lib/summarize";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const content = await db.content.findUnique({
      where: { id },
      select: { id: true, userId: true, summary: { select: { id: true } } },
    });

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    if (content.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!content.summary) {
      return NextResponse.json(
        { error: "No summary to regenerate" },
        { status: 400 }
      );
    }

    const creditCheck = await checkCredits(user.id, user.plan);
    if (!creditCheck.allowed) {
      return NextResponse.json(
        { error: creditCheck.error },
        { status: 429 }
      );
    }

    await incrementCredits(user.id);
    await db.summary.delete({ where: { contentId: id } });
    await createPlaceholderSummary(id);
    scheduleSummaryGeneration(id);

    return NextResponse.json(
      { message: "Summary regeneration started", contentId: id },
      { status: 202 }
    );
  } catch (error) {
    console.error("[CONTENT_REGENERATE]", error);
    return NextResponse.json(
      { error: "Regeneration failed" },
      { status: 500 }
    );
  }
}
