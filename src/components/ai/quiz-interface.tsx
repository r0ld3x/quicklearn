"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  ChevronRight,
  RotateCcw,
  Trophy,
  Target,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface QuizInterfaceProps {
  questions: QuizQuestion[];
}

function getGrade(percentage: number): { letter: string; color: string; message: string } {
  if (percentage >= 90) return { letter: "A+", color: "text-emerald-500", message: "Outstanding!" };
  if (percentage >= 80) return { letter: "A", color: "text-emerald-500", message: "Excellent work!" };
  if (percentage >= 70) return { letter: "B", color: "text-blue-500", message: "Good job!" };
  if (percentage >= 60) return { letter: "C", color: "text-yellow-500", message: "Not bad!" };
  return { letter: "D", color: "text-red-500", message: "Keep studying!" };
}

const optionLetters = ["A", "B", "C", "D"];

export function QuizInterface({ questions }: QuizInterfaceProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>(
    new Array(questions.length).fill(null)
  );

  const currentQuestion = questions[currentIndex];
  const total = questions.length;
  const progress = ((currentIndex + (isSubmitted ? 1 : 0)) / total) * 100;
  const isCorrect = selectedOption === currentQuestion?.correctIndex;

  const handleSubmit = useCallback(() => {
    if (selectedOption === null) return;
    setIsSubmitted(true);
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIndex] = selectedOption;
      return next;
    });
    if (selectedOption === currentQuestion.correctIndex) {
      setCorrectCount((c) => c + 1);
    }
  }, [selectedOption, currentIndex, currentQuestion]);

  const handleNext = useCallback(() => {
    if (currentIndex === total - 1) {
      setShowResults(true);
      return;
    }
    setCurrentIndex((i) => i + 1);
    setSelectedOption(null);
    setIsSubmitted(false);
  }, [currentIndex, total]);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsSubmitted(false);
    setCorrectCount(0);
    setShowResults(false);
    setAnswers(new Array(questions.length).fill(null));
  }, [questions.length]);

  if (showResults) {
    const percentage = Math.round((correctCount / total) * 100);
    const grade = getGrade(percentage);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center py-8"
      >
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-6 space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className="flex items-center justify-center"
            >
              <div className="relative">
                <div className="size-28 rounded-full bg-primary/10 flex items-center justify-center">
                  <Trophy className="size-12 text-primary" />
                </div>
                <Badge
                  className={cn(
                    "absolute -top-1 -right-1 text-lg font-bold px-3 py-1",
                    grade.color
                  )}
                >
                  {grade.letter}
                </Badge>
              </div>
            </motion.div>

            <div className="space-y-1">
              <h2 className="text-2xl font-bold">{grade.message}</h2>
              <p className="text-muted-foreground">You completed the quiz</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-2xl font-bold text-primary">{percentage}%</p>
                <p className="text-xs text-muted-foreground">Score</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-emerald-500">{correctCount}</p>
                <p className="text-xs text-muted-foreground">Correct</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-red-500">{total - correctCount}</p>
                <p className="text-xs text-muted-foreground">Wrong</p>
              </div>
            </div>

            <Button onClick={handleRestart} className="w-full">
              <RotateCcw className="size-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-2xl mx-auto py-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10">
            <Target className="size-4 text-primary" />
          </div>
          <span className="text-sm font-medium">
            Question {currentIndex + 1} of {total}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs gap-1">
            <CheckCircle2 className="size-3 text-emerald-500" />
            {correctCount}
          </Badge>
        </div>
      </div>

      <Progress value={progress} className="h-1.5" />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <Card>
            <CardContent className="pt-6">
              <p className="text-lg font-medium leading-relaxed">
                {currentQuestion.question}
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedOption === index;
              const isCorrectOption = index === currentQuestion.correctIndex;
              let optionStyle = "border-border hover:border-primary/40 hover:bg-primary/5";

              if (isSubmitted) {
                if (isCorrectOption) {
                  optionStyle = "border-emerald-500 bg-emerald-500/10";
                } else if (isSelected && !isCorrectOption) {
                  optionStyle = "border-red-500 bg-red-500/10";
                } else {
                  optionStyle = "border-border opacity-50";
                }
              } else if (isSelected) {
                optionStyle = "border-primary bg-primary/5 ring-2 ring-primary/20";
              }

              return (
                <motion.button
                  key={index}
                  whileHover={!isSubmitted ? { scale: 1.01 } : {}}
                  whileTap={!isSubmitted ? { scale: 0.99 } : {}}
                  onClick={() => !isSubmitted && setSelectedOption(index)}
                  disabled={isSubmitted}
                  className={cn(
                    "flex items-center gap-3 w-full rounded-xl border-2 p-4 text-left transition-all",
                    optionStyle
                  )}
                >
                  <span
                    className={cn(
                      "flex items-center justify-center size-8 rounded-lg text-sm font-semibold shrink-0 transition-colors",
                      isSubmitted && isCorrectOption
                        ? "bg-emerald-500 text-white"
                        : isSubmitted && isSelected && !isCorrectOption
                          ? "bg-red-500 text-white"
                          : isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                    )}
                  >
                    {isSubmitted && isCorrectOption ? (
                      <CheckCircle2 className="size-4" />
                    ) : isSubmitted && isSelected && !isCorrectOption ? (
                      <XCircle className="size-4" />
                    ) : (
                      optionLetters[index]
                    )}
                  </span>
                  <span className="text-sm">{option}</span>
                </motion.button>
              );
            })}
          </div>

          {isSubmitted && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="overflow-hidden"
            >
              <Card
                className={cn(
                  "border-2",
                  isCorrect
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-red-500/30 bg-red-500/5"
                )}
              >
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle2 className="size-5 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="size-5 text-red-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className={cn("text-sm font-medium", isCorrect ? "text-emerald-600" : "text-red-600")}>
                        {isCorrect ? "Correct!" : "Incorrect"}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {currentQuestion.explanation}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-end">
        {!isSubmitted ? (
          <Button onClick={handleSubmit} disabled={selectedOption === null}>
            Submit Answer
          </Button>
        ) : (
          <Button onClick={handleNext}>
            {currentIndex === total - 1 ? "See Results" : "Next Question"}
            <ChevronRight className="size-4" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}
