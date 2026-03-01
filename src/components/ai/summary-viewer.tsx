"use client";

import { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";
import {
  Copy,
  Check,
  FileDown,
  List,
  Tag,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SummaryViewerProps {
  markdown: string;
  keyTopics?: string[];
}

function extractHeadings(
  md: string
): { level: number; text: string; id: string }[] {
  const headings: { level: number; text: string; id: string }[] = [];
  const lines = md.split("\n");
  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)/);
    if (match) {
      const raw = match[2].replace(/[*_`]/g, "");
      const text = raw.replace(/^\p{Emoji_Presentation}\s*/u, "").replace(/^\p{Emoji}\uFE0F?\s*/u, "");
      headings.push({
        level: match[1].length,
        text,
        id: text
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
      });
    }
  }
  return headings;
}

function makeId(children: React.ReactNode): string {
  const text = String(children)
    .replace(/[*_`]/g, "")
    .replace(/^\p{Emoji_Presentation}\s*/u, "")
    .replace(/^\p{Emoji}\uFE0F?\s*/u, "");
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function SummaryViewer({
  markdown,
  keyTopics = [],
}: SummaryViewerProps) {
  const [copied, setCopied] = useState(false);
  const [showToc, setShowToc] = useState(true);
  const headings = useMemo(() => extractHeadings(markdown), [markdown]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "summary.md";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded");
  };

  const wordCount = markdown.split(/\s+/).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-6"
    >
      {headings.length > 2 && showToc && (
        <aside className="hidden xl:block w-56 shrink-0">
          <div className="sticky top-0 pt-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground/70 mb-3">
              <List className="size-4" />
              Contents
            </div>
            <nav className="space-y-0.5 border-l-2 border-border">
              {headings.map((h, i) => (
                <a
                  key={i}
                  href={`#${h.id}`}
                  className={cn(
                    "flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-primary transition-colors py-1.5 border-l-2 -ml-[2px]",
                    h.level === 1 && "font-semibold text-foreground/80 pl-3 border-transparent hover:border-primary",
                    h.level === 2 && "pl-3 border-transparent hover:border-primary",
                    h.level === 3 && "pl-6 border-transparent hover:border-primary/50"
                  )}
                >
                  <ChevronRight className="size-3 shrink-0 opacity-40" />
                  <span className="truncate">{h.text}</span>
                </a>
              ))}
            </nav>
          </div>
        </aside>
      )}

      <div className="flex-1 min-w-0 space-y-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            {keyTopics.length > 0 && (
              <>
                <Tag className="size-4 text-primary" />
                {keyTopics.map((topic) => (
                  <Badge key={topic} variant="secondary" className="text-xs font-medium">
                    {topic}
                  </Badge>
                ))}
              </>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">
              {wordCount.toLocaleString()} words &middot; {readTime} min read
            </span>
            {headings.length > 2 && (
              <Button variant="ghost" size="icon-sm" onClick={() => setShowToc(!showToc)} className="hidden xl:inline-flex">
                <List className="size-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon-sm" onClick={handleCopy}>
              {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={handleDownload}>
              <FileDown className="size-4" />
            </Button>
          </div>
        </div>

        <Separator />

        <article className="summary-markdown">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children, ...props }) => (
                <h1 id={makeId(children)} className="text-2xl font-bold tracking-tight mt-0 mb-5 pb-3 border-b border-border text-foreground" {...props}>{children}</h1>
              ),
              h2: ({ children, ...props }) => (
                <h2 id={makeId(children)} className="text-xl font-bold tracking-tight mt-10 mb-4 text-foreground flex items-center gap-2 scroll-mt-6" {...props}>
                  <span className="inline-block w-1 h-6 bg-primary rounded-full shrink-0" />
                  {children}
                </h2>
              ),
              h3: ({ children, ...props }) => (
                <h3 id={makeId(children)} className="text-lg font-semibold mt-8 mb-3 text-foreground/90 scroll-mt-6" {...props}>{children}</h3>
              ),
              p: ({ children, ...props }) => (
                <p className="text-[15px] leading-7 mb-4 text-foreground/80" {...props}>{children}</p>
              ),
              strong: ({ children, ...props }) => (
                <strong className="font-semibold text-foreground" {...props}>{children}</strong>
              ),
              em: ({ children, ...props }) => (
                <em className="italic text-foreground/70" {...props}>{children}</em>
              ),
              ul: ({ children, ...props }) => (
                <ul className="my-4 ml-1 space-y-2" {...props}>{children}</ul>
              ),
              ol: ({ children, ...props }) => (
                <ol className="my-4 ml-1 space-y-2 list-decimal list-inside" {...props}>{children}</ol>
              ),
              li: ({ children, ...props }) => (
                <li className="text-[15px] leading-7 text-foreground/80 flex items-start gap-2" {...props}>
                  <span className="mt-2.5 size-1.5 rounded-full bg-primary/60 shrink-0" />
                  <span className="flex-1">{children}</span>
                </li>
              ),
              blockquote: ({ children, ...props }) => (
                <blockquote className="border-l-4 border-primary bg-primary/5 rounded-r-xl py-3 px-5 my-6 text-foreground/80 text-[15px] leading-7" {...props}>
                  {children}
                </blockquote>
              ),
              table: ({ children, ...props }) => (
                <div className="overflow-x-auto rounded-xl border border-border my-6">
                  <table className="w-full text-sm" {...props}>{children}</table>
                </div>
              ),
              thead: ({ children, ...props }) => (
                <thead className="bg-muted/60" {...props}>{children}</thead>
              ),
              th: ({ children, ...props }) => (
                <th className="px-4 py-2.5 text-left font-semibold text-sm text-foreground border-b border-border" {...props}>{children}</th>
              ),
              td: ({ children, ...props }) => (
                <td className="px-4 py-2.5 text-sm text-foreground/80 border-b border-border/50" {...props}>{children}</td>
              ),
              tr: ({ children, ...props }) => (
                <tr className="even:bg-muted/20 hover:bg-muted/30 transition-colors" {...props}>{children}</tr>
              ),
              hr: (props) => (
                <hr className="border-border my-8" {...props} />
              ),
              code: ({ className, children, ...props }) => {
                const isBlock = className?.includes("language-");
                if (isBlock) {
                  return (
                    <code className={cn("block text-sm", className)} {...props}>{children}</code>
                  );
                }
                return (
                  <code className="bg-muted px-1.5 py-0.5 rounded-md text-sm font-mono text-primary" {...props}>{children}</code>
                );
              },
              pre: ({ children, ...props }) => (
                <pre className="bg-muted/50 border border-border rounded-xl p-4 overflow-x-auto my-4 text-sm" {...props}>{children}</pre>
              ),
              a: ({ children, href, ...props }) => (
                <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>
              ),
            }}
          >
            {markdown}
          </ReactMarkdown>
        </article>
      </div>
    </motion.div>
  );
}
