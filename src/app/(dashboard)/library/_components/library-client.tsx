"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  FileText,
  Youtube,
  Headphones,
  Link as LinkIcon,
  Inbox,
  Plus,
  ArrowUpDown,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ContentCard } from "@/components/content/content-card";
import { cn } from "@/lib/utils";
import { ContentType } from "@/types";
import { queryKeys, fetchContent, type ContentResponse } from "@/lib/queries";

interface Props {
  initialContent: ContentResponse | null;
}

const filterTabs = [
  { value: "all", label: "All", icon: null },
  { value: ContentType.PDF, label: "PDFs", icon: FileText, color: "text-red-500" },
  { value: ContentType.YOUTUBE, label: "YouTube", icon: Youtube, color: "text-red-600" },
  { value: ContentType.AUDIO, label: "Audio", icon: Headphones, color: "text-purple-500" },
  { value: ContentType.LINK, label: "Links", icon: LinkIcon, color: "text-blue-500" },
];

type SortOption = "newest" | "oldest" | "title";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function LibraryClient({ initialContent }: Props) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortOption>("newest");

  const { data: contentRes, isLoading } = useQuery({
    queryKey: queryKeys.content({ limit: 100 }),
    queryFn: () => fetchContent(100),
    initialData: initialContent ?? undefined,
  });

  const contents = contentRes?.data ?? [];

  const filtered = useMemo(() => {
    let items = [...contents];

    if (filter !== "all") {
      items = items.filter((c) => c.type === filter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q)
      );
    }

    switch (sort) {
      case "newest":
        items.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "oldest":
        items.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case "title":
        items.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return items;
  }, [contents, search, filter, sort]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/content?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["content"] });
      }
    } catch (err) {
      console.error("[LIBRARY_DELETE]", err);
    }
  };

  if (isLoading && !initialContent) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Library</h1>
          <p className="text-muted-foreground mt-1">
            All your learning materials in one place.
          </p>
        </div>
        <Button asChild>
          <Link href="/content/new">
            <Plus className="size-4" />
            Add Content
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={sort}
          onValueChange={(v) => setSort(v as SortOption)}
        >
          <SelectTrigger className="w-[160px]">
            <ArrowUpDown className="size-4 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="title">Title</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {filterTabs.map((tab) => {
          const isActive = filter === tab.value;
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
              )}
            >
              {Icon && (
                <Icon
                  className={cn("size-3.5", isActive ? "" : tab.color)}
                />
              )}
              {tab.label}
              {isActive && filter !== "all" && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 h-4 bg-primary-foreground/20 text-primary-foreground"
                >
                  {filtered.length}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-16 gap-4"
        >
          <div className="flex items-center justify-center size-20 rounded-2xl bg-muted">
            <Inbox className="size-10 text-muted-foreground" />
          </div>
          <div className="text-center space-y-1">
            <p className="font-medium text-lg">No content found</p>
            <p className="text-sm text-muted-foreground">
              {search
                ? "Try adjusting your search or filters."
                : "Get started by adding your first content."}
            </p>
          </div>
          {!search && (
            <Button asChild>
              <Link href="/content/new">
                <Plus className="size-4" />
                Add Content
              </Link>
            </Button>
          )}
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence>
            {filtered.map((content) => (
              <motion.div key={content.id} variants={itemVariants} layout>
                <ContentCard content={content} onDelete={handleDelete} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
}
