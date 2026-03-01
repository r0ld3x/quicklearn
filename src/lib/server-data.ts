import "server-only";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import type { AuthUser, ContentItem, ContentResponse, FeedbackItem } from "@/lib/queries";

export async function getServerUser(): Promise<AuthUser | null> {
  const user = await getSession();
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
    plan: user.plan,
    credits: user.credits,
    totalCreditsUsed: user.totalCreditsUsed,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function getServerContent(
  userId: string,
  limit = 100
): Promise<ContentResponse> {
  const [contents, total] = await Promise.all([
    db.content.findMany({
      where: { userId },
      include: {
        summary: { select: { id: true } },
        _count: { select: { flashcards: true, chatMessages: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    db.content.count({ where: { userId } }),
  ]);

  const data: ContentItem[] = contents.map((c) => ({
    id: c.id,
    type: c.type as ContentItem["type"],
    title: c.title,
    description: c.description,
    status: c.status as ContentItem["status"],
    createdAt: c.createdAt.toISOString(),
    hasSummary: !!c.summary,
    _count: c._count,
  }));

  return {
    data,
    pagination: { page: 1, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getServerFeedbacks(
  userId: string
): Promise<FeedbackItem[]> {
  const feedbacks = await db.feedback.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return feedbacks.map((f) => ({
    id: f.id,
    type: f.type as FeedbackItem["type"],
    subject: f.subject,
    message: f.message,
    status: f.status as FeedbackItem["status"],
    createdAt: f.createdAt.toISOString(),
  }));
}
