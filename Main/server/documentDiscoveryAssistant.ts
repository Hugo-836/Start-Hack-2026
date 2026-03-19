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
    url?: string;
    source?: string;
  }>;
};

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    return parsed.toString();
  } catch {
    return null;
  }
}

export async function discoverDocumentsWithClaude(
  payload: DiscoveryPayload,
  options?: { apiKey?: string; model?: string },
) {
  const prompt = [
    "You are Claude acting as a document discovery copilot inside Studyond.",
    "Help a thesis student find relevant material on the public internet only.",
    "Do not recommend the student's own documents, peer documents, or internal requests in the result.",
    "Use only the provided query and provided context to infer relevant public sites or pages.",
    "Web leads must be direct public URLs, not search queries.",
    "Be concise and practical.",
    "Return valid JSON only with this exact shape:",
    '{"answer":"...","ownMatches":[{"documentId":"...","reason":"..."}],"peerMatches":[{"documentId":"...","reason":"..."}],"requestMatches":[{"requestId":"...","reason":"..."}],"webLeads":[{"label":"...","url":"...","source":"..."}]}',
    'Always return empty arrays for "ownMatches", "peerMatches", and "requestMatches".',
    "Return at most 4 webLeads.",
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
          .map((item) => ({
            label: item.label,
            url: typeof item.url === "string" ? normalizeUrl(item.url) : null,
            source: typeof item.source === "string" ? item.source : "Web",
          }))
          .filter((item) => item.label && item.url)
          .map((item) => ({
            label: item.label as string,
            url: item.url as string,
            source: item.source,
          }))
      : [],
  };
}
