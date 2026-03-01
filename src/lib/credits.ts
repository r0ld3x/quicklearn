import { db } from "./db";
import { PLAN_FEATURES } from "./constants";
import type { PlanType, ContentType } from "@prisma/client";

interface CreditCheckResult {
  allowed: boolean;
  error?: string;
  usedToday: number;
  limit: number;
}

export async function checkCredits(
  userId: string,
  plan: PlanType
): Promise<CreditCheckResult> {
  const features = PLAN_FEATURES[plan];
  const limit = features.maxCreditsPerDay;

  if (limit === Infinity) {
    return { allowed: true, usedToday: 0, limit: Infinity };
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const usedToday = await db.content.count({
    where: {
      userId,
      status: "COMPLETED",
      updatedAt: { gte: todayStart },
    },
  });

  if (usedToday >= limit) {
    return {
      allowed: false,
      error: `Daily credit limit reached (${usedToday}/${limit}). Upgrade your plan for more.`,
      usedToday,
      limit,
    };
  }

  return { allowed: true, usedToday, limit };
}

export function checkContentTypeAllowed(
  plan: PlanType,
  contentType: ContentType
): boolean {
  const features = PLAN_FEATURES[plan];
  return (features.contentTypes as readonly string[]).includes(contentType);
}

export async function incrementCredits(userId: string): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: { totalCreditsUsed: { increment: 1 } },
  });
}
