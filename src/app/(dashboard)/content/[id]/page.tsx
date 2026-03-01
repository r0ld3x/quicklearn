"use client";

import { SummaryViewer } from "@/components/ai/summary-viewer";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SUMMARY_PLACEHOLDER_MARKDOWN } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
import { useParams } from "next/navigation";

export default function SummaryPage() {
  const params = useParams();
  const contentId = params.id as string;

  const { data: content } = useQuery({
    queryKey: ["content", contentId],
    queryFn: async () => {
      const res = await fetch(`/api/content/${contentId}`);
      if (!res.ok) throw new Error("Content not found");
      return res.json();
    },
    refetchInterval: (query) => {
      const data = query.state.data as
        | { summary?: { markdown?: string } }
        | undefined;
      if (!data?.summary?.markdown) return false;
      if (data.summary.markdown === SUMMARY_PLACEHOLDER_MARKDOWN) return 10000;
      return false;
    },
  });

  if (!content) return null;

  const detail = content as {
    summary?: { markdown: string; keyTopics: string[] };
  };
  const isGenerating =
    detail.summary?.markdown === SUMMARY_PLACEHOLDER_MARKDOWN;

  if (detail.summary && !isGenerating) {
    return (
      <SummaryViewer
        markdown={detail.summary.markdown}
        keyTopics={detail.summary.keyTopics ?? []}
      />
    );
  }

  if (isGenerating) {
    return (
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="py-16 text-center space-y-6">
          <div className="flex items-center justify-center size-20 rounded-2xl bg-blue-500/10 mx-auto">
            <Sparkles className="size-10 text-blue-500 animate-pulse" />
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-xl">Generating your summary</p>
            <p className="text-muted-foreground max-w-sm mx-auto">
              AI is creating detailed study notes. This usually takes 1–2
              minutes. The page will update automatically.
            </p>
          </div>
          <div className="max-w-xs mx-auto">
            <Progress value={undefined} className="h-2 animate-pulse" />
          </div>
          <p className="text-xs text-muted-foreground">
            You can leave this page — generation continues in the background.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
    </div>
  );
}
