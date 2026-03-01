import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { generateText } from "ai";
import { model } from "@/lib/ai";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

const flashcardsSchema = z.object({
  contentId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = flashcardsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const content = await db.content.findUnique({
      where: { id: parsed.data.contentId },
      include: { flashcards: true, summary: true },
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
        { status: 400 }
      );
    }

    if (content.flashcards.length > 0) {
      return NextResponse.json({ flashcards: content.flashcards });
    }

    const sourceText = content.summary?.markdown || content.extractedText;

    const { text } = await generateText({
      model: model(),
      system: `You are an expert educator creating flashcards for studying. Generate 15-20 high-quality flashcards from the provided study material.

Return ONLY a valid JSON array with no additional text. Each flashcard should have:
- "question": A clear, specific question that tests understanding (not just recall)
- "answer": A detailed, complete answer (2-4 sentences) that teaches the concept
- "difficulty": One of "EASY", "MEDIUM", or "HARD"

Guidelines:
- EASY: Definitions, basic facts, simple recall
- MEDIUM: Comparisons, applications, explaining concepts
- HARD: Analysis, edge cases, connecting multiple concepts
- Mix difficulty: ~5 EASY, ~8 MEDIUM, ~5 HARD
- Cover ALL major topics from the content
- Make questions specific — avoid vague questions like "What is X about?"
- Answers should be educational — a student should learn from reading the answer`,
      prompt: `Create detailed flashcards from this study material:\n\n${sourceText.slice(0, 25000)}`,
    });

    let flashcardsData: { question: string; answer: string; difficulty: string }[];
    try {
      const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      flashcardsData = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    const flashcards = await Promise.all(
      flashcardsData.map((card, index) =>
        db.flashcard.create({
          data: {
            contentId: content.id,
            question: card.question,
            answer: card.answer,
            difficulty: card.difficulty as "EASY" | "MEDIUM" | "HARD",
            order: index,
          },
        })
      )
    );

    await db.user.update({
      where: { id: user.id },
      data: { totalCreditsUsed: { increment: 1 } },
    });

    return NextResponse.json({ flashcards });
  } catch (error) {
    console.error("[AI_FLASHCARDS]", error);
    const message =
      error instanceof Error ? error.message : "Flashcard generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
