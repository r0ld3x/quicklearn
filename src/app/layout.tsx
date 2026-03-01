import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.quicklearn.me"),
  title: {
    default: "QuickLearn - AI-Powered Learning Platform",
    template: "%s | QuickLearn",
  },
  description:
    "Master any topic faster with AI-powered summaries, quizzes, and personalized learning paths. Transform videos, articles, and documents into interactive study material.",
  keywords: [
    "AI learning",
    "study platform",
    "AI tutor",
    "personalized learning",
    "quiz generator",
    "video summarizer",
    "document analysis",
    "spaced repetition",
    "online education",
    "QuickLearn",
  ],
  authors: [{ name: "QuickLearn" }],
  creator: "QuickLearn",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "QuickLearn",
    url: "https://www.quicklearn.me",
    title: "QuickLearn - AI-Powered Learning Platform",
    description:
      "Master any topic faster with AI-powered summaries, quizzes, and personalized learning paths.",
  },
  twitter: {
    card: "summary_large_image",
    title: "QuickLearn - AI-Powered Learning Platform",
    description:
      "Master any topic faster with AI-powered summaries, quizzes, and personalized learning paths.",
    creator: "@quicklearn",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
