import { generateJsonWithClaude, parseClaudeJson } from "./claude";

type SharedDocumentCandidate = {
  id: string;
  name: string;
  type?: string | null;
  projectTitle?: string | null;
  textPreview?: string | null;
};

type SharedDocumentRequestPayload = {
  id: string;
  title: string;
  theme?: string | null;
  keywords?: string[];
  description?: string | null;
  ownerName?: string | null;
};

type SharedDocumentMatcherPayload = {
  requests: SharedDocumentRequestPayload[];
  documents: SharedDocumentCandidate[];
};

type SharedDocumentMatchResponse = {
  matches?: Array<{
    requestId?: string;
    suggestedDocuments?: Array<{
      documentId?: string;
      reason?: string;
      confidence?: "high" | "medium" | "low";
    }>;
  }>;
};

export async function matchSharedDocumentsWithClaude(
  payload: SharedDocumentMatcherPayload,
  options?: { apiKey?: string; model?: string },
) {
  const prompt = [
    "You are helping a thesis student decide which of their documents could be useful to share with other students who posted requests.",
    "Match only the provided candidate documents against the provided requests.",
    "Be conservative: if a match is weak or unclear, do not suggest it.",
    "Use textPreview when available. If textPreview is empty, rely only on file name, type, and project title.",
    "Return valid JSON only with this exact shape:",
    '{"matches":[{"requestId":"...","suggestedDocuments":[{"documentId":"...","reason":"...","confidence":"high|medium|low"}]}]}',
    "Return at most 3 suggestedDocuments per request.",
    "",
    "Requests:",
    JSON.stringify(payload.requests, null, 2),
    "",
    "Candidate documents:",
    JSON.stringify(payload.documents, null, 2),
  ].join("\n");

  const raw = await generateJsonWithClaude(prompt, {
    apiKey: options?.apiKey,
    model: options?.model || "claude-sonnet-4-20250514",
    maxTokens: 1400,
  });

  const parsed = parseClaudeJson<SharedDocumentMatchResponse>(raw);
  const matches = Array.isArray(parsed.matches) ? parsed.matches : [];

  return {
    matches: matches.map((match) => ({
      requestId: match.requestId || "",
      suggestedDocuments: Array.isArray(match.suggestedDocuments)
        ? match.suggestedDocuments
            .filter((item) => item.documentId && item.reason)
            .map((item) => ({
              documentId: item.documentId as string,
              reason: item.reason as string,
              confidence: item.confidence === "high" || item.confidence === "low" ? item.confidence : "medium",
            }))
        : [],
    })),
  };
}
