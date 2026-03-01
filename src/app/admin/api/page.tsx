"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Key, Loader2, Cpu } from "lucide-react";

interface ApiStats {
  deepseekConfigured: boolean;
  deepseekPlatformUrl: string;
  note: string;
}

export default function AdminApiPage() {
  const { data, isLoading } = useQuery<ApiStats>({
    queryKey: ["admin", "api-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/api-stats");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">API & DeepSeek</h1>
        <p className="text-muted-foreground mt-1">
          API key status and link to view usage, balance, and billing on DeepSeek.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Cpu className="size-5 text-muted-foreground" />
            <CardTitle>DeepSeek API</CardTitle>
          </div>
          <CardDescription>
            QuickLearn uses DeepSeek for summaries, flashcards, chat, and quizzes. Key is stored in the server environment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Key className="size-4 text-muted-foreground" />
            <span className="text-sm">API key:</span>
            <Badge variant={data.deepseekConfigured ? "default" : "destructive"}>
              {data.deepseekConfigured ? "Configured" : "Not set"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{data.note}</p>
          <Button asChild variant="outline" size="sm">
            <a
              href={data.deepseekPlatformUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              Open DeepSeek platform
              <ExternalLink className="size-4" />
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
