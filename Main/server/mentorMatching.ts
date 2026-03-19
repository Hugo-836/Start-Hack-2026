import { generateJsonWithClaude, parseClaudeJson } from "./claude";

type StudentProfile = {
  id: string;
  first_name: string;
  last_name: string;
  degree: string;
  university_id?: string | null;
  skills?: string[] | null;
  objectives?: string[] | null;
  field_ids?: string[] | null;
  about?: string | null;
};

type ThesisProject = {
  title: string;
  description?: string | null;
  motivation?: string | null;
};

type MentorProfile = {
  id: string;
  full_name: string;
  email: string;
  institution: string | null;
  expertise: string[];
  bio: string | null;
  max_students: number;
};

type MentorMatchingRequest = {
  currentStudent: StudentProfile;
  currentProject: ThesisProject;
  mentors: MentorProfile[];
};

export type MentorMatch = {
  mentorId: string;
  score: number;
  reason: string;
};

function parseMatch(rawText: string): MentorMatch | null {
  try {
    const parsed = parseClaudeJson<MentorMatch>(rawText);
    if (parsed && typeof parsed.mentorId === "string") {
      return {
        mentorId: parsed.mentorId,
        score: Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0))),
        reason:
          typeof parsed.reason === "string" && parsed.reason.trim()
            ? parsed.reason.trim()
            : "No explanation returned.",
      };
    }
  } catch {
    return null;
  }

  return null;
}

async function scoreOneMentor(
  currentStudent: StudentProfile,
  currentProject: ThesisProject,
  mentor: MentorProfile,
  model: string,
  apiKey: string,
) {
  const prompt = JSON.stringify({
    instructions: [
      "Score how relevant this mentor is for the student's thesis.",
      "Use the thesis title, description, motivation, student profile, mentor expertise, mentor bio, and institution.",
      "Return valid JSON only with keys mentorId, score, reason.",
      `Return exactly one result for mentorId ${mentor.id}.`,
      "Use a score from 0 to 100.",
      "Keep the reason short and concrete.",
    ],
    currentStudent,
    currentProject,
    mentor,
  });

  const raw = await generateJsonWithClaude(prompt, {
    apiKey,
    model,
    maxTokens: 400,
  });
  return parseMatch(raw);
}

export async function scoreMentorMatches(
  payload: MentorMatchingRequest,
  options?: { anthropicApiKey?: string; claudeModel?: string },
) {
  const model = options?.claudeModel || "claude-3-5-sonnet-latest";
  const apiKey = options?.anthropicApiKey;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY in Main/.env");
  }
  const matches: MentorMatch[] = [];

  for (const mentor of payload.mentors) {
    const match = await scoreOneMentor(
      payload.currentStudent,
      payload.currentProject,
      mentor,
      model,
      apiKey,
    );
    if (match) matches.push(match);
  }

  return matches.sort((a, b) => b.score - a.score);
}
