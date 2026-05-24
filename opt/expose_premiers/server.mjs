import { createServer } from "node:http";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const HOST = process.env.EXPOSE_PREMIERS_HOST || "127.0.0.1";
const PORT = Number(process.env.EXPOSE_PREMIERS_PORT || 8037);
const DATA_DIR = resolve(process.env.EXPOSE_PREMIERS_DATA || "/var/lib/expose_premiers");
const MAX_BODY_BYTES = 8 * 1024 * 1024;

function send(res, status, payload, type = "application/json; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(type.startsWith("application/json") ? JSON.stringify(payload) : payload);
}

function safeName(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "_")
    .replace(/^_+/g, "")
    .replace(/_+$/g, "")
    .slice(0, 80) || "evaluation";
}

async function readBody(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error("Payload too large");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function csvEscape(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function buildServerCSV(payload) {
  const headers = ["passage", "mode", "eleve", "section", "note_finale_20", "duree"];
  const rows = [headers.join(";")];
  for (const passage of payload.passages || []) {
    const entries = passage.mode === "solo" ? [["A", passage.studentA]] : [["A", passage.studentA], ["B", passage.studentB]];
    for (const [, name] of entries) {
      const final = name === passage.studentA ? passage.computedScores?.finalA : passage.computedScores?.finalB;
      rows.push([passage.id, passage.mode, name, passage.section, final ?? "", passage.duration || ""].map(csvEscape).join(";"));
    }
  }
  return rows.join("\n");
}

async function saveSnapshot(body) {
  const payload = body.payload;
  if (!payload || !payload.metadata || !Array.isArray(payload.passages)) {
    const error = new Error("Payload d'évaluation invalide");
    error.status = 400;
    throw error;
  }
  await mkdir(DATA_DIR, { recursive: true, mode: 0o750 });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const label = safeName(payload.metadata.class || payload.metadata.title || "evaluation_oral_fermat");
  const base = `${stamp}_${label}`;
  const snapshot = {
    savedAt: new Date().toISOString(),
    payload,
    reportsText: body.reportsText || "",
    csv: body.csv || buildServerCSV(payload),
  };
  await writeFile(join(DATA_DIR, `${base}.json`), JSON.stringify(snapshot, null, 2), "utf8");
  await writeFile(join(DATA_DIR, "latest.json"), JSON.stringify(snapshot, null, 2), "utf8");
  if (snapshot.reportsText) await writeFile(join(DATA_DIR, `${base}_rapports.txt`), snapshot.reportsText, "utf8");
  if (snapshot.csv) await writeFile(join(DATA_DIR, `${base}_notes.csv`), snapshot.csv, "utf8");
  return { ok: true, id: base, savedAt: snapshot.savedAt };
}

async function listSnapshots() {
  await mkdir(DATA_DIR, { recursive: true, mode: 0o750 });
  const files = (await readdir(DATA_DIR)).filter((name) => name.endsWith(".json") && name !== "latest.json").sort().reverse();
  return { ok: true, files: files.slice(0, 50) };
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", "http://localhost");
    if (req.method === "GET" && url.pathname === "/health") return send(res, 200, { ok: true });
    if (req.method === "GET" && url.pathname === "/list") return send(res, 200, await listSnapshots());
    if (req.method === "GET" && url.pathname === "/latest") {
      try {
        const raw = await readFile(join(DATA_DIR, "latest.json"), "utf8");
        return send(res, 200, JSON.parse(raw));
      } catch {
        return send(res, 404, { ok: false, error: "Aucune sauvegarde serveur" });
      }
    }
    if (req.method === "POST" && url.pathname === "/save") {
      const raw = await readBody(req);
      return send(res, 200, await saveSnapshot(JSON.parse(raw)));
    }
    send(res, 404, { ok: false, error: "Route inconnue" });
  } catch (error) {
    send(res, error.status || 500, { ok: false, error: error.message || "Erreur serveur" });
  }
}).listen(PORT, HOST, () => {
  console.log(`expose_premiers server listening on http://${HOST}:${PORT}`);
  console.log(`data directory: ${DATA_DIR}`);
});
