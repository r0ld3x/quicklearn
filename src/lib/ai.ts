import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export const deepseek = createOpenAICompatible({
  name: "deepseek",
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

export function model() {
  return deepseek("deepseek-chat");
}
