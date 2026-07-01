import { askOpenRouterText } from "@/lib/openrouter-ai";

export type AIProvider = "openrouter" | "template";
export const AI_PROVIDER: AIProvider =
  import.meta.env.VITE_AI_PROVIDER === "template" ? "template" : "openrouter";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIProgress {
  progress: number;
  text: string;
}

export interface GenerateAIOptions {
  messages: AIMessage[];
  template: () => string;
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
  onProgress?: (progress: AIProgress) => void;
  signal?: AbortSignal;
}

export interface GenerateAIResult {
  text: string;
  provider: AIProvider;
}

export async function generateAI(options: GenerateAIOptions): Promise<GenerateAIResult> {
  if (AI_PROVIDER === "template") {
    return { text: options.template(), provider: "template" };
  }

  const text = await askOpenRouterText({
    messages: options.messages,
    maxTokens: options.maxTokens,
    temperature: options.temperature,
    jsonMode: options.jsonMode,
    signal: options.signal,
  });
  return { text, provider: "openrouter" };
}
