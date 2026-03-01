"use client";

import { motion } from "framer-motion";
import { Trophy, Sparkles, Construction } from "lucide-react";
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

export default function LeaderboardPage() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-4xl mx-auto space-y-6"
    >
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Trophy className="size-6 text-amber-500" />
          Leaderboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Top learners ranked by activity and engagement
        </p>
      </motion.div>

      <motion.div variants={item}>
        <Card className="border-dashed border-2">
          <CardContent className="py-16 text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="size-20 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                  <Construction className="size-10 text-amber-500" />
                </div>
                <div className="absolute -top-2 -right-2 size-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="size-4 text-primary" />
                </div>
              </div>
            </div>
            <h2 className="text-xl font-bold">Leaderboard Coming Soon!</h2>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              We&apos;re building a competitive leaderboard where you can see how you
              rank against other learners. Stay tuned!
            </p>
            <div className="flex items-center justify-center gap-2 mt-6">
              <Badge variant="secondary" className="gap-1">
                <Trophy className="size-3" />
                Weekly Rankings
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="size-3" />
                Achievement Points
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
