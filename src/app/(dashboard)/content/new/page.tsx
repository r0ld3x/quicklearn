"use client";

import { useState, useCallback, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Youtube,
  Headphones,
  Link as LinkIcon,
  Upload,
  X,
  File,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const tabConfig = [
  { value: "pdf", label: "PDF / PPT", icon: FileText, color: "text-red-500", comingSoon: false },
  { value: "link", label: "Web Link", icon: LinkIcon, color: "text-blue-500", comingSoon: false },
  { value: "youtube", label: "YouTube", icon: Youtube, color: "text-red-600", comingSoon: true },
  { value: "audio", label: "Audio", icon: Headphones, color: "text-purple-500", comingSoon: true },
];

const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)[\w-]+/;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getYoutubeThumbnail(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]+)/);
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
}

export default function NewContentPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>}>
      <NewContentPageInner />
    </Suspense>
  );
}

function NewContentPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const typeParam = searchParams.get("type");
  const initialTab = typeParam === "pdf" || typeParam === "link" ? typeParam : "pdf";

  const [activeTab, setActiveTab] = useState(initialTab);
  const [title, setTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [, setCurrentStep] = useState(0);
  const [stepStatuses, setStepStatuses] = useState<("pending" | "active" | "done" | "error")[]>([
    "pending", "pending", "pending", "pending",
  ]);

  const steps = ["Upload file", "Create record", "Extract text", "Generate summary"];

  const updateStep = (index: number, status: "active" | "done" | "error") => {
    setCurrentStep(index);
    setStepStatuses((prev) => {
      const next = [...prev];
      next[index] = status;
      return next;
    });
  };

  const onDropPdf = useCallback((accepted: File[]) => {
    if (accepted.length > 0) {
      setFile(accepted[0]);
      if (!title) setTitle(accepted[0].name.replace(/\.[^/.]+$/, ""));
    }
  }, [title]);

  const onDropAudio = useCallback((accepted: File[]) => {
    if (accepted.length > 0) {
      setAudioFile(accepted[0]);
      if (!title) setTitle(accepted[0].name.replace(/\.[^/.]+$/, ""));
    }
  }, [title]);

  const pdfDropzone = useDropzone({
    onDrop: onDropPdf,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.ms-powerpoint": [".ppt"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
    },
    maxFiles: 1,
    maxSize: 16 * 1024 * 1024,
  });

  const audioDropzone = useDropzone({
    onDrop: onDropAudio,
    accept: {
      "audio/mpeg": [".mp3"],
      "audio/wav": [".wav"],
      "audio/mp4": [".m4a"],
      "audio/webm": [".webm"],
    },
    maxFiles: 1,
    maxSize: 64 * 1024 * 1024,
  });

  const isYoutubeValid = youtubeUrl ? youtubeRegex.test(youtubeUrl) : true;
  const thumbnail = youtubeUrl && isYoutubeValid ? getYoutubeThumbnail(youtubeUrl) : null;

  const canSubmit = () => {
    if (!title.trim()) return false;
    switch (activeTab) {
      case "pdf": return !!file;
      case "link": return !!linkUrl.trim();
      default: return false;
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;
    setIsSubmitting(true);
    setUploadProgress(0);
    setStepStatuses(["pending", "pending", "pending", "pending"]);

    try {
      let content: { id: string; status?: string };
      const contentType = activeTab === "link" ? "LINK" : "PDF";

      if (activeTab === "pdf" && file) {
        updateStep(0, "active");
        updateStep(1, "active");
        setStatusText("Uploading PDF...");
        setUploadProgress(20);
        const formData = new FormData();
        formData.set("file", file);
        formData.set("type", "PDF");
        if (title.trim()) formData.set("title", title.trim());
        const uploadRes = await fetch("/api/content/upload", {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) {
          updateStep(0, "error");
          updateStep(1, "error");
          const errData = await uploadRes.json().catch(() => ({}));
          toast.error(errData.error || "Upload failed");
          return;
        }
        content = await uploadRes.json();
        updateStep(0, "done");
        updateStep(1, "done");
        setUploadProgress(30);
      } else {
        updateStep(0, "active");
        setStatusText("Preparing...");
        setUploadProgress(10);
        const body: { type: string; title?: string; sourceUrl?: string } = {
          type: contentType,
          title: title.trim() || undefined,
        };
        body.sourceUrl = linkUrl;
        const createRes = await fetch("/api/content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!createRes.ok) {
          updateStep(0, "error");
          const errData = await createRes.json().catch(() => ({}));
          toast.error(errData.error || "Failed to create content");
          return;
        }
        content = await createRes.json();
        updateStep(0, "done");
        setUploadProgress(30);
      }

      setUploadProgress(40);

      // Extract text
      updateStep(2, "active");
      setStatusText("Extracting text from your content...");

      const processRes = await fetch("/api/content/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: content.id }),
      });

      if (!processRes.ok) {
        updateStep(2, "error");
        await processRes.json().catch(() => ({}));
        toast.warning("Content created but text extraction failed. You can retry from the content page.");
        queryClient.invalidateQueries({ queryKey: ["content"] });
        router.push(`/content/${content.id}`);
        return;
      }

      const processedContent = await processRes.json();
      updateStep(2, "done");
      setUploadProgress(70);

      if (processedContent.status !== "COMPLETED") {
        updateStep(3, "error");
        toast.warning("No text could be extracted. You can retry from the content page.");
        queryClient.invalidateQueries({ queryKey: ["content"] });
        router.push(`/content/${content.id}`);
        return;
      }

      updateStep(3, "active");
      setStatusText("Summary will generate on the next page...");
      setUploadProgress(100);
      updateStep(3, "done");
      toast.success("Content processed! Your summary is generating.");
      queryClient.invalidateQueries({ queryKey: ["content"] });
      router.push(`/content/${content.id}`);
    } catch (err) {
      console.error("[CONTENT_CREATE]", err);
      toast.error(err instanceof Error ? err.message : "Failed to create content.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add New Content</h1>
        <p className="text-muted-foreground mt-1">
          Choose a content type and provide the source material.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => {
        const tab = tabConfig.find((t) => t.value === v);
        if (tab?.comingSoon) return;
        setActiveTab(v);
      }}>
        <TabsList className="w-full">
          {tabConfig.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                disabled={tab.comingSoon}
                className={cn("flex-1 gap-1.5", tab.comingSoon && "opacity-50 cursor-not-allowed")}
              >
                <Icon className={cn("size-4", tab.color)} />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.comingSoon && (
                  <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 ml-1 hidden sm:inline-flex">
                    Soon
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Title
              {activeTab === "youtube" && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  (optional – auto-grab from video)
                </span>
              )}
            </Label>
            <Input
              id="title"
              placeholder={
                activeTab === "youtube"
                  ? "Leave blank to use video title"
                  : "Give your content a title..."
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <TabsContent value="pdf">
            <div
              {...pdfDropzone.getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
                pdfDropzone.isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/20 hover:border-primary/40"
              )}
            >
              <input {...pdfDropzone.getInputProps()} />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="flex items-center justify-center size-12 rounded-lg bg-red-500/10">
                    <File className="size-6 text-red-500" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-center size-14 rounded-xl bg-red-500/10 mx-auto">
                    <Upload className="size-6 text-red-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Drop your PDF or PPT here</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      or click to browse &middot; Max 16MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="youtube">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="youtube-url">YouTube URL</Label>
                <div className="relative">
                  <Input
                    id="youtube-url"
                    placeholder="https://youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className={cn(!isYoutubeValid && "border-red-500 focus-visible:border-red-500")}
                  />
                  {youtubeUrl && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isYoutubeValid ? (
                        <CheckCircle2 className="size-4 text-emerald-500" />
                      ) : (
                        <AlertCircle className="size-4 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {!isYoutubeValid && (
                  <p className="text-xs text-red-500">Please enter a valid YouTube URL</p>
                )}
              </div>
              <AnimatePresence>
                {thumbnail && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden rounded-lg border"
                  >
                    <Image
                      src={thumbnail}
                      alt="Video thumbnail"
                      width={640}
                      height={360}
                      className="w-full aspect-video object-cover"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </TabsContent>

          <TabsContent value="audio">
            <div
              {...audioDropzone.getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
                audioDropzone.isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/20 hover:border-primary/40"
              )}
            >
              <input {...audioDropzone.getInputProps()} />
              {audioFile ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="flex items-center justify-center size-12 rounded-lg bg-purple-500/10">
                    <Headphones className="size-6 text-purple-500" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">{audioFile.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(audioFile.size)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => { e.stopPropagation(); setAudioFile(null); }}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-center size-14 rounded-xl bg-purple-500/10 mx-auto">
                    <Upload className="size-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Drop your audio file here</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      MP3, WAV, M4A, or WebM &middot; Max 64MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="link">
            <div className="space-y-2">
              <Label htmlFor="link-url">Web URL</Label>
              <Input
                id="link-url"
                placeholder="https://example.com/article..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Paste a link to any web article, blog post, or documentation page.
              </p>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card>
              <CardContent className="p-5 space-y-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{statusText}</span>
                  <span className="text-muted-foreground">{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
                <div className="grid grid-cols-1 gap-3">
                  {steps.map((step, i) => {
                    const status = stepStatuses[i];
                    return (
                      <motion.div
                        key={step}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                          status === "active" && "bg-primary/5 text-primary",
                          status === "done" && "text-emerald-600",
                          status === "error" && "text-red-500",
                          status === "pending" && "text-muted-foreground/50"
                        )}
                      >
                        <div className="shrink-0">
                          {status === "active" && <Loader2 className="size-4 animate-spin" />}
                          {status === "done" && <CheckCircle2 className="size-4" />}
                          {status === "error" && <AlertCircle className="size-4" />}
                          {status === "pending" && (
                            <div className="size-4 rounded-full border-2 border-muted-foreground/20" />
                          )}
                        </div>
                        <span className={cn(
                          status === "active" && "font-medium",
                          status === "done" && "font-medium"
                        )}>
                          {step}
                        </span>
                        {status === "active" && (
                          <span className="ml-auto text-xs text-primary/70">In progress</span>
                        )}
                        {status === "error" && (
                          <span className="ml-auto text-xs text-red-400">Failed</span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!canSubmit() || isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="size-4" />
              Create Content
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
