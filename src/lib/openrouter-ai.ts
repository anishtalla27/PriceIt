import {
  AIServiceError,
  errorFromResponse,
} from "@/lib/ai-service-error";

export const OPENROUTER_MODEL =
  import.meta.env.VITE_OPENROUTER_MODEL ?? "google/gemini-3.1-flash-lite";

const AI_ROUTE = "/api/ai";

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant" | "tool";
  content?: string;
  tool_calls?: unknown[];
  tool_call_id?: string;
  name?: string;
}

export interface OpenRouterRequest {
  messages: OpenRouterMessage[];
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
  tools?: readonly unknown[];
  toolChoice?: "auto" | "none";
  signal?: AbortSignal;
}

export interface OpenRouterAssistantMessage {
  content?: string;
  tool_calls?: unknown[];
  function_call?: { name?: string; arguments?: unknown };
}

export async function askOpenRouter(request: OpenRouterRequest) {
  const timeoutController = request.signal ? null : new AbortController();
  const timeoutId = timeoutController
    ? window.setTimeout(() => timeoutController.abort(), 20_000)
    : null;

  let response: Response;
  try {
    response = await fetch(AI_ROUTE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: request.messages,
        model: OPENROUTER_MODEL,
        max_tokens: request.maxTokens,
        ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
        ...(request.jsonMode ? { response_format: { type: "json_object" } } : {}),
        ...(request.tools ? { tools: request.tools } : {}),
        ...(request.toolChoice ? { tool_choice: request.toolChoice } : {}),
      }),
      signal: request.signal ?? timeoutController?.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AIServiceError("REQUEST_TIMEOUT");
    }
    throw new AIServiceError("NETWORK_ERROR");
  } finally {
    if (timeoutId !== null) window.clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let body: unknown;
    try { body = await response.json(); } catch { /* ignore */ }
    throw errorFromResponse(response.status, body);
  }

  let data: { message?: OpenRouterAssistantMessage };
  try {
    data = (await response.json()) as typeof data;
  } catch {
    throw new AIServiceError("NO_RESPONSE");
  }
  const message = data.message;
  if (!message) throw new AIServiceError("NO_RESPONSE");
  return message;
}

export async function askOpenRouterText(request: OpenRouterRequest) {
  const message = await askOpenRouter(request);
  if (typeof message.content !== "string" || !message.content.trim()) {
    throw new AIServiceError("NO_RESPONSE");
  }
  return message.content.trim();
}
