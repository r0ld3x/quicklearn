import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { generateText } from "ai";
import { model } from "@/lib/ai";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { checkCredits } from "@/lib/credits";

const quizSchema = z.object({
  contentId: z.string().uuid(),
  numberOfQuestions: z.number().int().min(3).max(20).optional().default(10),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    const parsed = quizSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { contentId, numberOfQuestions } = parsed.data;

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
        { status: 400 }
      );
    }

    const creditCheck = await checkCredits(user.id, user.plan);
    if (!creditCheck.allowed) {
      return NextResponse.json(
        { error: creditCheck.error },
        { status: 429 }
      );
    }

    // Credit was consumed when content was processed to COMPLETED; no extra deduction for quiz.

    const sourceText = content.summary?.markdown || content.extractedText;

    const { text } = await generateText({
      model: model(),
      system: `You are an expert quiz creator for educational content. Generate exactly ${numberOfQuestions} multiple-choice quiz questions.

Return ONLY a valid JSON array with no additional text. Each question should have:
- "question": A clear, specific question testing real understanding (not trivial recall)
- "options": An array of exactly 4 answer choices (strings). Make wrong options plausible — not obviously wrong.
- "correctAnswer": The index (0-3) of the correct option
- "explanation": A 2-3 sentence explanation of why the correct answer is right and why the others are wrong

Guidelines:
- Cover ALL major topics from the content evenly
- Mix difficulty: some factual, some conceptual, some application-based
- Wrong options should be realistic distractors, not jokes
- Questions should test understanding, not memorization of exact wording`,
      prompt: `Create a quiz from this study material:\n\n${sourceText.slice(0, 25000)}`,
    });

    let questions: {
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
    }[];

    try {
      const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      questions = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("[AI_QUIZ]", error);
    const message =
      error instanceof Error ? error.message : "Quiz generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
