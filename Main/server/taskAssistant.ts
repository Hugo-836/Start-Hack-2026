type TaskAssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

type TaskAssistantPayload = {
  task: {
    title: string;
    description?: string | null;
    phaseKey: string;
    status: string;
    attachmentName?: string | null;
  };
  context: {
    student?: {
      first_name?: string;
      last_name?: string;
      degree?: string;
      skills?: string[] | null;
      about?: string | null;
    } | null;
    projects?: Array<{
      title?: string | null;
      description?: string | null;
      motivation?: string | null;
      state?: string | null;
    }>;
    feedbacks?: Array<{
      title?: string | null;
      reviewer_feedback?: string | null;
      ai_summary?: string | null;
      status?: string | null;
    }>;
    attachments?: string[];
    peers?: Array<{
      first_name?: string | null;
      last_name?: string | null;
    }>;
    mentors?: string[];
  };
  messages: TaskAssistantMessage[];
};

type AnthropicContentBlock = {
  type: string;
  text?: string;
};

type AnthropicMessagesResponse = {
  content?: AnthropicContentBlock[];
};

export async function generateTaskAssistantReply(
  payload: TaskAssistantPayload,
  options?: { apiKey?: string; model?: string },
) {
  const apiKey = options?.apiKey;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }

  const model = options?.model || "claude-sonnet-4-20250514";
  const system = [
    "You are a concise thesis progress assistant inside a student dashboard.",
    "Answer the user's question about the current task using only the provided site context.",
    "Use feedback, uploaded documents, project context, peers, and mentors when relevant.",
    "Give practical next steps, not generic motivational filler.",
    "Keep the answer short: 3 to 6 sentences.",
    "Do not invent facts that are not in the provided context.",
  ].join(" ");

  const userContent = [
    "Task context:",
    JSON.stringify(payload.task, null, 2),
    "Site context:",
    JSON.stringify(payload.context, null, 2),
    "Conversation:",
    JSON.stringify(payload.messages, null, 2),
  ].join("\n\n");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 500,
      system,
      messages: [
        {
          role: "user",
          content: userContent,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic task assistant failed with status ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as AnthropicMessagesResponse;
  const text = data.content
    ?.filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text?.trim() || "")
    .filter(Boolean)
    .join("\n\n");

  if (!text) {
    throw new Error("Anthropic task assistant returned no text.");
  }

  return { reply: text };
}
