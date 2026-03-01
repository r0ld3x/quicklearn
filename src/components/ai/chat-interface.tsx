"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ChatInterfaceProps {
  contentId: string;
  contentTitle?: string;
  savedMessages?: { id: string; role: string; content: string; createdAt: string }[];
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const suggestedQuestions = [
  "Summarize the key points",
  "Explain this in simpler terms",
  "What are the practical applications?",
  "Give me a quick revision",
];

export function ChatInterface({ contentId, contentTitle, savedMessages = [] }: ChatInterfaceProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    savedMessages.map((m) => ({
      id: m.id,
      role: m.role.toLowerCase() as "user" | "assistant",
      content: m.content,
    }))
  );

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    isNearBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const scrollToBottom = useCallback((instant = false) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: instant ? "instant" : "smooth",
    });
  }, []);

  useEffect(() => {
    scrollToBottom(true);
  }, [scrollToBottom]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text.trim(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsStreaming(true);
    isNearBottomRef.current = true;

    setTimeout(() => scrollToBottom(true), 50);

    const assistantId = `assistant-${Date.now()}`;
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Chat failed" }));
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: `Error: ${errData.error || "Something went wrong"}` }
              : m
          )
        );
        setIsStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: fullText } : m
          )
        );

        if (isNearBottomRef.current) {
          scrollToBottom();
        }
      }
    } catch (err) {
      console.error("[CHAT]", err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: "Sorry, something went wrong. Please try again." }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-[calc(100vh-280px)] min-h-[500px] max-h-[800px] rounded-xl border bg-card overflow-hidden"
    >
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/30 shrink-0">
        <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10">
          <Sparkles className="size-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">AI Chat</p>
          <p className="text-xs text-muted-foreground truncate">
            {contentTitle ? `Discussing: ${contentTitle}` : "Ask questions about this content"}
          </p>
        </div>
        {messages.length > 0 && (
          <span className="text-[10px] text-muted-foreground shrink-0">
            {messages.length} messages
          </span>
        )}
      </div>

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overscroll-contain"
      >
        <div className="p-4 space-y-4">
          {messages.length === 0 && !isStreaming && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 gap-4"
            >
              <div className="flex items-center justify-center size-16 rounded-2xl bg-primary/10">
                <Bot className="size-8 text-primary" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-medium">Start a conversation</p>
                <p className="text-sm text-muted-foreground">
                  Ask anything about this content
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 max-w-md mt-2">
                {suggestedQuestions.map((q) => (
                  <Button
                    key={q}
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => sendMessage(q)}
                  >
                    {q}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "flex gap-3",
                  message.role === "user" && "flex-row-reverse"
                )}
              >
                <Avatar className="shrink-0 mt-0.5 size-7">
                  <AvatarFallback
                    className={cn(
                      "text-xs",
                      message.role === "assistant"
                        ? "bg-primary/20 text-primary"
                        : "bg-muted"
                    )}
                  >
                    {message.role === "assistant" ? (
                      <Bot className="size-3.5" />
                    ) : (
                      <User className="size-3.5" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    "rounded-xl px-4 py-2.5 max-w-[80%] text-sm leading-relaxed",
                    message.role === "assistant"
                      ? "bg-muted/50 border"
                      : "bg-primary text-primary-foreground"
                  )}
                >
                  {message.role === "assistant" ? (
                    message.content ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                          em: ({ children }) => <em className="italic">{children}</em>,
                          ul: ({ children }) => <ul className="my-2 ml-4 space-y-1 list-disc">{children}</ul>,
                          ol: ({ children }) => <ol className="my-2 ml-4 space-y-1 list-decimal">{children}</ol>,
                          li: ({ children }) => <li className="text-sm">{children}</li>,
                          code: ({ className, children }) => {
                            const isInline = !className;
                            if (isInline) {
                              return <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{children}</code>;
                            }
                            return <code className={cn("text-xs", className)}>{children}</code>;
                          },
                          pre: ({ children }) => (
                            <pre className="hljs border border-border rounded-lg p-3 overflow-x-auto my-2 text-xs">{children}</pre>
                          ),
                          table: ({ children }) => (
                            <div className="overflow-x-auto rounded-lg border border-border my-2">
                              <table className="w-full text-xs">{children}</table>
                            </div>
                          ),
                          thead: ({ children }) => <thead className="bg-muted/60">{children}</thead>,
                          th: ({ children }) => <th className="px-3 py-1.5 text-left font-semibold text-xs border-b border-border">{children}</th>,
                          td: ({ children }) => <td className="px-3 py-1.5 text-xs border-b border-border/50">{children}</td>,
                          blockquote: ({ children }) => <blockquote className="border-l-2 border-primary/40 pl-3 my-2 text-muted-foreground">{children}</blockquote>,
                          a: ({ children, href }) => <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="size-3.5 animate-spin" />
                        Thinking...
                      </div>
                    )
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <div ref={bottomRef} className="h-1" />
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t p-3 flex items-end gap-2 bg-background shrink-0"
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="min-h-10 max-h-32 resize-none text-sm"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || isStreaming}
          className="shrink-0"
        >
          <Send className="size-4" />
        </Button>
      </form>
    </motion.div>
  );
}
