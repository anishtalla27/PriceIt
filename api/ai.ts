import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "32kb",
    },
  },
};

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-3.1-flash-lite";
const MAX_TOKENS_CAP = 2000;
const DEFAULT_MAX_TOKENS = 600;
const TIMEOUT_MS = 20_000;

interface Message {
  role: string;
  content?: unknown;
  tool_calls?: unknown[];
  tool_call_id?: string;
  name?: string;
}

function sendError(res: VercelResponse, status: number, code: string) {
  res.status(status).json({ error: { code } });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return sendError(res, 405, "METHOD_NOT_ALLOWED");
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return sendError(res, 500, "MISSING_API_KEY");
  }

  const body = req.body as Record<string, unknown>;

  if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
    return sendError(res, 400, "INVALID_REQUEST");
  }

  const messages = body.messages as Message[];
  const model = typeof body.model === "string" && body.model.trim() ? body.model.trim() : DEFAULT_MODEL;
  const temperature = typeof body.temperature === "number" ? body.temperature : undefined;
  const maxTokens = typeof body.max_tokens === "number"
    ? Math.min(body.max_tokens, MAX_TOKENS_CAP)
    : DEFAULT_MAX_TOKENS;
  const tools = Array.isArray(body.tools) ? body.tools : undefined;
  const toolChoice = body.tool_choice != null ? body.tool_choice : undefined;
  const responseFormat = body.response_format != null ? body.response_format : undefined;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        ...(temperature !== undefined ? { temperature } : {}),
        ...(responseFormat ? { response_format: responseFormat } : {}),
        messages,
        ...(tools ? { tools } : {}),
        ...(toolChoice !== undefined ? { tool_choice: toolChoice } : {}),
      }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      return sendError(res, 504, "REQUEST_TIMEOUT");
    }
    return sendError(res, 502, "NETWORK_ERROR");
  }
  clearTimeout(timeoutId);

  if (!upstreamRes.ok) {
    const code = upstreamErrorCode(upstreamRes.status);
    return sendError(res, upstreamRes.status >= 500 ? 502 : upstreamRes.status, code);
  }

  let data: { choices?: Array<{ message?: unknown }> };
  try {
    data = (await upstreamRes.json()) as typeof data;
  } catch {
    return sendError(res, 502, "NO_RESPONSE");
  }

  const message = data.choices?.[0]?.message;
  if (!message) return sendError(res, 502, "NO_RESPONSE");

  return res.status(200).json({ message });
}

function upstreamErrorCode(status: number): string {
  if (status === 401 || status === 403) return "AUTH_FAILED";
  if (status === 404) return "MODEL_UNAVAILABLE";
  if (status === 429) return "RATE_LIMITED";
  return "SERVICE_UNAVAILABLE";
}
