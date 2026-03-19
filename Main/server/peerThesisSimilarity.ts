import { generateJsonWithClaude, parseClaudeJson } from "./claude";

export type ThesisInput = {
  title: string;
  description?: string | null;
  motivation?: string | null;
};

export type CandidateInput = {
  studentId: string;
  studentName: string;
  degree: string;
  universityId?: string | null;
  thesis: ThesisInput;
};

export type PeerThesisSimilarityRequest = {
  currentStudent: {
    id: string;
    name: string;
    degree: string;
    universityId?: string | null;
    skills?: string[];
    objectives?: string[];
    fieldIds?: string[];
    about?: string | null;
  };
  currentThesis: ThesisInput;
  candidates: CandidateInput[];
};

export type ThesisSimilarityMatch = {
  studentId: string;
  score: number;
  reason: string;
};

function buildPrompt(body: PeerThesisSimilarityRequest) {
  return JSON.stringify({
    currentStudent: body.currentStudent,
    currentThesis: body.currentThesis,
    candidates: body.candidates,
    instructions: {
      task: "Score thesis similarity for peer matching.",
      outputRequirements: [
        "Return exactly one match for every candidate studentId in the candidates array.",
        "Do not omit any candidate.",
        "Use a score from 0 to 100.",
        "Keep reasons short and concrete.",
        "Return valid JSON only.",
      ],
    },
  });
}

function buildSingleCandidatePrompt(
  body: PeerThesisSimilarityRequest,
  candidate: CandidateInput,
) {
  return JSON.stringify({
    currentStudent: body.currentStudent,
    currentThesis: body.currentThesis,
    candidate,
    instructions: {
      task: "Score thesis similarity for peer matching.",
      outputRequirements: [
        `Return exactly one match for studentId ${candidate.studentId}.`,
        "Use a score from 0 to 100.",
        "Keep the reason short and concrete.",
        "Return valid JSON only.",
      ],
    },
  });
}

function parseMatches(rawText: string): ThesisSimilarityMatch[] {
  if (!rawText.trim()) return [];
  try {
    const parsed = parseClaudeJson<{ matches?: ThesisSimilarityMatch[] }>(rawText);
    return Array.isArray(parsed?.matches) ? parsed.matches : [];
  } catch {
    return [];
  }
}

function normalizeMatches(
  matches: ThesisSimilarityMatch[],
  candidates: CandidateInput[],
): ThesisSimilarityMatch[] {
  const validStudentIds = new Set(candidates.map((candidate) => candidate.studentId));
  const byStudentId = new Map<string, ThesisSimilarityMatch>();

  for (const match of matches) {
    if (!match || typeof match.studentId !== "string") continue;
    if (!validStudentIds.has(match.studentId)) continue;

    byStudentId.set(match.studentId, {
      studentId: match.studentId,
      score: Math.max(0, Math.min(100, Math.round(Number(match.score) || 0))),
      reason:
        typeof match.reason === "string" && match.reason.trim()
          ? match.reason.trim()
          : "No explanation returned.",
    });
  }

  return candidates
    .filter((candidate) => byStudentId.has(candidate.studentId))
    .map((candidate) => byStudentId.get(candidate.studentId) as ThesisSimilarityMatch);
}

async function requestMatchesFromClaude(
  body: PeerThesisSimilarityRequest,
  model: string,
  apiKey: string,
): Promise<ThesisSimilarityMatch[]> {
  try {
    const rawText = await generateJsonWithClaude(
      "You score thesis similarity for academic peer matching.\n" +
        "Compare the current student's thesis against each candidate thesis.\n" +
        "Return exactly one result for every candidate studentId. Never omit a candidate.\n" +
        "Use a score from 0 to 100 where 100 means extremely strong thesis overlap.\n" +
        "Use thesis title, description, motivation, academic context, and the current student's profile as support.\n" +
        "Be strict: only give 80+ for genuinely close thesis overlap.\n" +
        "Keep reasons short and concrete.\n" +
        "Return valid JSON only with the shape {\"matches\":[{\"studentId\":\"...\",\"score\":0,\"reason\":\"...\"}]}.\n\n" +
        buildPrompt(body),
      {
        apiKey,
        model,
        maxTokens: 1600,
      },
    );

    return normalizeMatches(parseMatches(rawText), body.candidates);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown fetch error";
    throw new Error(`Claude request failed: ${message}`);
  }
}

async function requestSingleMatchFromClaude(
  body: PeerThesisSimilarityRequest,
  candidate: CandidateInput,
  model: string,
  apiKey: string,
): Promise<ThesisSimilarityMatch | null> {
  try {
    const rawText = await generateJsonWithClaude(
      "You score thesis similarity for academic peer matching.\n" +
        "Compare the current student's thesis against exactly one candidate thesis.\n" +
        `Return exactly one result for studentId ${candidate.studentId}.\n` +
        "Use a score from 0 to 100 where 100 means extremely strong thesis overlap.\n" +
        "Use thesis title, description, motivation, academic context, and the current student's profile as support.\n" +
        "Be strict: only give 80+ for genuinely close thesis overlap.\n" +
        "Keep reasons short and concrete.\n" +
        "Return valid JSON only with the shape " +
        `{"matches":[{"studentId":"${candidate.studentId}","score":0,"reason":"..."}]}.\n\n` +
        buildSingleCandidatePrompt(body, candidate),
      {
        apiKey,
        model,
        maxTokens: 500,
      },
    );

    const matches = normalizeMatches(parseMatches(rawText), [candidate]);
    return matches[0] || null;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown fetch error";
    throw new Error(`Claude request failed: ${message}`);
  }
}

export async function scorePeerThesisSimilarity(
  body: PeerThesisSimilarityRequest,
  options?: {
    anthropicApiKey?: string;
    claudeModel?: string;
  },
): Promise<ThesisSimilarityMatch[]> {
  const claudeModel = options?.claudeModel || "claude-3-5-sonnet-latest";
  const anthropicApiKey = options?.anthropicApiKey;

  if (!anthropicApiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY in Main/.env");
  }

  let matches = await requestMatchesFromClaude(body, claudeModel, anthropicApiKey);

  if (matches.length < body.candidates.length) {
    const completeMatches: ThesisSimilarityMatch[] = [];

    for (const candidate of body.candidates) {
      const singleMatch = await requestSingleMatchFromClaude(
        body,
        candidate,
        claudeModel,
        anthropicApiKey,
      );
      if (singleMatch) {
        completeMatches.push(singleMatch);
      }
    }

    if (completeMatches.length > 0) {
      matches = completeMatches;
    }
  }

  return matches;
}
