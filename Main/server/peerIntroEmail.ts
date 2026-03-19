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

type PeerIntroEmailRequest = {
  currentStudent: StudentProfile;
  currentProject?: ThesisProject | null;
  peerStudent: StudentProfile;
  peerProject?: ThesisProject | null;
  thesisSimilarityScore?: number;
  thesisSimilarityReason?: string | null;
};

type OllamaGenerateResponse = {
  response?: string;
};

export async function generatePeerIntroEmail(
  payload: PeerIntroEmailRequest,
  options?: { ollamaModel?: string },
) {
  const model = options?.ollamaModel || "qwen2.5:3b";
  const prompt = JSON.stringify({
    instructions: [
      "Write a short, natural outreach email from the current student to the peer student.",
      "Use the student profiles, thesis context, and thesis similarity if available.",
      "Keep it warm, concise, and specific.",
      "Return valid JSON only with keys subject and body.",
      "The body must be plain text with greeting, short intro, reason for reaching out, and a closing.",
    ],
    data: payload,
  });

  const response = await fetch("http://127.0.0.1:11434/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      stream: false,
      format: "json",
      prompt,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama email generation failed with status ${response.status}`);
  }

  const data = (await response.json()) as OllamaGenerateResponse;
  const raw = data.response || "";
  const parsed = JSON.parse(raw);

  return {
    subject:
      typeof parsed?.subject === "string" && parsed.subject.trim()
        ? parsed.subject.trim()
        : "Thesis collaboration opportunity",
    body:
      typeof parsed?.body === "string" && parsed.body.trim()
        ? parsed.body.trim()
        : `Hi ${payload.peerStudent.first_name},\n\nI came across your thesis work and thought it would be great to connect. Our topics seem to overlap, and I think it could be useful to exchange ideas.\n\nWould you be open to a quick chat?\n\nBest,\n${payload.currentStudent.first_name} ${payload.currentStudent.last_name}`,
  };
}
