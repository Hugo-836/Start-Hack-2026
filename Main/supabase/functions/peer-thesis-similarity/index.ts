const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  return Response.json(
    {
      error:
        "This edge function is deprecated in this project. Thesis similarity is now computed locally via Ollama at /api/peer-thesis-similarity.",
    },
    { status: 410, headers: corsHeaders },
  );
});
