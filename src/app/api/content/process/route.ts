import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { db } from "@/lib/db";
import { requireContentOwner } from "@/lib/auth";
import { checkCredits } from "@/lib/credits";
import { processContent } from "@/lib/content-processor";
import { createPlaceholderSummary, scheduleSummaryGeneration } from "@/lib/summarize";
import { apiError } from "@/lib/api-utils";

const processSchema = z.object({
  contentId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    const parsed = processSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { user, content } = await requireContentOwner(parsed.data.contentId);

    if (content.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Content has already been processed" },
        { status: 409 }
      );
    }

    // Allow retry for FAILED; reserve credit before processing (only consumed on success in processor)
    const creditCheck = await checkCredits(user.id, user.plan);
    if (!creditCheck.allowed) {
      return NextResponse.json(
        { error: creditCheck.error },
        { status: 429 }
      );
    }

    // Reset to PROCESSING so UI shows progress; clear previous error
    if (content.status === "FAILED") {
      await db.content.update({
        where: { id: content.id },
        data: { status: "PROCESSING", processingError: null },
      });
    }

    await processContent(parsed.data.contentId);

    const updated = await db.content.findUnique({
      where: { id: parsed.data.contentId },
      select: { id: true, status: true },
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    if (updated.status === "COMPLETED") {
      await createPlaceholderSummary(updated.id);
      scheduleSummaryGeneration(updated.id);
    }

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
    });
  } catch (error) {
    return apiError("[CONTENT_PROCESS]", error, "Processing failed");
  }
}
