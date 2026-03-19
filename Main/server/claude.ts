type ClaudeTextBlock = {
  type: "text";
  text: string;
};

type ClaudeResponse = {
  content?: ClaudeTextBlock[];
  type?: string;
  error?: {
    type?: string;
    message?: string;
  };
};

function extractJsonCandidate(rawText: string) {
  const fenced = rawText.match(/```json\s*([\s\S]*?)```/i)?.[1];
  return fenced || rawText;
}

export function parseClaudeJson<T>(rawText: string): T {
  const candidate = extractJsonCandidate(rawText).trim();
  if (!candidate) {
    throw new Error("Claude returned an empty response.");
  }

  return JSON.parse(candidate) as T;
}

export async function generateJsonWithClaude(
  prompt: string,
  options?: {
    apiKey?: string;
    model?: string;
    maxTokens?: number;
    timeoutMs?: number;
  },
) {
  const apiKey = options?.apiKey;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY in Main/.env");
  }

  const controller = new AbortController();
  const timeoutMs = options?.timeoutMs ?? 12000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: options?.model || "claude-3-5-sonnet-latest",
        max_tokens: options?.maxTokens || 900,
        system:
          "You are a precise academic thesis assistant. Always return valid JSON only, with no prose outside the JSON object.",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Claude request timed out after ${timeoutMs}ms.`);
    }
    throw error;
  }

  clearTimeout(timeoutId);

  const payload = (await response.json().catch(() => null)) as ClaudeResponse | null;

  if (!response.ok) {
    const errorType =
      payload?.error?.type || payload?.type || "unknown_error_type";
    const errorMessage =
      payload?.error?.message || "Claude returned an unknown error.";
    const rawPayload = payload ? JSON.stringify(payload) : "null";

    throw new Error(
      `Claude HTTP ${response.status} [${errorType}]: ${errorMessage}. Raw payload: ${rawPayload}`,
    );
  }

  const rawText =
    payload?.content
      ?.filter((block): block is ClaudeTextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim() || "";

  if (!rawText) {
    throw new Error("Claude returned no text content.");
  }

  return rawText;
}
