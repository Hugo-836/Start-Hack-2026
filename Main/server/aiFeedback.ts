import Anthropic from "@anthropic-ai/sdk";

interface AiFeedbackInput {
  title: string;
  submission_text: string;
}

interface AiFeedbackOptions {
  anthropicApiKey: string;
  claudeModel: string;
}

export async function generateAiFeedback(
  input: AiFeedbackInput,
  options: AiFeedbackOptions
): Promise<{ summary: string; feedback_type: string }> {
  const client = new Anthropic({ apiKey: options.anthropicApiKey });

  const message = await client.messages.create({
    model: options.claudeModel,
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: `You are an academic thesis advisor. First, detect what type of content the student submitted:

- If it looks like an **outline, plan, table of contents, or structure** (bullet points, chapter titles, numbered sections) → it's a STRUCTURE submission
- If it looks like **written content, argumentation, analysis, or literature** → it's an ACADEMIC submission

Then provide feedback adapted to the type detected.

---

If STRUCTURE: give feedback on:
1. **Clarity of the plan** : is the structure logical and easy to follow?
2. **Missing sections** : what important parts are absent?
3. **Suggestions** : how to strengthen the overall organization

If ACADEMIC: give feedback on:
1. **Strengths** : what is well argued or well written
2. **Areas to improve** : weak arguments, missing sources, unclear parts
3. **Suggestions** : concrete next steps to strengthen the content

---

Start your response with exactly one of these lines (no punctuation after):
TYPE: STRUCTURE
or
TYPE: ACADEMIC

Then provide the feedback.

Submission title: "${input.title}"
Submission text: "${input.submission_text}"

Be concise, constructive, and encouraging.`,
      },
    ],
  });

  const raw = message.content
    .map((item) => (item.type === "text" ? item.text : ""))
    .join("");

  // Extraire le type détecté
  const typeMatch = raw.match(/^TYPE:\s*(STRUCTURE|ACADEMIC)/);
  const feedback_type = typeMatch ? typeMatch[1].toLowerCase() : "academic";

  // Retirer la ligne TYPE: du texte affiché
  const summary = raw.replace(/^TYPE:\s*(STRUCTURE|ACADEMIC)\n?/, "").trim();

  return { summary, feedback_type };
}