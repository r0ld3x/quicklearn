"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChatInterface } from "@/components/ai/chat-interface";

export default function ChatPage() {
  const params = useParams();
  const contentId = params.id as string;

  const { data: content } = useQuery({
    queryKey: ["content", contentId],
    queryFn: async () => {
      const res = await fetch(`/api/content/${contentId}`);
      if (!res.ok) throw new Error("Content not found");
      return res.json();
    },
    staleTime: Infinity,
  });

  if (!content) return null;

  const detail = content as {
    id: string;
    title: string;
    chatMessages: { id: string; role: string; content: string; createdAt: string }[];
  };

  return (
    <ChatInterface
      contentId={detail.id}
      contentTitle={detail.title}
      savedMessages={detail.chatMessages}
    />
  );
}
