import { useState } from "react";

export function useDocumentSuggestions() {
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<string[]>([]);

  async function fetchSuggestions(thesisText: string) {
    setLoading(true);

    try {
      const response = await fetch("/api/suggest-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thesisText }),
      });

      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  }

  return { loading, documents, fetchSuggestions };
}
