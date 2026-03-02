export const APP_NAME = "QuickLearn";
export const APP_DESCRIPTION =
  "AI-powered learning platform that transforms any content into interactive study materials.";

/** Canonical site URL for links, metadata, and email. */
export const SITE_URL = "https://www.quicklearn.to";

export const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Upload", href: "/upload" },
  { label: "Library", href: "/library" },
  { label: "Pricing", href: "/pricing" },
] as const;

export const ADMIN_NAV_ITEMS = [
  { label: "Overview", href: "/admin" },
  { label: "Users", href: "/admin/users" },
  { label: "Content", href: "/admin/content" },
  { label: "Feedback", href: "/admin/feedback" },
] as const;

export const CONTENT_TYPE_LABELS: Record<string, string> = {
  PDF: "PDF Document",
  YOUTUBE: "YouTube Video",
  AUDIO: "Audio File",
  LINK: "Web Link",
};

export const CONTENT_TYPE_ICONS: Record<string, string> = {
  PDF: "FileText",
  YOUTUBE: "Youtube",
  AUDIO: "Headphones",
  LINK: "Link",
};

export const PLAN_FEATURES = {
  FREE: {
    maxCreditsPerDay: 5,
    contentTypes: ["PDF", "LINK"],
    features: ["Basic summaries", "Flashcards"],
  },
  PRO: {
    maxCreditsPerDay: 50,
    contentTypes: ["PDF", "YOUTUBE", "AUDIO", "LINK"],
    features: [
      "Detailed summaries",
      "Flashcards",
      "Q&A generation",
      "Chat with content",
    ],
  },
  ENTERPRISE: {
    maxCreditsPerDay: Infinity,
    contentTypes: ["PDF", "YOUTUBE", "AUDIO", "LINK"],
    features: [
      "Advanced summaries",
      "Flashcards",
      "Q&A generation",
      "Chat with content",
      "API access",
      "Priority support",
    ],
  },
} as const;

/** Shown in UI while summary is being generated in the background. */
export const SUMMARY_PLACEHOLDER_MARKDOWN =
  "Summary is being generated. This may take a minute.";

/** Shown when background summary generation failed (so UI can show Regenerate). */
export const SUMMARY_FAILED_MARKDOWN =
  "Summary generation failed. Use **Regenerate** from the content card menu to try again (costs 1 credit).";

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const SUPPORTED_PDF_TYPES = ["application/pdf"];
export const SUPPORTED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/mp4",
  "audio/webm",
];
