export const queryKeys = {
  auth: ["auth", "me"] as const,
  content: (params?: Record<string, string | number>) =>
    ["content", params ?? {}] as const,
  feedback: ["feedback"] as const,
};

export interface AuthUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  plan: string;
  credits: number;
  totalCreditsUsed: number;
  emailVerified: boolean;
  createdAt: string;
}

export interface ContentItem {
  id: string;
  type: "PDF" | "YOUTUBE" | "AUDIO" | "LINK";
  title: string;
  description: string | null;
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  createdAt: string;
  hasSummary: boolean;
  _count?: { flashcards: number; chatMessages: number };
}

export interface ContentResponse {
  data: ContentItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FeedbackItem {
  id: string;
  type: "BUG" | "FEATURE" | "GENERAL";
  subject: string;
  message: string;
  status: "PENDING" | "REVIEWED" | "RESOLVED";
  createdAt: string;
}

export async function fetchAuthUser(): Promise<AuthUser | null> {
  const res = await fetch("/api/auth/me");
  if (!res.ok) return null;
  const data = await res.json();
  return data.user;
}

export async function fetchContent(
  limit = 100,
  type?: string
): Promise<ContentResponse> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (type) params.set("type", type);
  const res = await fetch(`/api/content?${params}`);
  if (!res.ok) throw new Error("Failed to fetch content");
  return res.json();
}

export async function fetchFeedbacks(): Promise<FeedbackItem[]> {
  const res = await fetch("/api/feedback");
  if (!res.ok) throw new Error("Failed to fetch feedback");
  const data = await res.json();
  return data.data || [];
}
