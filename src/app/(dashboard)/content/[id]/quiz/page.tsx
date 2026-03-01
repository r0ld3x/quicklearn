"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Brain, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuizInterface } from "@/components/ai/quiz-interface";
import { toast } from "sonner";
import { useState } from "react";

export default function QuizPage() {
  const params = useParams();
  const contentId = params.id as string;
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState<
    { question: string; options: string[]; correctAnswer: number; explanation: string }[] | null
  >(null);

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

  if (questions) {
    return <QuizInterface questions={questions} />;
  }

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate quiz");
      }
      const data = await res.json();
      setQuestions(data.questions);
      toast.success("Quiz generated!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="flex items-center justify-center size-16 rounded-2xl bg-primary/10">
        <Brain className="size-8 text-primary" />
      </div>
      <div className="text-center space-y-1 max-w-sm">
        <p className="font-medium text-lg">Generate Quiz</p>
        <p className="text-sm text-muted-foreground">
          Generate a multiple-choice quiz to test your understanding.
        </p>
      </div>
      <Button onClick={handleGenerate} disabled={generating} size="lg">
        {generating ? <><Loader2 className="size-4 animate-spin" />Generating...</> : <><Sparkles className="size-4" />Generate Quiz</>}
      </Button>
    </div>
  );
}
