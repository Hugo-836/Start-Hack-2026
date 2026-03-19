import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { scorePeerThesisSimilarity } from "./server/peerThesisSimilarity";
import { generatePeerIntroEmail } from "./server/peerIntroEmail";
import { scoreMentorMatches } from "./server/mentorMatching";
import { generateMentorIntroEmail } from "./server/mentorIntroEmail";

function readBody(req: NodeJS.ReadableStream) {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      {
        name: "peer-thesis-similarity-api",
        configureServer(server: any) {
          server.middlewares.use("/api/peer-thesis-similarity", async (req: any, res: any, next: any) => {
            if (req.method !== "POST") {
              return next();
            }

            try {
              const rawBody = await readBody(req);
              const body = JSON.parse(rawBody);
              const matches = await scorePeerThesisSimilarity(body, {
                ollamaModel: env.OLLAMA_MODEL || "qwen2.5:7b",
              });

              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ matches }));
            } catch (error) {
              const message = error instanceof Error ? error.message : "Unknown error";
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: message }));
            }
          });
          server.middlewares.use("/api/peer-intro-email", async (req: any, res: any, next: any) => {
            if (req.method !== "POST") {
              return next();
            }

            try {
              const rawBody = await readBody(req);
              const body = JSON.parse(rawBody);
              const email = await generatePeerIntroEmail(body, {
                ollamaModel: env.OLLAMA_MODEL || "qwen2.5:3b",
              });

              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(email));
            } catch (error) {
              const message = error instanceof Error ? error.message : "Unknown error";
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: message }));
            }
          });
          server.middlewares.use("/api/mentor-match", async (req: any, res: any, next: any) => {
            if (req.method !== "POST") {
              return next();
            }

            try {
              const rawBody = await readBody(req);
              const body = JSON.parse(rawBody);
              const matches = await scoreMentorMatches(body, {
                ollamaModel: env.OLLAMA_MODEL || "qwen2.5:3b",
              });

              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ matches }));
            } catch (error) {
              const message = error instanceof Error ? error.message : "Unknown error";
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: message }));
            }
          });
          server.middlewares.use("/api/mentor-intro-email", async (req: any, res: any, next: any) => {
            if (req.method !== "POST") {
              return next();
            }

            try {
              const rawBody = await readBody(req);
              const body = JSON.parse(rawBody);
              const email = await generateMentorIntroEmail(body, {
                ollamaModel: env.OLLAMA_MODEL || "qwen2.5:3b",
              });

              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(email));
            } catch (error) {
              const message = error instanceof Error ? error.message : "Unknown error";
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: message }));
            }
          });
        },
      },
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
