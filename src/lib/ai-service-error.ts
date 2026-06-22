export type AIServiceErrorCode =
  | "MISSING_API_KEY"
  | "AUTH_FAILED"
  | "RATE_LIMITED"
  | "MODEL_UNAVAILABLE"
  | "SERVICE_UNAVAILABLE"
  | "REQUEST_TIMEOUT"
  | "NETWORK_ERROR"
  | "NO_RESPONSE";

export class AIServiceError extends Error {
  readonly code: AIServiceErrorCode;

  constructor(code: AIServiceErrorCode) {
    super(code);
    this.name = "AIServiceError";
    this.code = code;
  }
}

export function errorFromResponseStatus(status: number) {
  if (status === 401 || status === 403) return new AIServiceError("AUTH_FAILED");
  if (status === 404) return new AIServiceError("MODEL_UNAVAILABLE");
  if (status === 429) return new AIServiceError("RATE_LIMITED");
  if (status >= 500) return new AIServiceError("SERVICE_UNAVAILABLE");
  return new AIServiceError("SERVICE_UNAVAILABLE");
}

export function getAIErrorMessage(error: unknown) {
  if (!(error instanceof AIServiceError)) {
    return "The AI assistant hit an unexpected error and couldn't respond. Please try again.";
  }

  switch (error.code) {
    case "MISSING_API_KEY":
      return "The AI assistant isn't configured yet. Add a valid OpenRouter API key, then restart the app.";
    case "AUTH_FAILED":
      return "The AI assistant couldn't authenticate. Please check the OpenRouter API key, then restart the app.";
    case "RATE_LIMITED":
      return "The AI assistant has reached its request limit. Please wait a minute and try again.";
    case "MODEL_UNAVAILABLE":
      return "The AI model is currently unavailable. Please try again shortly.";
    case "SERVICE_UNAVAILABLE":
      return "The AI service is currently down or unavailable. Please try again shortly.";
    case "REQUEST_TIMEOUT":
      return "The AI service took too long to respond. Tap retry to try again.";
    case "NETWORK_ERROR":
      return "The AI service couldn't be reached. Check your connection and try again.";
    case "NO_RESPONSE":
      return "The AI service responded without an answer. Tap retry to try again.";
  }
}
