type TaskAssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

type TaskAssistantPayload = {
  intent?: "chat" | "tips";
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

function extractTextFromAnthropicResponse(data: AnthropicMessagesResponse) {
  return data.content
    ?.filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text?.trim() || "")
    .filter(Boolean)
    .join("\n\n");
}

export async function generateTaskAssistantReply(
  payload: TaskAssistantPayload,
  options?: { apiKey?: string; model?: string },
) {
  const apiKey = options?.apiKey;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }

  const model = options?.model || "claude-sonnet-4-20250514";
  const intent = payload.intent || "chat";
  const system =
    intent === "tips"
      ? [
          "You are Claude acting as Studyond's thesis progress copilot inside the student dashboard.",
          "Generate concrete AI tips for the current task using only the provided site context.",
          "Ground your advice in the student's current project, reviewer feedback, uploaded documents, mentors, peers, and profile when relevant.",
          "Be practical and action-oriented. Avoid generic encouragement and avoid inventing facts.",
          "Return valid JSON only with this exact shape: {\"tips\":[\"tip 1\",\"tip 2\",\"tip 3\"]}.",
          "Return exactly 3 short tips, each as one sentence.",
        ].join(" ")
      : [
          "You are Claude acting as Studyond's thesis progress copilot inside the student dashboard.",
          "Answer the student's question about the current task using only the provided site context.",
          "Ground your response in the current project, reviewer feedback, uploaded documents, mentors, peers, and profile when relevant.",
          "Act like a sharp but supportive thesis coach.",
          "Lead with the most useful recommendation for moving the task forward right now.",
          "Give practical next steps, not generic motivational filler.",
          "Keep the answer short: 3 to 6 sentences.",
          "If the user asks how to proceed, prioritize the smallest useful next action for this thesis task.",
          "When useful, point out what to produce next, what to check in the existing material, and what question to ask a supervisor or mentor.",
          "Be direct, specific, and academically grounded.",
          "Do not invent facts that are not in the provided context.",
          "Match the user's language when possible.",
        ].join(" ");

  const userContent = [
    `Intent: ${intent}`,
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
  const text = extractTextFromAnthropicResponse(data);

  if (!text) {
    throw new Error("Anthropic task assistant returned no text.");
  }

  if (intent === "tips") {
    const candidate = text.match(/```json\s*([\s\S]*?)```/i)?.[1] || text;
    const parsed = JSON.parse(candidate) as { tips?: unknown };
    const tips = Array.isArray(parsed.tips)
      ? parsed.tips.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
      : [];

    if (tips.length === 0) {
      throw new Error("Anthropic task assistant returned no tips.");
    }

    return { tips: tips.slice(0, 3) };
  }

  return { reply: text };
}
