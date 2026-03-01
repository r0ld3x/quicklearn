"use client";

import { ContentCard } from "@/components/content/content-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PLAN_FEATURES } from "@/lib/constants";
import {
  fetchAuthUser,
  fetchContent,
  queryKeys,
  type AuthUser,
  type ContentResponse,
} from "@/lib/queries";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CreditCard,
  FileText,
  Layers,
  Link as LinkIcon,
  Loader2,
  Sparkles,
  Upload,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
  initialUser: AuthUser | null;
  initialContent: ContentResponse | null;
}

const quickActions = [
  {
    title: "Upload PDF",
    description: "Upload a PDF or presentation",
    icon: Upload,
    href: "/content/new?type=pdf",
    color: "text-red-500",
    bg: "bg-red-500/10 group-hover:bg-red-500/15",
  },
  {
    title: "Paste Link",
    description: "Add a web article or blog",
    icon: LinkIcon,
    href: "/content/new?type=link",
    color: "text-blue-500",
    bg: "bg-blue-500/10 group-hover:bg-blue-500/15",
  },
];

function AnimatedCounter({
  value,
  duration = 1.5,
}: {
  value: number;
  duration?: number;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (end === 0) {
      queueMicrotask(() => setCount(0));
      return;
    }
    const increment = end / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count}</span>;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

const planLabel: Record<string, string> = {
  FREE: "Free",
  PRO: "Pro",
  ENTERPRISE: "Enterprise",
};

export function DashboardClient({ initialUser, initialContent }: Props) {
  const queryClient = useQueryClient();

  const { data: user, refetch: refetchUser } = useQuery({
    queryKey: queryKeys.auth,
    queryFn: fetchAuthUser,
    initialData: initialUser ?? undefined,
    staleTime: 0,
    refetchOnMount: "always",
  });

  useEffect(() => {
    refetchUser();
  }, [refetchUser]);

  const invalidateContent = () => {
    queryClient.invalidateQueries({ queryKey: ["content"] });
  };

  const handleRegenerate = () => {
    invalidateContent();
    queryClient.invalidateQueries({ queryKey: queryKeys.auth });
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/content/${id}`, { method: "DELETE" });
      if (res.ok) {
        invalidateContent();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to delete content");
      }
    } catch {
      toast.error("Failed to delete content");
    }
  };

  const { data: contentRes, isLoading: contentLoading } = useQuery({
    queryKey: queryKeys.content({ limit: 5 }),
    queryFn: () => fetchContent(5),
    initialData: initialContent ?? undefined,
  });

  const recentContent = contentRes?.data ?? [];
  const total = contentRes?.pagination?.total ?? 0;
  const withSummary = recentContent.filter((c) => c.hasSummary).length;

  const creditsRemaining = user?.credits ?? 0;
  const creditsUsed = user?.totalCreditsUsed ?? 0;
  const plan = user?.plan ?? "FREE";
  const dailyLimit =
    plan in PLAN_FEATURES
      ? PLAN_FEATURES[plan as keyof typeof PLAN_FEATURES].maxCreditsPerDay
      : 5;
  const isUnlimitedCredits = dailyLimit === Infinity;

  const stats = [
    {
      label: "Documents",
      value: total,
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      label: "With summary",
      value: withSummary,
      icon: Sparkles,
      color: "text-amber-600",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      label: "Credits used",
      value: creditsUsed,
      icon: Layers,
      color: "text-emerald-600",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: "Credits left",
      value: creditsRemaining,
      icon: CreditCard,
      color: creditsRemaining <= 1 ? "text-red-600" : "text-purple-600",
      bg: creditsRemaining <= 1 ? "bg-red-500/10" : "bg-purple-500/10",
      border:
        creditsRemaining <= 1 ? "border-red-500/20" : "border-purple-500/20",
      subtitle: isUnlimitedCredits ? "Unlimited" : `Up to ${dailyLimit}/day`,
    },
  ];

  const isLoading = contentLoading && !initialContent;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div
        variants={itemVariants}
        className="flex flex-wrap items-center gap-3"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back{user?.name ? `, ${user.name}` : ""}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening with your learning journey.
          </p>
        </div>
        {user?.plan && (
          <Badge
            variant="secondary"
            className={cn(
              "shrink-0 font-medium",
              plan === "PRO" &&
                "bg-amber-500/15 text-amber-700 dark:text-amber-400",
              plan === "ENTERPRISE" &&
                "bg-violet-500/15 text-violet-700 dark:text-violet-400",
            )}
          >
            <Zap className="size-3.5 mr-1" />
            {planLabel[plan] ?? plan}
          </Badge>
        )}
      </motion.div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const sub =
            "subtitle" in stat
              ? (stat as { subtitle?: string }).subtitle
              : undefined;
          const border =
            "border" in stat ? (stat as { border?: string }).border : "";
          return (
            <motion.div key={stat.label} variants={itemVariants}>
              <Card className={cn("py-4 border", border)}>
                <CardContent className="flex items-center gap-4">
                  <div
                    className={cn(
                      "flex items-center justify-center size-11 rounded-xl shrink-0",
                      stat.bg,
                    )}
                  >
                    <Icon className={cn("size-5", stat.color)} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-2xl font-bold tabular-nums">
                      <AnimatedCounter value={stat.value} />
                    </p>
                    <p className="text-xs font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    {sub && (
                      <p className="text-[10px] text-muted-foreground/80 mt-0.5">
                        {sub}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
        </div>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} href={action.href}>
                <Card className="group cursor-pointer transition-colors hover:border-primary/30 py-0 h-full">
                  <CardContent className="p-4 flex flex-col gap-3">
                    <div
                      className={cn(
                        "flex items-center justify-center size-10 rounded-lg transition-colors",
                        action.bg,
                      )}
                    >
                      <Icon className={cn("size-5", action.color)} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{action.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {action.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Content</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/library">
              View all
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        {recentContent.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No content yet. Start by adding your first document!
              </p>
              <Button className="mt-4" asChild>
                <Link href="/content/new">Add Content</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentContent.map((content) => (
              <ContentCard
                key={content.id}
                content={
                  content as React.ComponentProps<typeof ContentCard>["content"]
                }
                onDelete={handleDelete}
                onEditTitle={invalidateContent}
                onRegenerate={handleRegenerate}
              />
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
