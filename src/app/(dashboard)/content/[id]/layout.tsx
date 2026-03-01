"use client";

import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Youtube,
  Headphones,
  Link as LinkIcon,
  ArrowLeft,
  Sparkles,
  Layers,
  MessageSquare,
  Brain,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ContentType, ContentStatus } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const typeConfig: Record<
  ContentType,
  { icon: React.ComponentType<{ className?: string }>; color: string; bg: string; label: string }
> = {
  [ContentType.PDF]: { icon: FileText, color: "text-red-500", bg: "bg-red-500/10", label: "PDF" },
  [ContentType.YOUTUBE]: { icon: Youtube, color: "text-red-600", bg: "bg-red-600/10", label: "YouTube" },
  [ContentType.AUDIO]: { icon: Headphones, color: "text-purple-500", bg: "bg-purple-500/10", label: "Audio" },
  [ContentType.LINK]: { icon: LinkIcon, color: "text-blue-500", bg: "bg-blue-500/10", label: "Link" },
};

const tabs = [
  { value: "summary", path: "", label: "Summary", icon: Sparkles },
  { value: "flashcards", path: "/flashcards", label: "Flashcards", icon: Layers },
  { value: "chat", path: "/chat", label: "Chat", icon: MessageSquare },
  { value: "quiz", path: "/quiz", label: "Quiz", icon: Brain },
];

async function fetchContentDetail(id: string) {
  const res = await fetch(`/api/content/${id}`);
  if (!res.ok) throw new Error("Content not found");
  return res.json();
}

export default function ContentDetailLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const contentId = params.id as string;
  const basePath = `/content/${contentId}`;
  const summarizeCalledRef = useRef(false);
  const [summarizeError, setSummarizeError] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const activeTab = tabs.find((t) =>
    t.path ? pathname.endsWith(t.path) : pathname === basePath
  )?.value ?? "summary";

  const { data: content, isLoading, error } = useQuery({
    queryKey: ["content", contentId],
    queryFn: () => fetchContentDetail(contentId),
    enabled: !!contentId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      if (data.status === "PROCESSING") return 3000;
      return false;
    },
  });

  const triggerSummarize = useCallback(async () => {
    if (summarizeCalledRef.current || isSummarizing) return;
    summarizeCalledRef.current = true;
    setIsSummarizing(true);
    setSummarizeError(null);

    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate summary");
      }

      queryClient.invalidateQueries({ queryKey: ["content", contentId] });
    } catch (err) {
      setSummarizeError(err instanceof Error ? err.message : "Summary generation failed");
      summarizeCalledRef.current = false;
    } finally {
      setIsSummarizing(false);
    }
  }, [contentId, isSummarizing, queryClient]);

  const hasText = !!content?.extractedText;
  const hasSummary = !!content?.summary;
  const needsSummary = hasText && !hasSummary && content?.status === "COMPLETED";

  useEffect(() => {
    if (needsSummary && !summarizeCalledRef.current && !summarizeError) {
      triggerSummarize();
    }
  }, [needsSummary, summarizeError, triggerSummarize]);

  useEffect(() => {
    if (hasSummary) {
      summarizeCalledRef.current = false;
    }
  }, [hasSummary]);

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
        <Button variant="outline" onClick={() => router.push("/library")}>Back to Library</Button>
      </div>
    );
  }

  const config = typeConfig[content.type as ContentType];
  const TypeIcon = config.icon;
  const isProcessing = content.status === ContentStatus.PROCESSING;
  const isFailed = content.status === ContentStatus.FAILED;
  const isGeneratingSummary = needsSummary && isSummarizing;

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

  const handleRetrySummarize = () => {
    setSummarizeError(null);
    summarizeCalledRef.current = false;
    triggerSummarize();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/library")} className="shrink-0 mt-0.5">
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className={cn("flex items-center justify-center size-9 rounded-lg", config.bg)}>
              <TypeIcon className={cn("size-5", config.color)} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight truncate">{content.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">{config.label}</Badge>
                {isProcessing && (
                  <Badge className="bg-yellow-500/10 text-yellow-600 text-xs gap-1">
                    <Loader2 className="size-3 animate-spin" />Processing
                  </Badge>
                )}
                {isFailed && (
                  <Badge className="bg-red-500/10 text-red-600 text-xs gap-1">
                    <AlertTriangle className="size-3" />Failed
                  </Badge>
                )}
                {hasSummary && (
                  <Badge className="bg-emerald-500/10 text-emerald-600 text-xs gap-1">
                    <CheckCircle2 className="size-3" />Ready
                  </Badge>
                )}
                {isGeneratingSummary && (
                  <Badge className="bg-blue-500/10 text-blue-600 text-xs gap-1">
                    <Loader2 className="size-3 animate-spin" />Summarizing
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(content.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isProcessing && (
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="py-10 text-center space-y-4">
            <div className="flex items-center justify-center size-16 rounded-2xl bg-yellow-500/10 mx-auto">
              <Clock className="size-8 text-yellow-500" />
            </div>
            <p className="font-semibold text-lg">Extracting text from your content...</p>
            <p className="text-sm text-muted-foreground">This page will update automatically.</p>
            <div className="max-w-xs mx-auto"><Progress value={undefined} className="h-1.5 animate-pulse" /></div>
          </CardContent>
        </Card>
      )}

      {isGeneratingSummary && (
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="py-10 text-center space-y-4">
            <div className="flex items-center justify-center size-16 rounded-2xl bg-blue-500/10 mx-auto">
              <Sparkles className="size-8 text-blue-500 animate-pulse" />
            </div>
            <p className="font-semibold text-lg">Generating AI summary...</p>
            <p className="text-sm text-muted-foreground">This will appear automatically once ready.</p>
            <div className="max-w-xs mx-auto"><Progress value={undefined} className="h-1.5 animate-pulse" /></div>
          </CardContent>
        </Card>
      )}

      {summarizeError && needsSummary && (
        <Card className="border-red-500/30">
          <CardContent className="py-8 text-center space-y-4">
            <div className="flex items-center justify-center size-16 rounded-2xl bg-red-500/10 mx-auto">
              <AlertTriangle className="size-8 text-red-500" />
            </div>
            <p className="font-semibold text-lg text-red-500">Summary generation failed</p>
            <p className="text-sm text-muted-foreground">{summarizeError}</p>
            <Button onClick={handleRetrySummarize}><RefreshCw className="size-4" />Retry Summary</Button>
          </CardContent>
        </Card>
      )}

      {isFailed && (
        <Card className="border-red-500/30">
          <CardContent className="py-8 text-center space-y-4">
            <div className="flex items-center justify-center size-16 rounded-2xl bg-red-500/10 mx-auto">
              <AlertTriangle className="size-8 text-red-500" />
            </div>
            <p className="font-semibold text-lg text-red-500">Processing failed</p>
            <p className="text-sm text-muted-foreground">There was an error processing this content.</p>
            <Button onClick={handleRetryProcess}><RefreshCw className="size-4" />Retry Processing</Button>
          </CardContent>
        </Card>
      )}

      {hasText && !isGeneratingSummary && !summarizeError && (
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
                      : "border-transparent text-muted-foreground hover:text-foreground"
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
