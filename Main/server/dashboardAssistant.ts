type DashboardAssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

type DashboardAssistantPayload = {
  context: {
    student?: {
      first_name?: string;
      last_name?: string;
      degree?: string;
      about?: string | null;
    } | null;
    activeProject?: {
      title?: string | null;
      description?: string | null;
      state?: string | null;
    } | null;
    nextMilestone?: {
      title?: string | null;
      description?: string | null;
      phaseLabel?: string | null;
      status?: string | null;
    } | null;
    sharedDocuments?: {
      mine: number;
      peers: number;
      requests: number;
    };
  };
  messages: DashboardAssistantMessage[];
};

type AnthropicContentBlock = {
  type: string;
  text?: string;
};

type AnthropicMessagesResponse = {
  content?: AnthropicContentBlock[];
};

function extractTextFromAnthropicResponse(data: AnthropicMessagesResponse) {
  return data.content
    ?.filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text?.trim() || "")
    .filter(Boolean)
    .join("\n\n");
}

export async function generateDashboardAssistantReply(
  payload: DashboardAssistantPayload,
  options?: { apiKey?: string; model?: string },
) {
  const apiKey = options?.apiKey;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: options?.model || "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: [
        "You are Claude acting as a concise thesis dashboard assistant inside Studyond.",
        "Answer general student questions using only the provided dashboard context and conversation.",
        "Be practical, clear, and short.",
        "Prefer concrete next steps when useful.",
        "Do not invent facts that are not in the provided context.",
        "Keep the answer to 3 to 6 sentences.",
      ].join(" "),
      messages: [
        {
          role: "user",
          content: [
            "Dashboard context:",
            JSON.stringify(payload.context, null, 2),
            "",
            "Conversation:",
            JSON.stringify(payload.messages, null, 2),
          ].join("\n"),
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic dashboard assistant failed with status ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as AnthropicMessagesResponse;
  const text = extractTextFromAnthropicResponse(data);

  if (!text) {
    throw new Error("Anthropic dashboard assistant returned no text.");
  }

  return { reply: text };
}
