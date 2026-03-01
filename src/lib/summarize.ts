import "server-only";
import { generateText } from "ai";
import { after } from "next/server";
import { db } from "@/lib/db";
import { model } from "@/lib/ai";
import { SUMMARY_PLACEHOLDER_MARKDOWN, SUMMARY_FAILED_MARKDOWN } from "@/lib/constants";

export { SUMMARY_PLACEHOLDER_MARKDOWN as PLACEHOLDER_MARKDOWN };

const CHUNK_SIZE = 24_000;
const CHUNK_OVERLAP = 500;
const MAX_CONCURRENCY = 5;

function chunkText(text: string): string[] {
  if (text.length <= CHUNK_SIZE) return [text];
  const sections: string[] = [];
  const sectionSplits = text.split(/\n{2,}/);
  let current = "";
  for (const section of sectionSplits) {
    if (
      current.length + section.length + 2 > CHUNK_SIZE &&
      current.length > 0
    ) {
      sections.push(current.trim());
      const overlapStart = Math.max(0, current.length - CHUNK_OVERLAP);
      current = current.slice(overlapStart) + "\n\n" + section;
    } else {
      current += (current ? "\n\n" : "") + section;
    }
  }
  if (current.trim()) sections.push(current.trim());
  if (sections.length === 1 && sections[0].length > CHUNK_SIZE) {
    return chunkBySize(sections[0]);
  }
  const finalChunks: string[] = [];
  for (const s of sections) {
    if (s.length > CHUNK_SIZE) finalChunks.push(...chunkBySize(s));
    else finalChunks.push(s);
  }
  return finalChunks;
}

function chunkBySize(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + CHUNK_SIZE, text.length);
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf(". ", end);
      const lastNewline = text.lastIndexOf("\n", end);
      const breakPoint = Math.max(lastPeriod, lastNewline);
      if (breakPoint > start + CHUNK_SIZE * 0.5) end = breakPoint + 1;
    }
    chunks.push(text.slice(start, end).trim());
    start = Math.max(start + 1, end - CHUNK_OVERLAP);
  }
  return chunks;
}

async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let nextIndex = 0;
  async function runNext(): Promise<void> {
    while (nextIndex < tasks.length) {
      const idx = nextIndex++;
      results[idx] = await tasks[idx]();
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, tasks.length) }, () => runNext())
  );
  return results;
}

const CHUNK_SYSTEM_PROMPT = `You are an educational content summarizer. Produce structured markdown study notes for the given section.

Rules:
- Use ## headings, ### for subtopics, **bold** for key terms
- Bullet points and numbered lists for clarity
- Cover every topic with specific details, numbers, formulas, examples
- Do NOT add a title, overview, or key takeaways — those come later in the merge step
- Output ONLY the section notes in clean markdown`;

const MERGE_SYSTEM_PROMPT = `You are an elite educational content summarizer used by top students. You will receive multiple section summaries from a larger document. Your job is to MERGE them into ONE cohesive, detailed set of study notes.

Your output MUST follow this exact structure:

# [Title — clear, descriptive title based on the content]

> A 2-3 sentence overview paragraph that captures the essence of the entire content.

## 📋 Overview
A clear introduction paragraph explaining what this content covers, who it's for, and why it matters. 3-5 sentences minimum.

## [Section Title for major topic 1]
Write detailed, thorough explanations for each major topic. Use:
- **Bold** for key terms and definitions
- Sub-sections with ### for subtopics
- Bullet points and numbered lists for clarity
- Real examples and analogies where helpful
- At least 3-5 paragraphs per major section

(Continue for ALL major topics from the section summaries — do NOT skip or abbreviate)

## 📊 Comparison Table
If applicable, include a markdown table comparing key concepts, methods, or categories.

| Concept | Description | Key Feature |
|---------|-------------|-------------|
| ... | ... | ... |

## 💡 Key Takeaways
- Summarize the 8-12 most critical points
- Each point should be a complete, informative sentence
- Use **bold** for the key concept in each takeaway

## 🔗 Important Definitions
List 5-10 key terms with clear definitions using this format:
- **Term**: Clear, concise definition

CRITICAL RULES:
- Output MUST be at least 1500 words. Longer is better. Do NOT cut short.
- Merge overlapping content — deduplicate but don't lose detail
- Maintain logical flow and order across sections
- Write as if creating premium study notes that a student would pay for
- Use emojis sparingly in headings only (📋 💡 📊 🔗 🎯 📌 etc.)
- Maintain academic rigor while being readable
- Include specific details, numbers, formulas, and examples

After the full summary, extract the key topics as a JSON array between |||TOPICS||| markers.
Example: |||TOPICS|||["Machine Learning", "Neural Networks", "Deep Learning"]|||TOPICS|||`;

const SINGLE_SYSTEM_PROMPT = `You are an elite educational content summarizer used by top students. You produce LONG, DETAILED, beautifully structured markdown study notes — not short summaries.

Your output MUST follow this exact structure:

# [Title — clear, descriptive title based on the content]

> A 2-3 sentence overview paragraph that captures the essence of the entire content.

## 📋 Overview
A clear introduction paragraph explaining what this content covers, who it's for, and why it matters. 3-5 sentences minimum.

## [Section Title for major topic 1]
Write detailed, thorough explanations for each major topic. Use:
- **Bold** for key terms and definitions
- Sub-sections with ### for subtopics
- Bullet points and numbered lists for clarity
- Real examples and analogies where helpful
- At least 3-5 paragraphs per major section

(Continue for ALL major topics — do NOT skip or abbreviate)

## 📊 Comparison Table
If applicable, include a markdown table comparing key concepts, methods, or categories.

| Concept | Description | Key Feature |
|---------|-------------|-------------|
| ... | ... | ... |

## 💡 Key Takeaways
- Summarize the 8-12 most critical points
- Each point should be a complete, informative sentence
- Use **bold** for the key concept in each takeaway

## 🔗 Important Definitions
List 5-10 key terms with clear definitions using this format:
- **Term**: Clear, concise definition

CRITICAL RULES:
- Output MUST be at least 1500 words. Longer is better. Do NOT cut short.
- Cover EVERY topic in the source material — do not skip sections
- Write as if creating premium study notes that a student would pay for
- Use emojis sparingly in headings only (📋 💡 📊 🔗 🎯 📌 etc.)
- Maintain academic rigor while being readable
- Include specific details, numbers, formulas, and examples from the source

After the full summary, extract the key topics as a JSON array between |||TOPICS||| markers.
Example: |||TOPICS|||["Machine Learning", "Neural Networks", "Deep Learning"]|||TOPICS|||`;

function extractTopicsAndMarkdown(text: string): {
  markdown: string;
  keyTopics: string[];
} {
  let markdown = text;
  let keyTopics: string[] = [];
  const topicsMatch = text.match(
    /\|\|\|TOPICS\|\|\|([\s\S]*?)\|\|\|TOPICS\|\|\|/
  );
  if (topicsMatch?.[1]) {
    try {
      keyTopics = JSON.parse(topicsMatch[1].trim());
      markdown = text
        .replace(/\|\|\|TOPICS\|\|\|[\s\S]*?\|\|\|TOPICS\|\|\|/, "")
        .trim();
    } catch {
      keyTopics = [];
    }
  }
  return { markdown, keyTopics };
}

async function summarizeSingle(extractedText: string) {
  const { text } = await generateText({
    model: model(),
    maxOutputTokens: 8000,
    system: SINGLE_SYSTEM_PROMPT,
    prompt: `Create comprehensive, detailed study notes from the following content. Cover EVERYTHING — do not skip any section or topic:\n\n${extractedText}`,
  });
  return extractTopicsAndMarkdown(text);
}

async function summarizeChunked(extractedText: string) {
  const chunks = chunkText(extractedText);
  const chunkTasks = chunks.map(
    (chunk, i) => () =>
      generateText({
        model: model(),
        maxOutputTokens: 2500,
        system: CHUNK_SYSTEM_PROMPT,
        prompt: `This is section ${i + 1} of ${chunks.length} from a larger document. Produce detailed study notes for this section:\n\n${chunk}`,
      }).then((r) => r.text)
  );
  const chunkSummaries = await runWithConcurrency(chunkTasks, MAX_CONCURRENCY);
  const mergedInput = chunkSummaries
    .map((s, i) => `--- Section ${i + 1} of ${chunkSummaries.length} ---\n${s}`)
    .join("\n\n");
  const { text } = await generateText({
    model: model(),
    maxOutputTokens: 8000,
    system: MERGE_SYSTEM_PROMPT,
    prompt: `Merge the following section summaries into one cohesive, comprehensive set of study notes. Deduplicate overlapping content but preserve all unique details:\n\n${mergedInput}`,
  });
  return extractTopicsAndMarkdown(text);
}

/** Runs in background via after(); continues even if the client disconnects. */
export async function runSummarizationInBackground(
  contentId: string
): Promise<void> {
  try {
    const content = await db.content.findUnique({
      where: { id: contentId },
      select: { id: true, extractedText: true },
    });
    if (!content?.extractedText) return;

    const useChunked = content.extractedText.length > CHUNK_SIZE * 1.5;
    const { markdown, keyTopics } = useChunked
      ? await summarizeChunked(content.extractedText)
      : await summarizeSingle(content.extractedText);

    const stillExists = await db.content.findUnique({
      where: { id: contentId },
      select: { id: true },
    });
    if (!stillExists) return;

    const existing = await db.summary.findUnique({
      where: { contentId },
      select: { id: true },
    });
    if (existing) {
      await db.summary.update({
        where: { contentId },
        data: { markdown, keyTopics },
      });
    } else {
      await db.summary.create({
        data: { contentId, markdown, keyTopics },
      });
    }
    await db.content.update({
      where: { id: contentId },
      data: { status: "COMPLETED" },
    });
  } catch (err) {
    console.error("[SUMMARIZE_BACKGROUND]", err);
    try {
      const existing = await db.summary.findUnique({
        where: { contentId },
        select: { id: true },
      });
      if (existing) {
        await db.summary.update({
          where: { contentId },
          data: { markdown: SUMMARY_FAILED_MARKDOWN, keyTopics: [] },
        });
      }
    } catch (updateErr) {
      console.error("[SUMMARIZE_BACKGROUND_UPDATE]", updateErr);
    }
  }
}

export async function createPlaceholderSummary(contentId: string): Promise<void> {
  await db.summary.create({
    data: {
      contentId,
      markdown: SUMMARY_PLACEHOLDER_MARKDOWN,
      keyTopics: [],
    },
  });
}

/** Schedules background summarization (call after createPlaceholderSummary). */
export function scheduleSummaryGeneration(contentId: string): void {
  after(() => runSummarizationInBackground(contentId));
}
