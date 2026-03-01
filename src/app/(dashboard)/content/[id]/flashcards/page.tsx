"use client";

import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Layers, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlashcardViewer } from "@/components/ai/flashcard-viewer";
import { toast } from "sonner";
import { useState } from "react";
import type { Difficulty } from "@/types";

export default function FlashcardsPage() {
  const params = useParams();
  const contentId = params.id as string;
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);

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

  const detail = content as {
    flashcards: { id: string; question: string; answer: string; difficulty: Difficulty; order: number }[];
  };

  if (detail.flashcards.length > 0) {
    return <FlashcardViewer flashcards={detail.flashcards} />;
  }

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate flashcards");
      }
      toast.success("Flashcards generated!");
      queryClient.invalidateQueries({ queryKey: ["content", contentId] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="flex items-center justify-center size-16 rounded-2xl bg-primary/10">
        <Layers className="size-8 text-primary" />
      </div>
      <div className="text-center space-y-1 max-w-sm">
        <p className="font-medium text-lg">Generate Flashcards</p>
        <p className="text-sm text-muted-foreground">
          Generate interactive flashcards to test your knowledge.
        </p>
      </div>
      <Button onClick={handleGenerate} disabled={generating} size="lg">
        {generating ? <><Loader2 className="size-4 animate-spin" />Generating...</> : <><Sparkles className="size-4" />Generate Flashcards</>}
      </Button>
    </div>
  );
}
