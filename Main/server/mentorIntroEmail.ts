import { generateJsonWithClaude, parseClaudeJson } from "./claude";

type StudentProfile = {
  id: string;
  first_name: string;
  last_name: string;
  degree: string;
  university_id?: string | null;
  skills?: string[] | null;
  objectives?: string[] | null;
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

type MentorIntroEmailRequest = {
  currentStudent: StudentProfile;
  currentProject?: ThesisProject | null;
  mentor: MentorProfile;
  mentorMatchScore?: number | null;
  mentorMatchReason?: string | null;
};

export async function generateMentorIntroEmail(
  payload: MentorIntroEmailRequest,
  options?: { anthropicApiKey?: string; claudeModel?: string },
) {
  const model = options?.claudeModel || "claude-3-5-sonnet-latest";
  const prompt = JSON.stringify({
    instructions: [
      "Write a concise outreach email from the student to the mentor.",
      "Use the student's thesis, profile, mentor expertise, and match reason.",
      "Tone should be respectful and specific.",
      "Return valid JSON only with keys subject and body.",
    ],
    data: payload,
  });

  const raw = await generateJsonWithClaude(prompt, {
    apiKey: options?.anthropicApiKey,
    model,
    maxTokens: 700,
  });
  const parsed = parseClaudeJson<{ subject?: string; body?: string }>(raw);

  return {
    subject:
      typeof parsed?.subject === "string" && parsed.subject.trim()
        ? parsed.subject.trim()
        : "Mentorship request regarding my thesis",
    body:
      typeof parsed?.body === "string" && parsed.body.trim()
        ? parsed.body.trim()
        : `Hello ${payload.mentor.full_name},\n\nI am currently working on my thesis and your background seems highly relevant to my topic. I would love to ask whether you would be open to a short exchange.\n\nBest regards,\n${payload.currentStudent.first_name} ${payload.currentStudent.last_name}`,
  };
}
