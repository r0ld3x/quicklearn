"use client";

import { useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { useQueryClient } from "@tanstack/react-query";
import { useUploadThing } from "@/lib/uploadthing";
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const tabConfig = [
  { value: "pdf", label: "PDF / PPT", icon: FileText, color: "text-red-500" },
  { value: "youtube", label: "YouTube Video", icon: Youtube, color: "text-red-600" },
  { value: "audio", label: "Audio Recording", icon: Headphones, color: "text-purple-500" },
  { value: "link", label: "Web Link", icon: LinkIcon, color: "text-blue-500" },
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
  const initialTab = searchParams.get("type") || "pdf";

  const [activeTab, setActiveTab] = useState(initialTab);
  const [title, setTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
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

  const { startUpload: startPdfUpload } = useUploadThing("pdfUploader");
  const { startUpload: startAudioUpload } = useUploadThing("audioUploader");

  const isYoutubeValid = youtubeUrl ? youtubeRegex.test(youtubeUrl) : true;
  const thumbnail = youtubeUrl && isYoutubeValid ? getYoutubeThumbnail(youtubeUrl) : null;

  const canSubmit = () => {
    if (!title.trim()) return false;
    switch (activeTab) {
      case "pdf": return !!file;
      case "youtube": return !!youtubeUrl && isYoutubeValid;
      case "audio": return !!audioFile;
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
      let fileUrl: string | undefined;
      let fileKey: string | undefined;
      let sourceUrl: string | undefined;
      let originalFilename: string | undefined;
      const contentType = activeTab.toUpperCase() as "PDF" | "YOUTUBE" | "AUDIO" | "LINK";

      // Step 1: Upload
      updateStep(0, "active");
      setStatusText(activeTab === "pdf" ? "Uploading PDF..." : activeTab === "audio" ? "Uploading audio..." : "Preparing...");
      setUploadProgress(10);

      if (activeTab === "pdf" && file) {
        const uploadRes = await startPdfUpload([file]);
        if (!uploadRes || uploadRes.length === 0) throw new Error("PDF upload failed.");
        fileUrl = uploadRes[0].ufsUrl;
        fileKey = uploadRes[0].key;
        originalFilename = file.name;
      } else if (activeTab === "audio" && audioFile) {
        const uploadRes = await startAudioUpload([audioFile]);
        if (!uploadRes || uploadRes.length === 0) throw new Error("Audio upload failed.");
        fileUrl = uploadRes[0].ufsUrl;
        fileKey = uploadRes[0].key;
        originalFilename = audioFile.name;
      } else if (activeTab === "youtube") {
        sourceUrl = youtubeUrl;
      } else if (activeTab === "link") {
        sourceUrl = linkUrl;
      }

      updateStep(0, "done");
      setUploadProgress(30);

      // Step 2: Create record
      updateStep(1, "active");
      setStatusText("Saving content...");

      const createRes = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: contentType,
          title: title.trim(),
          sourceUrl,
          fileUrl,
          fileKey,
          originalFilename,
        }),
      });

      if (!createRes.ok) {
        updateStep(1, "error");
        const errData = await createRes.json();
        throw new Error(errData.error || "Failed to create content");
      }

      const content = await createRes.json();
      updateStep(1, "done");
      setUploadProgress(50);

      // Step 3: Extract text
      updateStep(2, "active");
      setStatusText("Extracting text from your content...");

      const processRes = await fetch("/api/content/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: content.id }),
      });

      if (!processRes.ok) {
        updateStep(2, "error");
        const errData = await processRes.json();
        console.error("[PROCESS]", errData.error);
        toast.warning("Content created but text extraction failed. You can retry from the content page.");
        queryClient.invalidateQueries({ queryKey: ["content"] });
        router.push(`/content/${content.id}`);
        return;
      }

      const processedContent = await processRes.json();
      updateStep(2, "done");
      setUploadProgress(70);

      if (!processedContent.extractedText) {
        updateStep(3, "error");
        toast.warning("No text could be extracted. You can retry from the content page.");
        queryClient.invalidateQueries({ queryKey: ["content"] });
        router.push(`/content/${content.id}`);
        return;
      }

      // Step 4: AI Summary
      updateStep(3, "active");
      setStatusText("AI is generating your summary...");

      await new Promise((r) => setTimeout(r, 500));

      const summarizeRes = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: content.id }),
      });

      setUploadProgress(100);

      if (!summarizeRes.ok) {
        updateStep(3, "error");
        const errText = await summarizeRes.text();
        console.error("[AUTO_SUMMARIZE]", errText);
        toast.success("Content processed! Summary can be generated from the content page.");
      } else {
        updateStep(3, "done");
        toast.success("Content processed and summarized!");
      }

      setStatusText("Done!");
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          {tabConfig.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.value} value={tab.value} className="flex-1 gap-1.5">
                <Icon className={cn("size-4", tab.color)} />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Give your content a title..."
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
                    <img
                      src={thumbnail}
                      alt="Video thumbnail"
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
