import { model } from "@/lib/ai";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { streamText } from "ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { messages, contentId } = body;

    if (!contentId) {
      return NextResponse.json(
        { error: "contentId is required" },
        { status: 400 },
      );
    }

    const content = await db.content.findUnique({
      where: { id: contentId },
      include: { summary: true },
    });

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    if (content.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!content.extractedText) {
      return NextResponse.json(
        { error: "Content has not been processed yet" },
        { status: 400 },
      );
    }

    const lastUserMessage = messages?.[messages.length - 1];
    if (lastUserMessage?.role === "user") {
      const msgContent =
        typeof lastUserMessage.content === "string"
          ? lastUserMessage.content
          : lastUserMessage.parts
              ?.filter((p: { type: string }) => p.type === "text")
              .map((p: { text: string }) => p.text)
              .join("") || "";

      if (msgContent) {
        await db.chatMessage.create({
          data: {
            contentId,
            userId: user.id,
            role: "USER",
            content: msgContent,
          },
        });
      }
    }

    const sourceText = content.summary?.markdown || content.extractedText;

    const result = streamText({
      model: model(),
      system: `You are a friendly, concise study assistant. You help students understand their study material through conversation.

STUDY MATERIAL (for reference only — do NOT dump this into your responses):
${sourceText.slice(0, 25000)}

CRITICAL RULES:
1. Keep responses SHORT and conversational — 2-5 sentences for simple questions, a few bullet points max for complex ones
2. NEVER repeat or summarize the entire study material unless explicitly asked "summarize everything"
3. Answer ONLY what was asked — no more, no less
4. For casual questions like "who are you?" or "hello", respond naturally in 1-2 sentences without referencing the material
5. For content questions, give a focused, direct answer about that specific topic
6. Use simple language, be friendly, like a helpful tutor
7. If the question is off-topic, briefly redirect without being preachy`,
      messages: (messages || []).map(
        (m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant",
          content: typeof m.content === "string" ? m.content : "",
        }),
      ),
      async onFinish({ text }) {
        await db.chatMessage.create({
          data: {
            contentId,
            userId: user.id,
            role: "ASSISTANT",
            content: text,
          },
        });
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("[AI_CHAT]", error);
    const message = error instanceof Error ? error.message : "Chat failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
