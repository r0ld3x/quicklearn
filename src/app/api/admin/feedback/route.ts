import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { FeedbackStatus, FeedbackType } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { apiError } from "@/lib/api-utils";

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["PENDING", "REVIEWED", "RESOLVED"]),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: { status?: FeedbackStatus; type?: FeedbackType } = {};
    if (status && ["PENDING", "REVIEWED", "RESOLVED"].includes(status)) {
      where.status = status as FeedbackStatus;
    }
    if (type && ["BUG", "FEATURE", "GENERAL"].includes(type)) {
      where.type = type as FeedbackType;
    }

    const [feedbacks, total] = await Promise.all([
      db.feedback.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.feedback.count({ where }),
    ]);

    const data = feedbacks.map((f) => ({
      id: f.id,
      type: f.type,
      subject: f.subject,
      message: f.message,
      status: f.status,
      createdAt: f.createdAt.toISOString(),
      user: f.user,
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
    return apiError("[ADMIN_FEEDBACK_GET]", error, "Failed to fetch feedback");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    await db.feedback.update({
      where: { id: parsed.data.id },
      data: { status: parsed.data.status },
    });

    return NextResponse.json({ message: "Feedback updated" });
  } catch (error) {
    return apiError("[ADMIN_FEEDBACK_PATCH]", error, "Failed to update feedback");
  }
}
