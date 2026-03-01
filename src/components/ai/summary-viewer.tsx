"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Copy,
  FileDown,
  List,
  Tag,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

interface SummaryViewerProps {
  markdown: string;
  keyTopics?: string[];
}

interface Section {
  id: string;
  title: string;
  level: number;
  content: string;
  subsections: { id: string; title: string; content: string }[];
}

function cleanHeadingText(raw: string): string {
  return raw
    .replace(/[*_`]/g, "")
    .replace(/^\p{Emoji_Presentation}\s*/u, "")
    .replace(/^\p{Emoji}\uFE0F?\s*/u, "");
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function extractHeadings(
  md: string,
): { level: number; text: string; id: string }[] {
  const headings: { level: number; text: string; id: string }[] = [];
  for (const line of md.split("\n")) {
    const match = line.match(/^(#{1,3})\s+(.+)/);
    if (match) {
      const text = cleanHeadingText(match[2]);
      headings.push({ level: match[1].length, text, id: slugify(text) });
    }
  }
  return headings;
}

function parseSections(md: string): {
  intro: string;
  title: string;
  sections: Section[];
} {
  const lines = md.split("\n");
  let title = "";
  const introLines = [];
  const sections: Section[] = [];
  let currentSection: Section | null = null;
  let currentSubLines: string[] = [];
  let currentSubTitle = "";
  let currentSubId = "";
  let inIntro = true;

  const flushSub = () => {
    if (currentSection && currentSubTitle) {
      currentSection.subsections.push({
        id: currentSubId,
        title: currentSubTitle,
        content: currentSubLines.join("\n").trim(),
      });
    }
    currentSubLines = [];
    currentSubTitle = "";
    currentSubId = "";
  };

  const flushSection = () => {
    if (currentSection) {
      if (currentSubTitle) {
        flushSub();
      } else {
        currentSection.content = currentSubLines.join("\n").trim();
        currentSubLines = [];
      }
      sections.push(currentSection);
    }
    currentSection = null;
  };

  for (const line of lines) {
    const h1 = line.match(/^#\s+(.+)/);
    const h2 = line.match(/^##\s+(.+)/);
    const h3 = line.match(/^###\s+(.+)/);

    if (h1 && !h2) {
      title = cleanHeadingText(h1[1]);
      inIntro = true;
      continue;
    }

    if (h2 && !h3) {
      inIntro = false;
      flushSection();
      const text = cleanHeadingText(h2[1]);
      currentSection = {
        id: slugify(text),
        title: text,
        level: 2,
        content: "",
        subsections: [],
      };
      currentSubLines = [];
      currentSubTitle = "";
      continue;
    }

    if (h3 && currentSection) {
      if (currentSubTitle) {
        flushSub();
      } else if (currentSubLines.length > 0) {
        currentSection.content = currentSubLines.join("\n").trim();
        currentSubLines = [];
      }
      const text = cleanHeadingText(h3[1]);
      currentSubTitle = text;
      currentSubId = slugify(text);
      continue;
    }

    if (inIntro) {
      introLines.push(line);
    } else {
      currentSubLines.push(line);
    }
  }

  flushSection();

  return { intro: introLines.join("\n").trim(), title, sections };
}

function makeId(children: React.ReactNode): string {
  return slugify(cleanHeadingText(String(children)));
}

const markdownComponents = {
  h1: ({ children, ...props }: React.ComponentProps<"h1">) => (
    <h1
      id={makeId(children)}
      className="text-2xl font-bold tracking-tight mt-0 mb-5 pb-3 border-b border-border text-foreground"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: React.ComponentProps<"h2">) => (
    <h2
      id={makeId(children)}
      className="text-xl font-bold tracking-tight mt-6 mb-4 text-foreground flex items-center gap-2 scroll-mt-6"
      {...props}
    >
      <span className="inline-block w-1 h-6 bg-primary rounded-full shrink-0" />
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: React.ComponentProps<"h3">) => (
    <h3
      id={makeId(children)}
      className="text-lg font-semibold mt-6 mb-3 text-foreground/90 scroll-mt-6"
      {...props}
    >
      {children}
    </h3>
  ),
  p: ({ children, ...props }: React.ComponentProps<"p">) => (
    <p className="text-[15px] leading-7 mb-4 text-foreground/80" {...props}>
      {children}
    </p>
  ),
  strong: ({ children, ...props }: React.ComponentProps<"strong">) => (
    <strong className="font-semibold text-foreground" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }: React.ComponentProps<"em">) => (
    <em className="italic text-foreground/70" {...props}>
      {children}
    </em>
  ),
  ul: ({ children, ...props }: React.ComponentProps<"ul">) => (
    <ul className="my-4 ml-1 space-y-2" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: React.ComponentProps<"ol">) => (
    <ol className="my-4 ml-1 space-y-2 list-decimal list-inside" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: React.ComponentProps<"li">) => (
    <li
      className="text-[15px] leading-7 text-foreground/80 flex items-start gap-2"
      {...props}
    >
      <span className="mt-2.5 size-1.5 rounded-full bg-primary/60 shrink-0" />
      <span className="flex-1">{children}</span>
    </li>
  ),
  blockquote: ({ children, ...props }: React.ComponentProps<"blockquote">) => (
    <blockquote
      className="border-l-4 border-primary bg-primary/5 rounded-r-xl py-3 px-5 my-6 text-foreground/80 text-[15px] leading-7"
      {...props}
    >
      {children}
    </blockquote>
  ),
  table: ({ children, ...props }: React.ComponentProps<"table">) => (
    <div className="overflow-x-auto rounded-xl border border-border my-6">
      <table className="w-full text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }: React.ComponentProps<"thead">) => (
    <thead className="bg-muted/60" {...props}>
      {children}
    </thead>
  ),
  th: ({ children, ...props }: React.ComponentProps<"th">) => (
    <th
      className="px-4 py-2.5 text-left font-semibold text-sm text-foreground border-b border-border"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }: React.ComponentProps<"td">) => (
    <td
      className="px-4 py-2.5 text-sm text-foreground/80 border-b border-border/50"
      {...props}
    >
      {children}
    </td>
  ),
  tr: ({ children, ...props }: React.ComponentProps<"tr">) => (
    <tr
      className="even:bg-muted/20 hover:bg-muted/30 transition-colors"
      {...props}
    >
      {children}
    </tr>
  ),
  hr: (props: React.ComponentProps<"hr">) => (
    <hr className="border-border my-8" {...props} />
  ),
  code: ({
    className,
    children,
    ...props
  }: React.ComponentProps<"code"> & { className?: string }) => {
    if (!className) {
      return (
        <code
          className="bg-muted px-1.5 py-0.5 rounded-md text-sm font-mono text-primary"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code className={cn("text-sm", className)} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }: React.ComponentProps<"pre">) => (
    <pre
      className="hljs border border-border rounded-xl p-4 overflow-x-auto my-4 text-sm"
      {...props}
    >
      {children}
    </pre>
  ),
  a: ({ children, href, ...props }: React.ComponentProps<"a">) => (
    <a
      href={href}
      className="text-primary hover:underline"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
};

function MarkdownBlock({ content }: { content: string }) {
  if (!content) return null;
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={markdownComponents}
    >
      {content}
    </ReactMarkdown>
  );
}

function CollapsibleSection({
  section,
  isOpen,
  onToggle,
}: {
  section: Section;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      id={section.id}
      className="rounded-xl border border-border bg-card overflow-hidden scroll-mt-6 transition-shadow hover:shadow-sm"
    >
      <button
        onClick={onToggle}
        className="flex items-center gap-3 w-full px-5 py-4 text-left hover:bg-muted/30 transition-colors"
      >
        <div
          className={cn(
            "flex items-center justify-center size-7 rounded-lg transition-colors shrink-0",
            isOpen
              ? "bg-primary/15 text-primary"
              : "bg-muted text-muted-foreground",
          )}
        >
          <motion.div
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="size-4" />
          </motion.div>
        </div>
        <span className="text-base font-semibold text-foreground flex-1">
          {section.title}
        </span>
        {section.subsections.length > 0 && (
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 h-5 shrink-0"
          >
            {section.subsections.length} topics
          </Badge>
        )}
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-border/50">
              {section.content && (
                <div className="pt-4">
                  <MarkdownBlock content={section.content} />
                </div>
              )}

              {section.subsections.length > 0 && (
                <div className="space-y-3 mt-4">
                  {section.subsections.map((sub) => (
                    <CollapsibleSubsection key={sub.id} sub={sub} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CollapsibleSubsection({
  sub,
}: {
  sub: { id: string; title: string; content: string };
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div
      id={sub.id}
      className="rounded-lg border border-border/60 bg-muted/20 overflow-hidden scroll-mt-6"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 w-full px-4 py-3 text-left hover:bg-muted/40 transition-colors"
      >
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </motion.div>
        <span className="text-sm font-medium text-foreground/90">
          {sub.title}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-border/30">
              <div className="pt-3">
                <MarkdownBlock content={sub.content} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SummaryViewer({
  markdown,
  keyTopics = [],
}: SummaryViewerProps) {
  const [copied, setCopied] = useState(false);
  const [showToc, setShowToc] = useState(true);

  const headings = useMemo(() => extractHeadings(markdown), [markdown]);
  const { intro, title, sections } = useMemo(
    () => parseSections(markdown),
    [markdown],
  );
  const hasSections = sections.length > 0;

  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>(
    () => {
      const map: Record<string, boolean> = {};
      sections.forEach((s) => {
        map[s.id] = true;
      });
      return map;
    },
  );
  const allExpanded = sections.every((s) => expandedMap[s.id] !== false);

  const toggleAll = useCallback(() => {
    const next = !allExpanded;
    setExpandedMap((prev) => {
      const map = { ...prev };
      sections.forEach((s) => {
        map[s.id] = next;
      });
      return map;
    });
  }, [allExpanded, sections]);

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
                    h.level === 1 &&
                      "font-semibold text-foreground/80 pl-3 border-transparent hover:border-primary",
                    h.level === 2 &&
                      "pl-3 border-transparent hover:border-primary",
                    h.level === 3 &&
                      "pl-6 border-transparent hover:border-primary/50",
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
                  <Badge
                    key={topic}
                    variant="secondary"
                    className="text-xs font-medium"
                  >
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
            {hasSections && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleAll}
                className="text-xs h-7 gap-1.5 px-2"
              >
                <ChevronsUpDown className="size-3.5" />
                {allExpanded ? "Collapse all" : "Expand all"}
              </Button>
            )}
            {headings.length > 2 && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowToc(!showToc)}
                className="hidden xl:inline-flex"
              >
                <List className="size-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon-sm" onClick={handleCopy}>
              {copied ? (
                <Check className="size-4 text-emerald-500" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={handleDownload}>
              <FileDown className="size-4" />
            </Button>
          </div>
        </div>

        <Separator />

        {hasSections ? (
          <div className="space-y-5">
            {title && (
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center justify-center size-9 rounded-xl bg-primary/10 shrink-0">
                  <BookOpen className="size-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-foreground">
                    {title}
                  </h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {sections.length} sections &middot; {readTime} min read
                  </p>
                </div>
              </div>
            )}

            {intro && (
              <div className="rounded-xl border border-border bg-card p-5">
                <MarkdownBlock content={intro} />
              </div>
            )}

            <div className="space-y-3">
              {sections.map((section, idx) => (
                <CollapsibleSection
                  key={section.id + idx}
                  section={section}
                  isOpen={expandedMap[section.id] !== false}
                  onToggle={() =>
                    setExpandedMap((prev) => ({
                      ...prev,
                      [section.id]: prev[section.id] === false,
                    }))
                  }
                />
              ))}
            </div>
          </div>
        ) : (
          <article className="summary-markdown">
            <MarkdownBlock content={markdown} />
          </article>
        )}
      </div>
    </motion.div>
  );
}
