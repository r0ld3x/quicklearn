"use client";

import { motion } from "framer-motion";
import {
  GraduationCap,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function CoursesPage() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-4xl mx-auto space-y-6"
    >
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight">My Courses</h1>
        <p className="text-muted-foreground mt-1">
          Organize your content into structured learning paths
        </p>
      </motion.div>

      <motion.div variants={item}>
        <Card className="border-dashed border-2">
          <CardContent className="py-16 text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="size-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="size-10 text-primary" />
                </div>
                <div className="absolute -top-2 -right-2 size-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Sparkles className="size-4 text-amber-500" />
                </div>
              </div>
            </div>
            <h2 className="text-xl font-bold">Course Creation Coming Soon!</h2>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              Group your content into courses for structured learning.
              Create custom learning paths, track progress, and share
              courses with others.
            </p>
            <div className="flex items-center justify-center gap-2 mt-6">
              <Badge variant="secondary" className="gap-1">
                <BookOpen className="size-3" />
                Structured Learning
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="size-3" />
                AI-Powered Organization
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
