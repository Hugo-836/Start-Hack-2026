import OpenAI from "npm:openai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ThesisInput = {
  title: string;
  description?: string | null;
  motivation?: string | null;
};

type CandidateInput = {
  studentId: string;
  studentName: string;
  degree: string;
  universityId?: string | null;
  thesis: ThesisInput;
};

type RequestBody = {
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

const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!Deno.env.get("OPENAI_API_KEY")) {
    return Response.json(
      { error: "Missing OPENAI_API_KEY secret." },
      { status: 500, headers: corsHeaders },
    );
  }

  try {
    const body = (await req.json()) as RequestBody;

    if (!body.currentStudent || !body.currentThesis || !body.candidates?.length) {
      return Response.json({ matches: [] }, { headers: corsHeaders });
    }

    const response = await openai.responses.create({
      model: "gpt-5.2",
      reasoning: { effort: "low" },
      input: [
        {
          role: "developer",
          content: [
            {
              type: "input_text",
              text:
                "You score thesis similarity for academic peer matching. Compare the current student's thesis against each candidate thesis. " +
                "Return a score from 0 to 100 where 100 means extremely strong thesis overlap. " +
                "Use thesis title, description, motivation, academic context, and the current student's profile as support. " +
                "Be strict: only give 80+ for genuinely close thesis overlap. Keep reasons short and concrete.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify(body),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "peer_thesis_similarity",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              matches: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    studentId: { type: "string" },
                    score: { type: "number" },
                    reason: { type: "string" },
                  },
                  required: ["studentId", "score", "reason"],
                },
              },
            },
            required: ["matches"],
          },
        },
      },
    });

    const output = JSON.parse(response.output_text || "{\"matches\":[]}");

    return Response.json(
      {
        matches: (output.matches || []).map(
          (match: { studentId: string; score: number; reason: string }) => ({
            studentId: match.studentId,
            score: Math.max(0, Math.min(100, Math.round(match.score))),
            reason: match.reason,
          }),
        ),
      },
      { headers: corsHeaders },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
