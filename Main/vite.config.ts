import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";
import { scorePeerThesisSimilarity } from "./server/peerThesisSimilarity";
import { generatePeerIntroEmail } from "./server/peerIntroEmail";
import { scoreMentorMatches } from "./server/mentorMatching";
import { generateMentorIntroEmail } from "./server/mentorIntroEmail";
import { buildThesisCommandCenter } from "./server/thesisCommandCenter";
import { generateTaskAssistantReply } from "./server/taskAssistant";
import { matchSharedDocumentsWithClaude } from "./server/sharedDocumentMatcher";
import { discoverDocumentsWithClaude } from "./server/documentDiscoveryAssistant";
import { generateAiFeedback } from "./server/aiFeedback";
import { generateDashboardAssistantReply } from "./server/dashboardAssistant";

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

const DEMO_SHARED_DOCUMENT_REQUESTS_FILE = path.resolve(
  process.cwd(),
  ".demo-sync",
  "shared-document-requests.json",
);
const DEMO_RECEIVED_SHARED_DOCUMENTS_FILE = path.resolve(
  process.cwd(),
  ".demo-sync",
  "received-shared-documents.json",
);
const DEMO_PEER_REQUESTS_FILE = path.resolve(
  process.cwd(),
  ".demo-sync",
  "peer-requests.json",
);
const DEMO_PEER_CONNECTIONS_FILE = path.resolve(
  process.cwd(),
  ".demo-sync",
  "peer-connections.json",
);

function readDemoSharedDocumentRequests() {
  try {
    if (!fs.existsSync(DEMO_SHARED_DOCUMENT_REQUESTS_FILE)) {
      return [];
    }

    const raw = fs.readFileSync(DEMO_SHARED_DOCUMENT_REQUESTS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeDemoSharedDocumentRequests(requests: unknown[]) {
  const directory = path.dirname(DEMO_SHARED_DOCUMENT_REQUESTS_FILE);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(
    DEMO_SHARED_DOCUMENT_REQUESTS_FILE,
    JSON.stringify(requests, null, 2),
    "utf8",
  );
}

function readDemoReceivedSharedDocuments() {
  try {
    if (!fs.existsSync(DEMO_RECEIVED_SHARED_DOCUMENTS_FILE)) {
      return [];
    }

    const raw = fs.readFileSync(DEMO_RECEIVED_SHARED_DOCUMENTS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeDemoReceivedSharedDocuments(documents: unknown[]) {
  const directory = path.dirname(DEMO_RECEIVED_SHARED_DOCUMENTS_FILE);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(
    DEMO_RECEIVED_SHARED_DOCUMENTS_FILE,
    JSON.stringify(documents, null, 2),
    "utf8",
  );
}

function readDemoPeerRequests() {
  try {
    if (!fs.existsSync(DEMO_PEER_REQUESTS_FILE)) {
      return [];
    }

    const raw = fs.readFileSync(DEMO_PEER_REQUESTS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeDemoPeerRequests(requests: unknown[]) {
  const directory = path.dirname(DEMO_PEER_REQUESTS_FILE);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(DEMO_PEER_REQUESTS_FILE, JSON.stringify(requests, null, 2), "utf8");
}

function readDemoPeerConnections() {
  try {
    if (!fs.existsSync(DEMO_PEER_CONNECTIONS_FILE)) {
      return [];
    }

    const raw = fs.readFileSync(DEMO_PEER_CONNECTIONS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeDemoPeerConnections(connections: unknown[]) {
  const directory = path.dirname(DEMO_PEER_CONNECTIONS_FILE);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(DEMO_PEER_CONNECTIONS_FILE, JSON.stringify(connections, null, 2), "utf8");
}

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
        name: "local-ai-api",
        configureServer(server: any) {
          server.middlewares.use("/api/peer-thesis-similarity", async (req: any, res: any, next: any) => {
            if (req.method !== "POST") return next();

            try {
              const rawBody = await readBody(req);
              const body = JSON.parse(rawBody);
              const matches = await scorePeerThesisSimilarity(body, {
                anthropicApiKey: env.ANTHROPIC_API_KEY,
                claudeModel: env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
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
            if (req.method !== "POST") return next();

            try {
              const rawBody = await readBody(req);
              const body = JSON.parse(rawBody);
              const email = await generatePeerIntroEmail(body, {
                anthropicApiKey: env.ANTHROPIC_API_KEY,
                claudeModel: env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
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
            if (req.method !== "POST") return next();

            try {
              const rawBody = await readBody(req);
              const body = JSON.parse(rawBody);
              const matches = await scoreMentorMatches(body, {
                anthropicApiKey: env.ANTHROPIC_API_KEY,
                claudeModel: env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
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
            if (req.method !== "POST") return next();

            try {
              const rawBody = await readBody(req);
              const body = JSON.parse(rawBody);
              const email = await generateMentorIntroEmail(body, {
                anthropicApiKey: env.ANTHROPIC_API_KEY,
                claudeModel: env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
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

          server.middlewares.use("/api/thesis-command-center", async (req: any, res: any, next: any) => {
            if (req.method !== "POST") return next();

            try {
              const rawBody = await readBody(req);
              const body = JSON.parse(rawBody);
              const summary = await buildThesisCommandCenter(body, {
                anthropicApiKey: env.ANTHROPIC_API_KEY,
                claudeModel: env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
              });

              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(summary));
            } catch (error) {
              const message = error instanceof Error ? error.message : "Unknown error";
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: message }));
            }
          });

          server.middlewares.use("/api/task-ai-chat", async (req: any, res: any, next: any) => {
            if (req.method !== "POST") return next();

            try {
              const rawBody = await readBody(req);
              const body = JSON.parse(rawBody);
              const reply = await generateTaskAssistantReply(body, {
                apiKey: env.ANTHROPIC_API_KEY,
                model: env.ANTHROPIC_MODEL || env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
              });

              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(reply));
            } catch (error) {
              const message = error instanceof Error ? error.message : "Unknown error";
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: message }));
            }
          });

          server.middlewares.use("/api/shared-document-match", async (req: any, res: any, next: any) => {
            if (req.method !== "POST") return next();

            try {
              const rawBody = await readBody(req);
              const body = JSON.parse(rawBody);
              const matches = await matchSharedDocumentsWithClaude(body, {
                apiKey: env.ANTHROPIC_API_KEY,
                model: env.ANTHROPIC_MODEL || env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
              });

              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(matches));
            } catch (error) {
              const message = error instanceof Error ? error.message : "Unknown error";
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: message }));
            }
          });

          server.middlewares.use("/api/document-discovery-assistant", async (req: any, res: any, next: any) => {
            if (req.method !== "POST") return next();

            try {
              const rawBody = await readBody(req);
              const body = JSON.parse(rawBody);
              const result = await discoverDocumentsWithClaude(body, {
                apiKey: env.ANTHROPIC_API_KEY,
                model: env.ANTHROPIC_MODEL || env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
              });

              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(result));
            } catch (error) {
              const message = error instanceof Error ? error.message : "Unknown error";
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: message }));
            }
          });
          server.middlewares.use("/api/dashboard-ai-chat", async (req: any, res: any, next: any) => {
            if (req.method !== "POST") return next();

            try {
              const rawBody = await readBody(req);
              const body = JSON.parse(rawBody);
              const reply = await generateDashboardAssistantReply(body, {
                apiKey: env.ANTHROPIC_API_KEY,
                model: env.ANTHROPIC_MODEL || env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
              });

              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(reply));
            } catch (error) {
              const message = error instanceof Error ? error.message : "Unknown error";
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: message }));
            }
          });
          server.middlewares.use("/api/demo-shared-document-requests", async (req: any, res: any, next: any) => {
            if (req.method === "GET") {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ requests: readDemoSharedDocumentRequests() }));
              return;
            }

            if (req.method === "POST") {
              try {
                const rawBody = await readBody(req);
                const body = rawBody ? JSON.parse(rawBody) : {};
                const requests = Array.isArray(body?.requests) ? body.requests : [];
                writeDemoSharedDocumentRequests(requests);
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ ok: true, requests }));
              } catch (error) {
                const message = error instanceof Error ? error.message : "Unknown error";
                res.statusCode = 500;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: message }));
              }
              return;
            }

            return next();
          });
          server.middlewares.use("/api/demo-received-shared-documents", async (req: any, res: any, next: any) => {
            if (req.method === "GET") {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ documents: readDemoReceivedSharedDocuments() }));
              return;
            }

            if (req.method === "POST") {
              try {
                const rawBody = await readBody(req);
                const body = rawBody ? JSON.parse(rawBody) : {};
                const documents = Array.isArray(body?.documents) ? body.documents : [];
                writeDemoReceivedSharedDocuments(documents);
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ ok: true, documents }));
              } catch (error) {
                const message = error instanceof Error ? error.message : "Unknown error";
                res.statusCode = 500;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: message }));
              }
              return;
            }

            return next();
          });
          server.middlewares.use("/api/demo-peer-requests", async (req: any, res: any, next: any) => {
            if (req.method === "GET") {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ requests: readDemoPeerRequests() }));
              return;
            }

            if (req.method === "POST") {
              try {
                const rawBody = await readBody(req);
                const body = rawBody ? JSON.parse(rawBody) : {};
                const requests = Array.isArray(body?.requests) ? body.requests : [];
                writeDemoPeerRequests(requests);
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ ok: true, requests }));
              } catch (error) {
                const message = error instanceof Error ? error.message : "Unknown error";
                res.statusCode = 500;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: message }));
              }
              return;
            }

            return next();
          });
          server.middlewares.use("/api/demo-peer-connections", async (req: any, res: any, next: any) => {
            if (req.method === "GET") {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ connections: readDemoPeerConnections() }));
              return;
            }

            if (req.method === "POST") {
              try {
                const rawBody = await readBody(req);
                const body = rawBody ? JSON.parse(rawBody) : {};
                const connections = Array.isArray(body?.connections) ? body.connections : [];
                writeDemoPeerConnections(connections);
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ ok: true, connections }));
              } catch (error) {
                const message = error instanceof Error ? error.message : "Unknown error";
                res.statusCode = 500;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: message }));
              }
              return;
            }

            return next();
          });
          server.middlewares.use("/api/ai-feedback", async (req: any, res: any, next: any) => {
            if (req.method !== "POST") return next();
          
            try {
              const rawBody = await readBody(req);
              const body = JSON.parse(rawBody);
              const result = await generateAiFeedback(body, {
                anthropicApiKey: env.ANTHROPIC_API_KEY,
                claudeModel: env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
              });
          
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(result));
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
