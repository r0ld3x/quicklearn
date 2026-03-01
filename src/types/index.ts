export enum ContentType {
  PDF = "PDF",
  YOUTUBE = "YOUTUBE",
  AUDIO = "AUDIO",
  LINK = "LINK",
}

export enum PlanType {
  FREE = "FREE",
  PRO = "PRO",
  ENTERPRISE = "ENTERPRISE",
}

export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
}

export enum ContentStatus {
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export enum Difficulty {
  EASY = "EASY",
  MEDIUM = "MEDIUM",
  HARD = "HARD",
}

export enum MessageRole {
  USER = "USER",
  ASSISTANT = "ASSISTANT",
}

export enum FeedbackType {
  BUG = "BUG",
  FEATURE = "FEATURE",
  GENERAL = "GENERAL",
}

export enum FeedbackStatus {
  PENDING = "PENDING",
  REVIEWED = "REVIEWED",
  RESOLVED = "RESOLVED",
}

export enum SubscriptionStatus {
  ACTIVE = "ACTIVE",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
}

export interface User {
  id: string;
  name: string | null;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: UserRole;
  plan: PlanType;
  credits: number;
  totalCreditsUsed: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface Content {
  id: string;
  userId: string;
  type: ContentType;
  title: string;
  description: string | null;
  sourceUrl: string | null;
  fileUrl: string | null;
  fileKey: string | null;
  originalFilename: string | null;
  extractedText: string | null;
  status: ContentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Summary {
  id: string;
  contentId: string;
  markdown: string;
  keyTopics: string[];
  createdAt: Date;
}

export interface Flashcard {
  id: string;
  contentId: string;
  question: string;
  answer: string;
  difficulty: Difficulty;
  order: number;
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  contentId: string;
  userId: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
}

export interface QnaItem {
  id: string;
  contentId: string;
  question: string;
  answer: string;
  order: number;
  createdAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: PlanType;
  status: SubscriptionStatus;
  razorpaySubscriptionId: string | null;
  razorpayPaymentId: string | null;
  amount: number;
  currency: string;
  startDate: Date;
  endDate: Date | null;
  createdAt: Date;
}

export interface Feedback {
  id: string;
  userId: string;
  type: FeedbackType;
  subject: string;
  message: string;
  status: FeedbackStatus;
  createdAt: Date;
}

export interface ContentWithRelations extends Content {
  summary: Summary | null;
  flashcards: Flashcard[];
  chatMessages: ChatMessage[];
  qnaItems: QnaItem[];
  user?: User;
}
