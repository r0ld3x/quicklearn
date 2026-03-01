import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = req.nextUrl;
    const search = searchParams.get("search") || "";
    const plan = searchParams.get("plan");

    const where: Record<string, unknown> = {};

    if (plan && ["PRO", "ENTERPRISE"].includes(plan)) {
      where.plan = plan;
    }

    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    const [subscriptions, totalActive, totalRevenue] = await Promise.all([
      db.subscription.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      db.subscription.count({ where: { status: "ACTIVE" } }),
      db.subscription.aggregate({
        _sum: { amount: true },
        where: { status: "ACTIVE" },
      }),
    ]);

    const byPlan = await db.subscription.groupBy({
      by: ["plan"],
      where: { status: "ACTIVE" },
      _count: { _all: true },
    });

    return NextResponse.json({
      data: subscriptions,
      summary: {
        totalActive,
        totalRevenue: totalRevenue._sum.amount || 0,
        byPlan: byPlan.map((g) => ({ plan: g.plan, count: g._count._all })),
      },
    });
  } catch (error) {
    console.error("[ADMIN_SUBSCRIPTIONS]", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch subscriptions";
    const status = message.includes("required") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
