import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

const feedbackSchema = z.object({
  type: z.enum(["BUG", "FEATURE", "GENERAL"]),
  subject: z.string().min(1).max(255),
  message: z.string().min(1).max(5000),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = feedbackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const feedback = await db.feedback.create({
      data: {
        userId: user.id,
        type: parsed.data.type,
        subject: parsed.data.subject,
        message: parsed.data.message,
      },
    });

    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    console.error("[FEEDBACK_POST]", error);
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const feedbacks = await db.feedback.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: feedbacks });
  } catch (error) {
    console.error("[FEEDBACK_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}
