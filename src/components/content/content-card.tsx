"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  FileText,
  Youtube,
  Headphones,
  Link as LinkIcon,
  MoreVertical,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ContentType, ContentStatus } from "@/types";

interface ContentCardProps {
  content: {
    id: string;
    type: ContentType;
    title: string;
    description?: string | null;
    status: ContentStatus;
    createdAt: Date | string;
    hasSummary?: boolean;
  };
  onDelete?: (id: string) => void;
}

const typeConfig: Record<
  ContentType,
  { icon: React.ComponentType<{ className?: string }>; color: string; bg: string; label: string }
> = {
  [ContentType.PDF]: {
    icon: FileText,
    color: "text-red-500",
    bg: "bg-red-500/10",
    label: "PDF",
  },
  [ContentType.YOUTUBE]: {
    icon: Youtube,
    color: "text-red-600",
    bg: "bg-red-600/10",
    label: "YouTube",
  },
  [ContentType.AUDIO]: {
    icon: Headphones,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    label: "Audio",
  },
  [ContentType.LINK]: {
    icon: LinkIcon,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    label: "Link",
  },
};

const statusConfig: Record<
  ContentStatus,
  { icon: React.ComponentType<{ className?: string }>; color: string; label: string }
> = {
  [ContentStatus.PROCESSING]: {
    icon: Loader2,
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    label: "Processing",
  },
  [ContentStatus.COMPLETED]: {
    icon: CheckCircle2,
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    label: "Completed",
  },
  [ContentStatus.FAILED]: {
    icon: XCircle,
    color: "bg-red-500/10 text-red-600 border-red-500/20",
    label: "Failed",
  },
};

export function ContentCard({ content, onDelete }: ContentCardProps) {
  const router = useRouter();
  const config = typeConfig[content.type];
  const status = statusConfig[content.status];
  const Icon = config.icon;
  const StatusIcon = status.icon;

  const createdAt =
    typeof content.createdAt === "string"
      ? new Date(content.createdAt)
      : content.createdAt;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="group cursor-pointer transition-colors hover:border-primary/30 py-0 overflow-hidden"
        onClick={() => router.push(`/content/${content.id}`)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex items-center justify-center size-10 rounded-lg shrink-0",
                config.bg
              )}
            >
              <Icon className={cn("size-5", config.color)} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-sm leading-tight truncate">
                  {content.title}
                </h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="size-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete?.(content.id);
                      }}
                    >
                      <Trash2 />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {content.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {content.description}
                </p>
              )}

              <div className="flex items-center gap-2 mt-3">
                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5 gap-1", status.color)}>
                  <StatusIcon className={cn("size-3", content.status === ContentStatus.PROCESSING && "animate-spin")} />
                  {status.label}
                </Badge>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                  {config.label}
                </Badge>
                <span className="text-[11px] text-muted-foreground ml-auto">
                  {formatDistanceToNow(createdAt, { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
