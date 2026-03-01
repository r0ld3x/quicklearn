"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { formatDistanceToNow, format } from "date-fns";
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
  Pencil,
  RefreshCw,
  Download,
  FileDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ContentType, ContentStatus } from "@/types";
import { toast } from "sonner";

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
  onEditTitle?: (id: string) => void;
  onRegenerate?: (id: string) => void;
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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function markdownToRichHtml(md: string): Promise<string> {
  const { marked } = await import("marked");
  const hljs = (await import("highlight.js")).default;
  marked.setOptions({
    gfm: true,
    breaks: false,
  });

  const renderer = new marked.Renderer();
  renderer.code = ({ text, lang }: { text: string; lang?: string }) => {
    let highlighted: string;
    if (lang && hljs.getLanguage(lang)) {
      highlighted = hljs.highlight(text, { language: lang }).value;
    } else {
      highlighted = hljs.highlightAuto(text).value;
    }
    return `<pre class="code-block"><code class="hljs">${highlighted}</code></pre>`;
  };
  renderer.codespan = ({ text }: { text: string }) => {
    return `<code class="inline-code">${text}</code>`;
  };
  renderer.table = (token: { header: { text: string }[]; rows: { text: string }[][] }) => {
    const headCells = token.header.map((c) => `<th>${escapeHtml(c.text)}</th>`).join("");
    const bodyRows = token.rows
      .map((row) => `<tr>${row.map((c) => `<td>${escapeHtml(c.text)}</td>`).join("")}</tr>`)
      .join("");
    return `<table class="pdf-table"><thead><tr>${headCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
  };
  return await marked.parse(md, { renderer });
}

export function ContentCard({
  content,
  onDelete,
  onEditTitle,
  onRegenerate,
}: ContentCardProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(content.title);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [exporting, setExporting] = useState<"md" | "pdf" | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const config = typeConfig[content.type];
  const status = statusConfig[content.status];
  const Icon = config.icon;
  const StatusIcon = status.icon;

  const createdAt =
    typeof content.createdAt === "string"
      ? new Date(content.createdAt)
      : content.createdAt;

  const createdAtLabel = mounted
    ? formatDistanceToNow(createdAt, { addSuffix: true })
    : format(createdAt, "MMM d, yyyy");

  const handleSaveTitle = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = editTitle.trim();
    if (!trimmed || trimmed === content.title) {
      setEditOpen(false);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/content/${content.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
      if (res.ok) {
        onEditTitle?.(content.id);
        setEditOpen(false);
        toast.success("Title updated");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to update title");
      }
    } catch {
      toast.error("Failed to update title");
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (regenerating) return;
    setRegenerating(true);
    try {
      const res = await fetch(`/api/content/${content.id}/regenerate`, {
        method: "POST",
      });
      if (res.ok) {
        onRegenerate?.(content.id);
        toast.success("Summary regenerated");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to regenerate");
      }
    } catch {
      toast.error("Failed to regenerate");
    } finally {
      setRegenerating(false);
    }
  };

  const handleExportMd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (exporting) return;
    setExporting("md");
    try {
      const res = await fetch(`/api/content/${content.id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const markdown = data.summary?.markdown;
      if (!markdown) {
        toast.error("No summary to export");
        return;
      }
      const blob = new Blob([markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${content.title.replace(/[^a-zA-Z0-9-_]/g, "_")}.md`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exported as Markdown");
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(null);
    }
  };

  const handleExportPdf = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (exporting) return;
    setExporting("pdf");
    try {
      const res = await fetch(`/api/content/${content.id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const markdown = data.summary?.markdown;
      if (!markdown) {
        toast.error("No summary to export");
        return;
      }
      const title = escapeHtml(data.title || "Export");
      const bodyHtml = `<div class="content">${await markdownToRichHtml(markdown)}</div>`;
      const pdfStyles = `
        body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1.5rem; line-height: 1.7; color: #1a1a2e; font-size: 14px; }
        h1 { font-size: 1.6rem; font-weight: 700; margin: 0 0 1.5rem; padding-bottom: 0.75rem; border-bottom: 2px solid #e2e8f0; color: #0f172a; }
        .content h1 { font-size: 1.4rem; margin: 2rem 0 0.75rem; border-bottom: 1px solid #e2e8f0; }
        .content h2 { font-size: 1.2rem; font-weight: 600; margin: 1.8rem 0 0.6rem; color: #1e293b; padding-left: 0.75rem; border-left: 3px solid #6366f1; }
        .content h3 { font-size: 1.05rem; font-weight: 600; margin: 1.4rem 0 0.5rem; color: #334155; }
        .content p { margin: 0.5em 0; }
        .content ul, .content ol { margin: 0.5em 0; padding-left: 1.5em; }
        .content li { margin: 0.25em 0; }
        .content blockquote { border-left: 3px solid #6366f1; background: #f1f5f9; padding: 0.75rem 1rem; margin: 1rem 0; border-radius: 0 8px 8px 0; color: #475569; }
        .content strong { font-weight: 600; color: #0f172a; }
        .content a { color: #6366f1; text-decoration: underline; }

        /* Tables */
        .pdf-table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 13px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; }
        .pdf-table thead { background: #f1f5f9; }
        .pdf-table th { padding: 10px 14px; text-align: left; font-weight: 600; color: #1e293b; border-bottom: 2px solid #cbd5e1; border-right: 1px solid #e2e8f0; }
        .pdf-table th:last-child { border-right: none; }
        .pdf-table td { padding: 8px 14px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; color: #334155; }
        .pdf-table td:last-child { border-right: none; }
        .pdf-table tbody tr:nth-child(even) { background: #f8fafc; }
        .pdf-table tbody tr:last-child td { border-bottom: none; }

        /* Code blocks with syntax highlighting */
        .code-block { background: #fafbfc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; overflow-x: auto; margin: 1rem 0; font-size: 13px; line-height: 1.5; }
        .code-block code { font-family: 'Fira Code', 'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace; }
        .inline-code { background: #f1f5f9; border: 1px solid #e2e8f0; padding: 2px 6px; border-radius: 4px; font-size: 12px; font-family: 'Fira Code', 'Consolas', monospace; color: #7c3aed; }

        /* highlight.js token colors */
        .hljs { color: #24292e; background: #fafbfc; }
        .hljs-comment, .hljs-quote { color: #6a737d; font-style: italic; }
        .hljs-keyword, .hljs-selector-tag, .hljs-subst { color: #d73a49; font-weight: 600; }
        .hljs-literal, .hljs-number, .hljs-variable, .hljs-template-variable, .hljs-tag .hljs-attr { color: #005cc5; }
        .hljs-string, .hljs-doctag { color: #032f62; }
        .hljs-title, .hljs-section, .hljs-selector-id { color: #6f42c1; font-weight: 600; }
        .hljs-type, .hljs-class .hljs-title { color: #6f42c1; }
        .hljs-tag, .hljs-name, .hljs-attribute { color: #22863a; }
        .hljs-regexp, .hljs-link { color: #032f62; }
        .hljs-symbol, .hljs-bullet { color: #e36209; }
        .hljs-built_in, .hljs-builtin-name { color: #005cc5; }
        .hljs-meta { color: #735c0f; }
        .hljs-deletion { color: #b31d28; background: #ffeef0; }
        .hljs-addition { color: #22863a; background: #f0fff4; }
        .hljs-params { color: #24292e; }
        .hljs-function { color: #6f42c1; }

        @media print {
          body { margin: 0; padding: 1rem; }
          .code-block { break-inside: avoid; }
          .pdf-table { break-inside: avoid; }
        }
      `;
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>${pdfStyles}</style></head><body><h1>${title}</h1>${bodyHtml}</body></html>`;
      const win = window.open("", "_blank");
      if (!win) {
        toast.error("Allow popups to export PDF");
        return;
      }
      win.document.write(html);
      win.document.close();
      win.print();
      toast.success("Open print dialog and choose Save as PDF");
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(null);
    }
  };

  return (
    <>
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditTitle(content.title);
                          setEditOpen(true);
                        }}
                      >
                        <Pencil />
                        Edit title
                      </DropdownMenuItem>
                      {content.hasSummary && content.status === ContentStatus.COMPLETED && (
                        <DropdownMenuItem
                          onClick={handleRegenerate}
                          disabled={regenerating}
                        >
                          {regenerating ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <RefreshCw />
                          )}
                          Regenerate (1 credit)
                        </DropdownMenuItem>
                      )}
                      {content.hasSummary && (
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger onClick={(e) => e.stopPropagation()}>
                            <Download />
                            Export
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem
                              onClick={handleExportMd}
                              disabled={!!exporting}
                            >
                              {exporting === "md" ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <FileDown />
                              )}
                              Export as Markdown
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={handleExportPdf}
                              disabled={!!exporting}
                            >
                              {exporting === "pdf" ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <FileText />
                              )}
                              Export as PDF
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      )}
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
                    {createdAtLabel}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Edit title</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveTitle}>
            <div className="grid gap-2 py-2">
              <Label htmlFor="content-title">Title</Label>
              <Input
                id="content-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                maxLength={255}
                placeholder="Content title"
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
