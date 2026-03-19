import fs from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";

const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const sourceDir = path.join(projectRoot, "fake_project_pdfs_en_v2");
const publicDir = path.join(projectRoot, "public", "fake_project_pdfs_en_v2");
const outputFile = path.join(projectRoot, "mock-data", "seedProjectDocuments.ts");

function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function parseProjectId(fileName) {
  const match = fileName.match(/^(project-\d+)_doc_\d+\.pdf$/i);
  return match?.[1] || null;
}

function decodeAscii85(input) {
  const normalized = input.replace(/\s+/g, "").replace(/^<~/, "").replace(/~>$/, "");
  const out = [];
  let group = [];

  for (const ch of normalized) {
    if (ch === "z" && group.length === 0) {
      out.push(0, 0, 0, 0);
      continue;
    }

    if (ch === "~") break;

    group.push(ch.charCodeAt(0) - 33);
    if (group.length === 5) {
      let num = 0;
      for (const value of group) num = num * 85 + value;
      out.push((num >>> 24) & 255, (num >>> 16) & 255, (num >>> 8) & 255, num & 255);
      group = [];
    }
  }

  if (group.length > 0) {
    const pad = 5 - group.length;
    while (group.length < 5) group.push(84);
    let num = 0;
    for (const value of group) num = num * 85 + value;
    const bytes = [(num >>> 24) & 255, (num >>> 16) & 255, (num >>> 8) & 255, num & 255];
    out.push(...bytes.slice(0, 4 - pad));
  }

  return Buffer.from(out);
}

function extractPdfTitle(buffer) {
  const raw = buffer.toString("latin1");
  const streamMatch = raw.match(/stream\r?\n([\s\S]*?)endstream/);
  if (!streamMatch) {
    return null;
  }

  try {
    const decoded = decodeAscii85(streamMatch[1]);
    const contentStream = zlib.inflateSync(decoded).toString("latin1");
    const textChunks = [...contentStream.matchAll(/\(([^()]*)\) Tj/g)]
      .map((match) => match[1])
      .filter((value) => value && value !== "\\177" && value !== "Keyword Set");

    const title = textChunks.slice(0, 2).join(" ").replace(/\s+/g, " ").trim();
    return title || null;
  } catch {
    return null;
  }
}

async function main() {
  await ensureDir(publicDir);
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  const pdfEntries = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".pdf"))
    .sort((left, right) => left.name.localeCompare(right.name));

  const documents = [];

  for (const entry of pdfEntries) {
    const projectId = parseProjectId(entry.name);
    if (!projectId) {
      throw new Error(`Unexpected PDF name format: ${entry.name}`);
    }

    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(publicDir, entry.name);
    const stat = await fs.stat(sourcePath);
    const fileBuffer = await fs.readFile(sourcePath);
    const displayTitle = extractPdfTitle(fileBuffer);

    await fs.copyFile(sourcePath, targetPath);

    documents.push({
      id: `seed-${entry.name.replace(/\.pdf$/i, "").replace(/[^a-zA-Z0-9_-]/g, "-")}`,
      project_id: projectId,
      name: entry.name,
      display_title: displayTitle,
      type: "application/pdf",
      size: stat.size,
      dataUrl: `/fake_project_pdfs_en_v2/${encodeURIComponent(entry.name)}`,
      created_at: stat.mtime.toISOString(),
    });
  }

  const fileContent = `export const seededProjectDocuments = ${JSON.stringify(documents, null, 2)} as const;\n`;
  await fs.writeFile(outputFile, fileContent, "utf8");

  console.log(
    `Seeded ${documents.length} project documents into ${toPosixPath(path.relative(projectRoot, outputFile))}.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
