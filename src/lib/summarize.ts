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

const CHUNK_SYSTEM_PROMPT = `You are an educational content summarizer that writes concise, dense study notes.

Rules:
- Use ## headings, ### for subtopics, **bold** for key terms
- Bullet points for clarity — keep each point to 1-2 sentences max
- Cover every topic but be brief: facts, numbers, formulas, key examples only
- No filler sentences, no restating the same idea in different words
- Do NOT add a title, overview, or key takeaways — those come later in the merge step
- Output ONLY the section notes in clean markdown`;

const MERGE_SYSTEM_PROMPT = `You are an elite educational content summarizer. Merge the section summaries into ONE concise, well-structured set of study notes. Be BRIEF — no fluff, no verbose definitions, no repeating ideas.

Your output MUST follow this exact structure:

# [Title — clear, descriptive title]

> 1-2 sentence overview capturing the essence of the content.

## 📋 Overview
2-3 sentences: what this covers and why it matters.

## [Section Title for major topic 1]
Cover each major topic concisely:
- **Bold** key terms, define them in one short sentence
- Use ### for subtopics
- Bullet points — 1-2 sentences each, no padding
- Include specific numbers, formulas, and key examples
- Keep each section focused: cover the point and move on

(Continue for ALL topics — cover everything, but keep it tight)

## 📊 Comparison Table
If applicable, a markdown table comparing key concepts.

| Concept | Description | Key Feature |
|---------|-------------|-------------|
| ... | ... | ... |

## 💡 Key Takeaways
- 5-8 most critical points, one sentence each
- **Bold** the key concept in each

## 🔗 Important Definitions
- **Term**: One-sentence definition (5-8 terms max)

CRITICAL RULES:
- Keep total output between 600-1000 words. Be dense, not long.
- Merge and deduplicate overlapping content
- Cover EVERY topic but never pad with filler or restate the same idea
- One short definition per term — no multi-sentence explanations
- Use emojis sparingly in headings only
- Include specific details, numbers, formulas, and examples

After the full summary, extract the key topics as a JSON array between |||TOPICS||| markers.
Example: |||TOPICS|||["Machine Learning", "Neural Networks", "Deep Learning"]|||TOPICS|||`;

const SINGLE_SYSTEM_PROMPT = `You are an elite educational content summarizer. You produce concise, well-structured markdown study notes that cover everything without being verbose.

Your output MUST follow this exact structure:

# [Title — clear, descriptive title]

> 1-2 sentence overview capturing the essence of the content.

## 📋 Overview
2-3 sentences: what this covers and why it matters.

## [Section Title for major topic 1]
Cover each major topic concisely:
- **Bold** key terms, define them in one short sentence
- Use ### for subtopics
- Bullet points — 1-2 sentences each, no padding
- Include specific numbers, formulas, and key examples
- Keep each section focused: cover the point and move on

(Continue for ALL topics — cover everything, but keep it tight)

## 📊 Comparison Table
If applicable, a markdown table comparing key concepts.

| Concept | Description | Key Feature |
|---------|-------------|-------------|
| ... | ... | ... |

## 💡 Key Takeaways
- 5-8 most critical points, one sentence each
- **Bold** the key concept in each

## 🔗 Important Definitions
- **Term**: One-sentence definition (5-8 terms max)

CRITICAL RULES:
- Keep total output between 600-1000 words. Be dense, not long.
- Cover EVERY topic in the source material — do not skip anything
- Never pad with filler or restate the same idea in different words
- One short definition per term — no multi-sentence explanations
- Use emojis sparingly in headings only
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
    maxOutputTokens: 4000,
    system: SINGLE_SYSTEM_PROMPT,
    prompt: `Create concise study notes from the following content. Cover every topic but keep it short — no lengthy explanations:\n\n${extractedText}`,
  });
  return extractTopicsAndMarkdown(text);
}

async function summarizeChunked(extractedText: string) {
  const chunks = chunkText(extractedText);
  const chunkTasks = chunks.map(
    (chunk, i) => () =>
      generateText({
        model: model(),
        maxOutputTokens: 1500,
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
    maxOutputTokens: 4000,
    system: MERGE_SYSTEM_PROMPT,
    prompt: `Merge the following section summaries into one concise set of study notes. Deduplicate overlapping content, keep it short but complete:\n\n${mergedInput}`,
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
