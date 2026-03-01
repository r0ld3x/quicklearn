"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, MessageSquareHeart, Bug, Lightbulb, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface FeedbackItem {
  id: string;
  type: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
}

interface FeedbackResponse {
  data: FeedbackItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  BUG: Bug,
  FEATURE: Lightbulb,
  GENERAL: MessageCircle,
};

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  REVIEWED: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  RESOLVED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};

export default function AdminFeedbackPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data, isLoading } = useQuery<FeedbackResponse>({
    queryKey: ["admin", "feedback", statusFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (typeFilter !== "all") params.set("type", typeFilter);
      params.set("limit", "50");
      const res = await fetch(`/api/admin/feedback?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch("/api/admin/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Update failed");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "feedback"] });
      toast.success("Status updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const feedbacks = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Feedback</h1>
        <p className="text-muted-foreground mt-1">
          View and manage user feedback, queries, and suggestions.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="REVIEWED">Reviewed</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="BUG">Bug</SelectItem>
            <SelectItem value="FEATURE">Feature</SelectItem>
            <SelectItem value="GENERAL">General</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : feedbacks.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <MessageSquareHeart className="size-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No feedback matches the filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((fb) => {
            const TypeIcon = typeIcons[fb.type] ?? MessageSquareHeart;
            return (
              <Card key={fb.id}>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <TypeIcon className="size-4 text-muted-foreground" />
                      <CardTitle className="text-base">{fb.subject}</CardTitle>
                      <Badge variant="outline" className={statusColors[fb.status] ?? ""}>
                        {fb.status}
                      </Badge>
                      <Badge variant="secondary">{fb.type}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(fb.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <CardDescription>
                    {fb.user.name ?? fb.user.email} · {fb.user.email}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm whitespace-pre-wrap">{fb.message}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Status:</span>
                    <Select
                      value={fb.status}
                      onValueChange={(value) =>
                        updateStatus.mutate({ id: fb.id, status: value })
                      }
                    >
                      <SelectTrigger className="w-[140px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="REVIEWED">Reviewed</SelectItem>
                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                    {updateStatus.isPending && updateStatus.variables?.id === fb.id && (
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {pagination && pagination.totalPages > 1 && (
            <p className="text-sm text-muted-foreground text-center">
              Showing {feedbacks.length} of {pagination.total}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
