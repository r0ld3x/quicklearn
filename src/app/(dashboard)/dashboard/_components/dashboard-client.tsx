"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Youtube,
  Sparkles,
  Layers,
  CreditCard,
  ArrowRight,
  Upload,
  Mic,
  Link as LinkIcon,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContentCard } from "@/components/content/content-card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  queryKeys,
  fetchContent,
  type AuthUser,
  type ContentResponse,
} from "@/lib/queries";

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
    title: "YouTube URL",
    description: "Paste a YouTube video link",
    icon: Youtube,
    href: "/content/new?type=youtube",
    color: "text-red-600",
    bg: "bg-red-600/10 group-hover:bg-red-600/15",
  },
  {
    title: "Record Audio",
    description: "Upload an audio recording",
    icon: Mic,
    href: "/content/new?type=audio",
    color: "text-purple-500",
    bg: "bg-purple-500/10 group-hover:bg-purple-500/15",
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
      setCount(0);
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

export function DashboardClient({ initialUser, initialContent }: Props) {
  const { user } = useAuth(initialUser ?? undefined);

  const { data: contentRes, isLoading } = useQuery({
    queryKey: queryKeys.content({ limit: 5 }),
    queryFn: () => fetchContent(5),
    initialData: initialContent ?? undefined,
  });

  const recentContent = contentRes?.data ?? [];
  const total = contentRes?.pagination?.total ?? 0;
  const withSummary = recentContent.filter((c) => c.hasSummary).length;

  const stats = [
    {
      label: "Total Documents",
      value: total,
      icon: FileText,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Summaries Generated",
      value: withSummary,
      icon: Sparkles,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: "Credits Used",
      value: user?.totalCreditsUsed ?? 0,
      icon: Layers,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Credits Remaining",
      value: user?.credits ?? 0,
      icon: CreditCard,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
  ];

  if (isLoading && !initialContent) {
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
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back{user?.name ? `, ${user.name}` : ""}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening with your learning journey.
        </p>
      </motion.div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} variants={itemVariants}>
              <Card className="py-4">
                <CardContent className="flex items-center gap-4">
                  <div
                    className={cn(
                      "flex items-center justify-center size-10 rounded-lg",
                      stat.bg
                    )}
                  >
                    <Icon className={cn("size-5", stat.color)} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      <AnimatedCounter value={stat.value} />
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stat.label}
                    </p>
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
                        action.bg
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
              <ContentCard key={content.id} content={content} />
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
