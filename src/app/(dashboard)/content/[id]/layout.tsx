"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  SUMMARY_FAILED_MARKDOWN,
  SUMMARY_PLACEHOLDER_MARKDOWN,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ContentStatus, ContentType } from "@/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  Brain,
  CheckCircle2,
  Clock,
  FileText,
  Headphones,
  Layers,
  Link as LinkIcon,
  Loader2,
  MessageSquare,
  RefreshCw,
  Sparkles,
  Trash2,
  Youtube,
} from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const typeConfig: Record<
  ContentType,
  {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bg: string;
    label: string;
  }
> = {
  [ContentType.PDF]: {
    icon: FileText,
    color: "text-red-500",
    bg: "bg-red-500/10",
    label: "PDF",
  },
  [ContentType.YOUTUBE]: {
    icon: Youtube,
    color: "text-red-600",
    bg: "bg-red-600/10",
    label: "YouTube",
  },
  [ContentType.AUDIO]: {
    icon: Headphones,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    label: "Audio",
  },
  [ContentType.LINK]: {
    icon: LinkIcon,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    label: "Link",
  },
};

const tabs = [
  { value: "summary", path: "", label: "Summary", icon: Sparkles },
  {
    value: "flashcards",
    path: "/flashcards",
    label: "Flashcards",
    icon: Layers,
  },
  { value: "chat", path: "/chat", label: "Chat", icon: MessageSquare },
  { value: "quiz", path: "/quiz", label: "Quiz", icon: Brain },
];

async function fetchContentDetail(id: string) {
  const res = await fetch(`/api/content/${id}`);
  if (!res.ok) throw new Error("Content not found");
  return res.json();
}

export default function ContentDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const contentId = params.id as string;
  const basePath = `/content/${contentId}`;
  const [isDeleting, setIsDeleting] = useState(false);

  const activeTab =
    tabs.find((t) =>
      t.path ? pathname.endsWith(t.path) : pathname === basePath,
    )?.value ?? "summary";

  const {
    data: content,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["content", contentId],
    queryFn: () => fetchContentDetail(contentId),
    enabled: !!contentId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      if (data.status === "PROCESSING") return 3000;
      if (
        (data.summary as { markdown?: string } | null)?.markdown ===
        SUMMARY_PLACEHOLDER_MARKDOWN
      )
        return 3000;
      return false;
    },
  });

  const hasText = !!(content as { hasExtractedText?: boolean })
    ?.hasExtractedText;
  const hasSummary = !!content?.summary;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-muted-foreground">Content not found</p>
        <Button variant="outline" onClick={() => router.push("/library")}>
          Back to Library
        </Button>
      </div>
    );
  }

  const config = typeConfig[content.type as ContentType];
  const TypeIcon = config.icon;
  const isProcessing = content.status === ContentStatus.PROCESSING;
  const isFailed = content.status === ContentStatus.FAILED;
  const summaryMarkdown = (content.summary as { markdown?: string } | null)
    ?.markdown;
  const summaryCreatedAt = (content.summary as { createdAt?: string } | null)
    ?.createdAt;
  const isSummaryGenerating =
    !!summaryMarkdown && summaryMarkdown === SUMMARY_PLACEHOLDER_MARKDOWN;
  const isSummaryFailed =
    !!summaryMarkdown && summaryMarkdown === SUMMARY_FAILED_MARKDOWN;
  const isSummaryStale =
    isSummaryGenerating &&
    summaryCreatedAt &&
    Date.now() - new Date(summaryCreatedAt).getTime() > 5 * 60 * 1000;

  const handleRegenerateSummary = async () => {
    if (isRegenerating) return;
    setIsRegenerating(true);
    try {
      const res = await fetch(`/api/content/${contentId}/regenerate`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Summary regeneration started.");
        queryClient.invalidateQueries({ queryKey: ["content", contentId] });
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Regenerate failed");
      }
    } catch {
      toast.error("Regenerate failed");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleRetryProcess = async () => {
    try {
      const res = await fetch("/api/content/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId }),
      });
      if (res.ok) {
        toast.success("Reprocessing started!");
        queryClient.invalidateQueries({ queryKey: ["content", contentId] });
      } else {
        const data = await res.json();
        toast.error(data.error || "Retry failed");
      }
    } catch {
      toast.error("Failed to retry processing");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this content? This cannot be undone.")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/content/${contentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["content"] });
        toast.success("Content deleted");
        router.push("/library");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to delete content");
      }
    } catch {
      toast.error("Failed to delete content");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/library")}
          className="shrink-0 mt-0.5"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div
              className={cn(
                "flex items-center justify-center size-9 rounded-lg",
                config.bg,
              )}
            >
              <TypeIcon className={cn("size-5", config.color)} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight truncate">
                {content.title}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {config.label}
                </Badge>
                {isProcessing && (
                  <Badge className="bg-yellow-500/10 text-yellow-600 text-xs gap-1">
                    <Loader2 className="size-3 animate-spin" />
                    Processing
                  </Badge>
                )}
                {isFailed && (
                  <Badge className="bg-red-500/10 text-red-600 text-xs gap-1">
                    <AlertTriangle className="size-3" />
                    Failed
                  </Badge>
                )}
                {hasSummary && (
                  <Badge className="bg-emerald-500/10 text-emerald-600 text-xs gap-1">
                    <CheckCircle2 className="size-3" />
                    Ready
                  </Badge>
                )}
                {isSummaryGenerating && !isSummaryStale && (
                  <Badge className="bg-blue-500/10 text-blue-600 text-xs gap-1">
                    <Loader2 className="size-3 animate-spin" />
                    Summarizing
                  </Badge>
                )}
                {isSummaryFailed && (
                  <Badge className="bg-red-500/10 text-red-600 text-xs gap-1">
                    <AlertTriangle className="size-3" />
                    Summary failed
                  </Badge>
                )}
                {isSummaryStale && (
                  <Badge className="bg-amber-500/10 text-amber-600 text-xs gap-1">
                    <Clock className="size-3" />
                    Taking long
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(content.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          disabled={isDeleting}
          className="shrink-0 mt-0.5 text-muted-foreground hover:text-red-500"
          title="Delete content"
        >
          {isDeleting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Trash2 className="size-4" />
          )}
        </Button>
      </div>

      {isProcessing && (
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="py-10 text-center space-y-4">
            <div className="flex items-center justify-center size-16 rounded-2xl bg-yellow-500/10 mx-auto">
              <Clock className="size-8 text-yellow-500" />
            </div>
            <p className="font-semibold text-lg">
              Extracting text from your content...
            </p>
            <p className="text-sm text-muted-foreground">
              This page will update automatically.
            </p>
            <div className="max-w-xs mx-auto">
              <Progress value={undefined} className="h-1.5 animate-pulse" />
            </div>
          </CardContent>
        </Card>
      )}

      {isSummaryGenerating && !isSummaryStale && (
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="py-10 text-center space-y-4">
            <div className="flex items-center justify-center size-16 rounded-2xl bg-blue-500/10 mx-auto">
              <Sparkles className="size-8 text-blue-500 animate-pulse" />
            </div>
            <p className="font-semibold text-lg">Generating your summary</p>
            <p className="text-sm text-muted-foreground">
              This usually takes 1–2 minutes. The page will update
              automatically.
            </p>
            <div className="max-w-xs mx-auto">
              <Progress value={undefined} className="h-1.5 animate-pulse" />
            </div>
          </CardContent>
        </Card>
      )}

      {isSummaryStale && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="py-8 text-center space-y-4">
            <p className="font-semibold text-lg">
              Summary is taking longer than usual
            </p>
            <p className="text-sm text-muted-foreground">
              You can try regenerating (uses 1 credit) or check back later.
            </p>
            <Button onClick={handleRegenerateSummary} disabled={isRegenerating}>
              {isRegenerating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              Regenerate summary (1 credit)
            </Button>
          </CardContent>
        </Card>
      )}

      {isSummaryFailed && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="py-8 text-center space-y-4">
            <p className="font-semibold text-lg text-red-600 dark:text-red-400">
              Summary generation failed
            </p>
            <p className="text-sm text-muted-foreground">
              Use the button below to try again (costs 1 credit).
            </p>
            <Button onClick={handleRegenerateSummary} disabled={isRegenerating}>
              {isRegenerating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              Regenerate summary (1 credit)
            </Button>
          </CardContent>
        </Card>
      )}

      {isFailed && (
        <Card className="border-red-500/30">
          <CardContent className="py-8 text-center space-y-4">
            <div className="flex items-center justify-center size-16 rounded-2xl bg-red-500/10 mx-auto">
              <AlertTriangle className="size-8 text-red-500" />
            </div>
            <p className="font-semibold text-lg text-red-500">
              Processing failed
            </p>
            <p className="text-sm text-muted-foreground">
              {(content as { processingFailedMessage?: string | null })
                .processingFailedMessage ??
                "There was an error processing this content."}
            </p>
            <Button onClick={handleRetryProcess}>
              <RefreshCw className="size-4" />
              Retry Processing
            </Button>
          </CardContent>
        </Card>
      )}

      {hasText &&
        (!isSummaryGenerating || isSummaryStale || isSummaryFailed) && (
          <>
            <div className="flex items-center gap-1 border-b border-border">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => router.push(`${basePath}${tab.path}`)}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
                      isActive
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <div>{children}</div>
          </>
        )}
    </motion.div>
  );
}
