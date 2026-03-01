import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { apiError } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20") || 20));
    const search = searchParams.get("search") || "";
    const plan = searchParams.get("plan");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (plan && ["FREE", "PRO", "ENTERPRISE"].includes(plan)) {
      where.plan = plan;
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          plan: true,
          credits: true,
          totalCreditsUsed: true,
          emailVerified: true,
          createdAt: true,
          _count: {
            select: {
              contents: true,
              subscriptions: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.user.count({ where }),
    ]);

    return NextResponse.json({
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return apiError("[ADMIN_USERS]", error);
  }
}

const updateUserSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  plan: z.enum(["FREE", "PRO", "ENTERPRISE"]).optional(),
  credits: z.number().int().min(0).max(999999).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { userId, role, plan, credits } = parsed.data;

    if (userId === admin.id && role && role !== admin.role) {
      return NextResponse.json(
        { error: "You cannot change your own role" },
        { status: 400 }
      );
    }

    const targetUser = await db.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent demoting the first user (server owner) from ADMIN
    if (role === "USER" && targetUser.role === "ADMIN") {
      const firstUser = await db.user.findFirst({
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });
      if (firstUser && firstUser.id === targetUser.id) {
        return NextResponse.json(
          { error: "The first account cannot be demoted from admin." },
          { status: 400 }
        );
      }
    }

    const data: Record<string, unknown> = {};
    if (role !== undefined) data.role = role;
    if (plan !== undefined) {
      data.plan = plan;
      const creditsMap = { FREE: 5, PRO: 50, ENTERPRISE: 999999 };
      data.credits = credits !== undefined ? credits : creditsMap[plan];
    }
    if (credits !== undefined && plan === undefined) data.credits = credits;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        plan: true,
        credits: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    return apiError("[ADMIN_USERS_PATCH]", error);
  }
}

const deleteUserSchema = z.object({
  userId: z.string().uuid(),
});

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const parsed = deleteUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { userId } = parsed.data;

    if (userId === admin.id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    const targetUser = await db.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const firstUser = await db.user.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (firstUser && firstUser.id === targetUser.id) {
      return NextResponse.json(
        { error: "The first account cannot be deleted." },
        { status: 400 }
      );
    }

    await db.user.delete({ where: { id: userId } });

    return NextResponse.json({ message: "User deleted" });
  } catch (error) {
    return apiError("[ADMIN_USERS_DELETE]", error);
  }
}
