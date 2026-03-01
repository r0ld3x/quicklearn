"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { SummaryViewer } from "@/components/ai/summary-viewer";

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
    staleTime: Infinity,
  });

  if (!content) return null;

  const detail = content as { summary?: { markdown: string; keyTopics: string[] } };

  if (detail.summary) {
    return (
      <SummaryViewer
        markdown={detail.summary.markdown}
        keyTopics={detail.summary.keyTopics}
      />
    );
  }

  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}
