"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MessageSquareHeart,
  Send,
  Loader2,
  CheckCircle2,
  Clock,
  Bug,
  Lightbulb,
  MessageCircle,
  Inbox,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { queryKeys, fetchFeedbacks, type FeedbackItem } from "@/lib/queries";

interface Props {
  initialFeedbacks: FeedbackItem[];
}

const typeConfig = {
  BUG: { label: "Bug Report", icon: Bug, color: "text-red-500 bg-red-500/10" },
  FEATURE: { label: "Feature Request", icon: Lightbulb, color: "text-amber-500 bg-amber-500/10" },
  GENERAL: { label: "General", icon: MessageCircle, color: "text-blue-500 bg-blue-500/10" },
};

const statusConfig = {
  PENDING: { label: "Pending", color: "bg-amber-500/10 text-amber-500" },
  REVIEWED: { label: "Reviewed", color: "bg-blue-500/10 text-blue-500" },
  RESOLVED: { label: "Resolved", color: "bg-emerald-500/10 text-emerald-500" },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export function FeedbackClient({ initialFeedbacks }: Props) {
  const queryClient = useQueryClient();
  const [type, setType] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const { data: feedbacks = [], isLoading } = useQuery({
    queryKey: queryKeys.feedback,
    queryFn: fetchFeedbacks,
    initialData: initialFeedbacks,
  });

  const submitFeedback = useMutation({
    mutationFn: async (payload: {
      type: string;
      subject: string;
      message: string;
    }) => {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to submit");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Thank you for your feedback!");
      setType("");
      setSubject("");
      setMessage("");
      queryClient.invalidateQueries({ queryKey: queryKeys.feedback });
    },
    onError: () => {
      toast.error("Failed to submit feedback. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || !subject || !message) return;
    submitFeedback.mutate({ type, subject, message });
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-3xl mx-auto space-y-6"
    >
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight">Feedback</h1>
        <p className="text-muted-foreground mt-1">
          Help us improve QuickLearn with your suggestions
        </p>
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareHeart className="size-5 text-primary" />
              Submit Feedback
            </CardTitle>
            <CardDescription>
              We read every piece of feedback and use it to make QuickLearn
              better
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select feedback type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BUG">
                      <div className="flex items-center gap-2">
                        <Bug className="size-4 text-red-500" />
                        Bug Report
                      </div>
                    </SelectItem>
                    <SelectItem value="FEATURE">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="size-4 text-amber-500" />
                        Feature Request
                      </div>
                    </SelectItem>
                    <SelectItem value="GENERAL">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="size-4 text-blue-500" />
                        General Feedback
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief summary of your feedback"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your feedback in detail..."
                  rows={5}
                />
              </div>

              <Button
                type="submit"
                disabled={
                  submitFeedback.isPending || !type || !subject || !message
                }
              >
                {submitFeedback.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                {submitFeedback.isPending
                  ? "Submitting..."
                  : "Submit Feedback"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle>Previous Feedback</CardTitle>
            <CardDescription>
              Your submitted feedback and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && initialFeedbacks.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <Inbox className="size-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No feedback submitted yet
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {feedbacks.map((fb) => {
                  const tConfig = typeConfig[fb.type];
                  const sConfig = statusConfig[fb.status];
                  const TypeIcon = tConfig.icon;
                  return (
                    <div
                      key={fb.id}
                      className="p-4 rounded-xl border border-border hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2 rounded-lg ${tConfig.color}`}
                          >
                            <TypeIcon className="size-4" />
                          </div>
                          <div>
                            <p className="font-medium">{fb.subject}</p>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {fb.message}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Clock className="size-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(fb.createdAt), {
                                  addSuffix: true,
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge className={sConfig.color}>
                          {fb.status === "RESOLVED" && (
                            <CheckCircle2 className="size-3 mr-1" />
                          )}
                          {sConfig.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
