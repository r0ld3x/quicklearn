import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();

    const [
      totalUsers,
      activeSubscriptions,
      totalContent,
      totalFeedback,
      revenueResult,
      usersByPlan,
      contentByType,
      recentUsers,
    ] = await Promise.all([
      db.user.count(),
      db.subscription.count({ where: { status: "ACTIVE" } }),
      db.content.count(),
      db.feedback.count(),
      db.subscription.aggregate({
        _sum: { amount: true },
        where: { status: "ACTIVE" },
      }),
      db.user.groupBy({
        by: ["plan"],
        _count: { _all: true },
      }),
      db.content.groupBy({
        by: ["type"],
        _count: { _all: true },
      }),
      db.user.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          plan: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      totalUsers,
      activeSubscriptions,
      totalContent,
      totalFeedback,
      totalRevenue: revenueResult._sum.amount || 0,
      usersByPlan: usersByPlan.map((g) => ({
        plan: g.plan,
        count: g._count._all,
      })),
      contentByType: contentByType.map((g) => ({
        type: g.type,
        count: g._count._all,
      })),
      recentUsers,
    });
  } catch (error) {
    console.error("[ADMIN_STATS]", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch stats";
    const status = message.includes("required") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
