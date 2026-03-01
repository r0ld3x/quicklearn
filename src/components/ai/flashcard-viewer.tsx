"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Shuffle,
  RotateCcw,
  Keyboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Difficulty } from "@/types";

interface FlashcardData {
  id: string;
  question: string;
  answer: string;
  difficulty: Difficulty;
}

interface FlashcardViewerProps {
  flashcards: FlashcardData[];
}

const difficultyConfig: Record<Difficulty, { color: string; label: string }> = {
  [Difficulty.EASY]: { color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", label: "Easy" },
  [Difficulty.MEDIUM]: { color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", label: "Medium" },
  [Difficulty.HARD]: { color: "bg-red-500/10 text-red-600 border-red-500/20", label: "Hard" },
};

export function FlashcardViewer({ flashcards: initial }: FlashcardViewerProps) {
  const [cards, setCards] = useState(initial);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());
  const [direction, setDirection] = useState(0);

  const currentCard = cards[currentIndex];
  const total = cards.length;
  const progress = (reviewed.size / total) * 100;

  const flip = useCallback(() => setIsFlipped((f) => !f), []);

  const goNext = useCallback(() => {
    if (currentIndex < total - 1) {
      setReviewed((prev) => new Set(prev).add(currentCard.id));
      setIsFlipped(false);
      setDirection(1);
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, total, currentCard]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setDirection(-1);
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  const shuffle = useCallback(() => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setReviewed(new Set());
  }, [cards]);

  const reset = useCallback(() => {
    setCards(initial);
    setCurrentIndex(0);
    setIsFlipped(false);
    setReviewed(new Set());
  }, [initial]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === " ") {
        e.preventDefault();
        flip();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, flip]);

  if (!currentCard) return null;

  const diff = difficultyConfig[currentCard.difficulty];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-6 py-4"
    >
      <div className="flex items-center justify-between w-full max-w-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            {currentIndex + 1} / {total}
          </span>
          <Badge variant="outline" className={cn("text-[10px]", diff.color)}>
            {diff.label}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={shuffle}>
                <Shuffle className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Shuffle</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={reset}>
                <RotateCcw className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 px-2 text-xs text-muted-foreground">
                <Keyboard className="size-3.5" />
                <span className="hidden sm:inline">← → Space</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>Arrow keys to navigate, Space to flip</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="w-full max-w-lg">
        <Progress value={progress} className="h-1.5" />
        <p className="text-[11px] text-muted-foreground mt-1 text-right">
          {reviewed.size} of {total} reviewed
        </p>
      </div>

      <div
        className="w-full max-w-lg perspective-distant cursor-pointer"
        style={{ perspective: "1200px" }}
        onClick={flip}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentCard.id + (isFlipped ? "-back" : "-front")}
            custom={direction}
            initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="w-full"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div
              className={cn(
                "min-h-[280px] rounded-xl border-2 p-8 flex flex-col items-center justify-center text-center transition-colors",
                isFlipped
                  ? "bg-primary/5 border-primary/20"
                  : "bg-card border-border hover:border-primary/30"
              )}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                {isFlipped ? "Answer" : "Question"}
              </span>
              <p className={cn("text-lg leading-relaxed", isFlipped ? "text-foreground" : "font-medium")}>
                {isFlipped ? currentCard.answer : currentCard.question}
              </p>
              <span className="text-[11px] text-muted-foreground mt-6">
                {isFlipped ? "Click to see question" : "Click to reveal answer"}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={goPrev}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="size-4" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={goNext}
          disabled={currentIndex === total - 1}
        >
          Next
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </motion.div>
  );
}
