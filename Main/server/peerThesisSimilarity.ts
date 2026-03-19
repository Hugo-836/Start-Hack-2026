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

type OllamaGenerateResponse = {
  response?: string;
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

  const candidates = [rawText, rawText.match(/```json\s*([\s\S]*?)```/i)?.[1] || ""];

  for (const candidate of candidates) {
    if (!candidate.trim()) continue;
    try {
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed?.matches)) {
        return parsed.matches;
      }
    } catch {
      continue;
    }
  }

  return [];
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

async function requestMatchesFromOllama(
  body: PeerThesisSimilarityRequest,
  model: string,
): Promise<ThesisSimilarityMatch[]> {
  let response: Response;
  try {
    response = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        stream: false,
        format: "json",
        prompt:
          "You score thesis similarity for academic peer matching.\n" +
          "Compare the current student's thesis against each candidate thesis.\n" +
          "Return exactly one result for every candidate studentId. Never omit a candidate.\n" +
          "Use a score from 0 to 100 where 100 means extremely strong thesis overlap.\n" +
          "Use thesis title, description, motivation, academic context, and the current student's profile as support.\n" +
          "Be strict: only give 80+ for genuinely close thesis overlap.\n" +
          "Keep reasons short and concrete.\n" +
          "Return valid JSON only with the shape {\"matches\":[{\"studentId\":\"...\",\"score\":0,\"reason\":\"...\"}]}.\n\n" +
          buildPrompt(body),
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown fetch error";
    throw new Error(`Ollama connection failed: ${message}`);
  }

  if (!response.ok) {
    throw new Error(`Ollama request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as OllamaGenerateResponse;
  return normalizeMatches(parseMatches(payload.response || ""), body.candidates);
}

async function requestSingleMatchFromOllama(
  body: PeerThesisSimilarityRequest,
  candidate: CandidateInput,
  model: string,
): Promise<ThesisSimilarityMatch | null> {
  let response: Response;
  try {
    response = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        stream: false,
        format: "json",
        prompt:
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
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown fetch error";
    throw new Error(`Ollama connection failed: ${message}`);
  }

  if (!response.ok) {
    throw new Error(`Ollama request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as OllamaGenerateResponse;
  const matches = normalizeMatches(parseMatches(payload.response || ""), [candidate]);
  return matches[0] || null;
}

export async function scorePeerThesisSimilarity(
  body: PeerThesisSimilarityRequest,
  options?: {
    ollamaModel?: string;
  },
): Promise<ThesisSimilarityMatch[]> {
  const ollamaModel = options?.ollamaModel || "qwen2.5:7b";

  let matches = await requestMatchesFromOllama(body, ollamaModel);

  if (matches.length < body.candidates.length) {
    const completeMatches: ThesisSimilarityMatch[] = [];

    for (const candidate of body.candidates) {
      const singleMatch = await requestSingleMatchFromOllama(body, candidate, ollamaModel);
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
