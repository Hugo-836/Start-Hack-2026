import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

app.post("/api/suggest-documents", async (req, res) => {
  const { thesisText } = req.body;

  const prompt = `
L'étudiant travaille sur la thèse suivante :
"${thesisText}"

Propose 5 documents importants à consulter :
- articles scientifiques
- rapports
- méthodologies
- frameworks
- ressources académiques

Réponds sous forme de liste JSON :
[
  "Document 1",
  "Document 2",
  ...
]
`;

  try {
    const completion = await client.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 300,
      messages: [
        { role: "user", content: prompt }
      ],
    });

    // Claude renvoie le texte dans completion.content[0].text
    const raw = completion.content[0].text;

    // On parse le JSON renvoyé par Claude
    let documents = [];
    try {
      documents = JSON.parse(raw);
    } catch {
      // fallback si Claude renvoie une liste non JSON
      documents = raw
        .split("\n")
        .map((l) => l.replace(/^-/, "").trim())
        .filter((l) => l.length > 0);
    }

    res.json({ documents });
  } catch (error) {
    console.error("Claude API error:", error);
    res.status(500).json({ error: "AI generation failed" });
  }
});
