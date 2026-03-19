import { generateJsonWithClaude, parseClaudeJson } from "./claude";

type DiscoveryDocument = {
  id: string;
  name: string;
  type?: string | null;
  ownerName?: string | null;
  ownerType?: "self" | "peer";
  projectTitle?: string | null;
  textPreview?: string | null;
};

type DiscoveryRequest = {
  id: string;
  title: string;
  theme?: string | null;
  keywords?: string[];
  description?: string | null;
  ownerName?: string | null;
};

type DiscoveryPayload = {
  query: string;
  ownDocuments: DiscoveryDocument[];
  peerDocuments: DiscoveryDocument[];
  requests: DiscoveryRequest[];
};

type DiscoveryResponse = {
  answer?: string;
  ownMatches?: Array<{
    documentId?: string;
    reason?: string;
  }>;
  peerMatches?: Array<{
    documentId?: string;
    reason?: string;
  }>;
  requestMatches?: Array<{
    requestId?: string;
    reason?: string;
  }>;
  webLeads?: Array<{
    label?: string;
    query?: string;
    source?: string;
  }>;
};

export async function discoverDocumentsWithClaude(
  payload: DiscoveryPayload,
  options?: { apiKey?: string; model?: string },
) {
  const prompt = [
    "You are Claude acting as a document discovery copilot inside Studyond.",
    "Help a thesis student find relevant material across three sources: their own documents, peer documents, and public web leads.",
    "Use only the provided query and provided context. Do not invent documents or requests.",
    "Web leads are suggestions only. They should be good search directions or likely source families, not claims that you actually searched the web.",
    "Be concise and practical.",
    "Return valid JSON only with this exact shape:",
    '{"answer":"...","ownMatches":[{"documentId":"...","reason":"..."}],"peerMatches":[{"documentId":"...","reason":"..."}],"requestMatches":[{"requestId":"...","reason":"..."}],"webLeads":[{"label":"...","query":"...","source":"..."}]}',
    "Return at most 3 ownMatches, 3 peerMatches, 3 requestMatches, and 4 webLeads.",
    "",
    "Student query:",
    payload.query,
    "",
    "Own documents:",
    JSON.stringify(payload.ownDocuments, null, 2),
    "",
    "Peer documents:",
    JSON.stringify(payload.peerDocuments, null, 2),
    "",
    "Open document requests:",
    JSON.stringify(payload.requests, null, 2),
  ].join("\n");

  const raw = await generateJsonWithClaude(prompt, {
    apiKey: options?.apiKey,
    model: options?.model || "claude-sonnet-4-20250514",
    maxTokens: 1600,
  });

  const parsed = parseClaudeJson<DiscoveryResponse>(raw);

  return {
    answer: typeof parsed.answer === "string" ? parsed.answer.trim() : "",
    ownMatches: Array.isArray(parsed.ownMatches)
      ? parsed.ownMatches.filter((item) => item.documentId && item.reason).map((item) => ({
          documentId: item.documentId as string,
          reason: item.reason as string,
        }))
      : [],
    peerMatches: Array.isArray(parsed.peerMatches)
      ? parsed.peerMatches.filter((item) => item.documentId && item.reason).map((item) => ({
          documentId: item.documentId as string,
          reason: item.reason as string,
        }))
      : [],
    requestMatches: Array.isArray(parsed.requestMatches)
      ? parsed.requestMatches.filter((item) => item.requestId && item.reason).map((item) => ({
          requestId: item.requestId as string,
          reason: item.reason as string,
        }))
      : [],
    webLeads: Array.isArray(parsed.webLeads)
      ? parsed.webLeads
          .filter((item) => item.label && item.query)
          .map((item) => ({
            label: item.label as string,
            query: item.query as string,
            source: typeof item.source === "string" ? item.source : "Web",
          }))
      : [],
  };
}
