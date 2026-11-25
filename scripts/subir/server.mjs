#!/usr/bin/env node
// Herramienta de subida del portfolio: arrastrás un video, convierte, sube a R2,
// agrega la pieza a projects.js y publica (git push). Sin dependencias.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { putObject, publicUrl } from "./r2.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.SUBIR_ROOT ? path.resolve(process.env.SUBIR_ROOT) : path.resolve(HERE, "../..");
const PROJECTS_FILE = path.join(ROOT, "src/data/projects.js");
const MANIFEST_FILE = path.join(ROOT, "src/data/blob-manifest.json");
const VIDEOS_DIR = path.join(ROOT, "public/videos");
const TMP_DIR = path.join(os.tmpdir(), "portfolio-subir");

const CATEGORIAS = {
  "Short Film / Documentary": "short-film",
  "Music Video": "music-video",
  "Ads / Commercial / Fashion Film": "commercial",
};

// ---------- configuración (.env.r2.local) ----------
function loadEnvFile(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^['"]|['"]$/g, "");
  }
  return out;
}
// Las claves viven en R2-CLAVES.txt (o en .env.r2.local). Un valor "PEGAR_ACA" cuenta como vacío.
const fromFiles = { ...loadEnvFile(path.join(ROOT, "R2-CLAVES.txt")), ...loadEnvFile(path.join(ROOT, ".env.r2.local")) };
for (const k of Object.keys(fromFiles)) if (/PEGAR/i.test(fromFiles[k])) delete fromFiles[k];
const env = { ...fromFiles, ...process.env };
const cfg = {
  endpoint: env.R2_ENDPOINT,
  accessKey: env.R2_ACCESS_KEY_ID,
  secretKey: env.R2_SECRET_ACCESS_KEY,
  bucket: env.R2_BUCKET,
  publicUrl: env.R2_PUBLIC_URL,
};
const cfgMissing = Object.entries({
  R2_ENDPOINT: cfg.endpoint,
  R2_ACCESS_KEY_ID: cfg.accessKey,
  R2_SECRET_ACCESS_KEY: cfg.secretKey,
  R2_BUCKET: cfg.bucket,
  R2_PUBLIC_URL: cfg.publicUrl,
})
  .filter(([, v]) => !v)
  .map(([k]) => k);

const SPAWN_ENV = { ...process.env, PATH: [process.env.PATH, "/opt/homebrew/bin", "/usr/local/bin"].filter(Boolean).join(":") };

const has = (cmd, args = ["-version"]) => {
  const r = spawnSync(cmd, args, { env: SPAWN_ENV });
  return !r.error && r.status === 0;
};

// ---------- utilidades ----------
const slugify = (t) =>
  t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-+|-+$)/g, "");

const emit = (res, ev) => res.write(JSON.stringify(ev) + "\n");
const json = (res, code, obj) => {
  res.writeHead(code, { "content-type": "application/json" });
  res.end(JSON.stringify(obj));
};
const readBody = (req) =>
  new Promise((resolve, reject) => {
    let b = "";
    req.on("data", (d) => (b += d));
    req.on("end", () => resolve(b));
    req.on("error", reject);
  });

function probeDuration(file) {
  const r = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", file], {
    env: SPAWN_ENV,
    encoding: "utf8",
  });
  const n = parseFloat(r.stdout);
  return Number.isFinite(n) ? n : 0;
}

function ffmpeg(args, durationSec, onPct) {
  return new Promise((resolve, reject) => {
    const p = spawn("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-progress", "pipe:1", "-nostats", ...args], { env: SPAWN_ENV });
    let err = "";
    let buf = "";
    p.stderr.on("data", (d) => (err += d));
    p.stdout.on("data", (d) => {
      buf += d;
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i);
        buf = buf.slice(i + 1);
        const m = line.match(/^out_time_(?:us|ms)=(\d+)/);
        if (m && durationSec) onPct(Math.min(1, Number(m[1]) / 1e6 / durationSec));
      }
    });
    p.on("error", (e) => reject(new Error("No pude ejecutar ffmpeg: " + e.message)));
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error("ffmpeg falló: " + err.slice(-500)))));
  });
}

function git(args) {
  return spawnSync("git", ["-C", ROOT, ...args], { env: SPAWN_ENV, encoding: "utf8" });
}

function publicar(res, mensaje) {
  emit(res, { paso: "git", texto: "Publicando en la web (git)…" });
  const add = git(["add", "src/data/projects.js", "src/data/blob-manifest.json", "src/data/blob-manifest.backup.json"]);
  if (add.status !== 0) {
    // el backup puede no existir: reintentar sin él
    git(["add", "src/data/projects.js", "src/data/blob-manifest.json"]);
  }
  const commit = git(["commit", "-m", mensaje]);
  if (commit.status !== 0) {
    emit(res, { aviso: "No pude hacer el commit: " + (commit.stdout + commit.stderr).trim().slice(-300) });
    return false;
  }
  const push = git(["push"]);
  if (push.status !== 0) {
    emit(res, { aviso: "El commit quedó guardado pero el push falló: " + push.stderr.trim().slice(-300) + " Hacé 'git push' a mano." });
    return false;
  }
  emit(res, { paso: "git", texto: "Publicado. Vercel va a desplegar en un par de minutos.", ok: true });
  return true;
}

let ocupado = false;

// ---------- procesar un video nuevo ----------
async function procesar(res, p) {
  const { id: tmpId, titulo, categoria, inicioPreview = 0, publicarAhora = true } = p;
  if (!/^[a-f0-9]{16}$/.test(tmpId || "")) throw new Error("Subida inválida.");
  const title = String(titulo || "").trim();
  if (!title) throw new Error("Falta el título.");
  const type = CATEGORIAS[categoria];
  if (!type) throw new Error("Categoría inválida.");
  const dir = path.join(TMP_DIR, tmpId);
  const original = fs.existsSync(dir) ? fs.readdirSync(dir).map((f) => path.join(dir, f)).find((f) => f.includes("original")) : null;
  if (!original) throw new Error("No encuentro el video subido. Probá arrastrarlo de nuevo.");

  const projectsSource = fs.readFileSync(PROJECTS_FILE, "utf8");
  let id = slugify(title) || "proyecto";
  if (projectsSource.includes(`id: "${id}"`)) id = `${id}-${Date.now().toString(36)}`;
  const fileName = id.replace(/-/g, "_") + ".mp4";

  fs.mkdirSync(path.join(VIDEOS_DIR, "full"), { recursive: true });
  fs.mkdirSync(path.join(VIDEOS_DIR, "preview"), { recursive: true });
  const fullOut = path.join(VIDEOS_DIR, "full", fileName);
  const prevOut = path.join(VIDEOS_DIR, "preview", fileName);

  const total = probeDuration(original);
  const start = Math.max(0, Number(inicioPreview) || 0);

  emit(res, { paso: "full", texto: "Convirtiendo el video completo…", pct: 0 });
  await ffmpeg(
    ["-i", original, "-vf", "scale='min(1280,iw)':-2", "-c:v", "libx264", "-preset", "slow", "-crf", "26", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", fullOut],
    total,
    (pct) => emit(res, { paso: "full", pct })
  );

  emit(res, { paso: "preview", texto: "Armando el preview corto…", pct: 0 });
  const prevDur = Math.min(5, Math.max(1, total ? total - start : 5));
  await ffmpeg(
    ["-ss", String(start), "-i", original, "-t", "5", "-vf", "scale='min(640,iw)':-2", "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "32", "-pix_fmt", "yuv420p", "-movflags", "+faststart", prevOut],
    prevDur,
    (pct) => emit(res, { paso: "preview", pct })
  );

  emit(res, { paso: "subida-full", texto: "Subiendo el video completo a R2…", pct: 0 });
  const fullUrl = await putObject(cfg, `full/${fileName}`, fullOut, { onProgress: (pct) => emit(res, { paso: "subida-full", pct }) });
  emit(res, { paso: "subida-preview", texto: "Subiendo el preview a R2…", pct: 0 });
  const prevUrl = await putObject(cfg, `preview/${fileName}`, prevOut, { onProgress: (pct) => emit(res, { paso: "subida-preview", pct }) });

  emit(res, { paso: "lista", texto: "Agregando la pieza a tu web…" });
  const manifest = fs.existsSync(MANIFEST_FILE) ? JSON.parse(fs.readFileSync(MANIFEST_FILE, "utf8")) : {};
  manifest.preview = manifest.preview ?? {};
  manifest.full = manifest.full ?? {};
  manifest.preview[fileName] = prevUrl;
  manifest.full[fileName] = fullUrl;
  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2));

  const entry = `  {
    id: "${id}",
    title: ${JSON.stringify(title)},
    category: "${categoria}",
    type: "${type}",
    previewVideo: blobManifest.preview["${fileName}"],
    fullVideo: blobManifest.full["${fileName}"],
  },\n`;
  const closing = projectsSource.indexOf("\n];");
  if (closing < 0) throw new Error("No encontré el final de la lista en projects.js.");
  fs.writeFileSync(PROJECTS_FILE, projectsSource.slice(0, closing + 1) + entry + projectsSource.slice(closing + 1));

  fs.rmSync(dir, { recursive: true, force: true });

  let publicado = false;
  if (publicarAhora) publicado = publicar(res, `Agrega ${title}`);
  emit(res, { listo: true, id, titulo: title, publicado, fullUrl, prevUrl });
}

// ---------- migrar los videos que ya están en Vercel Blob ----------
async function migrar(res, { publicarAhora = true }) {
  if (!fs.existsSync(MANIFEST_FILE)) throw new Error("No encuentro blob-manifest.json.");
  const backup = MANIFEST_FILE.replace(".json", ".backup.json");
  if (!fs.existsSync(backup)) fs.copyFileSync(MANIFEST_FILE, backup);
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, "utf8"));
  const base = cfg.publicUrl.replace(/\/+$/, "");
  const jobs = [];
  for (const kind of ["preview", "full"]) {
    for (const [fileName, url] of Object.entries(manifest[kind] ?? {})) {
      if (typeof url === "string" && url.startsWith(base)) continue;
      jobs.push({ kind, fileName });
    }
  }
  if (!jobs.length) {
    emit(res, { listo: true, texto: "No hay nada para migrar: todo ya está en R2." });
    return;
  }
  let hechos = 0, saltados = 0, bytes = 0;
  const faltan = [];
  try {
    for (const { kind, fileName } of jobs) {
      const local = path.join(VIDEOS_DIR, kind, fileName);
      if (!fs.existsSync(local)) {
        saltados++;
        faltan.push(`${kind}/${fileName}`);
        emit(res, { aviso: `No encontré ${kind}/${fileName} en tu Mac; queda en Vercel Blob.` });
        continue;
      }
      emit(res, { paso: "migrar", texto: `Subiendo ${kind}/${fileName}…`, n: hechos + saltados + 1, de: jobs.length });
      manifest[kind][fileName] = await putObject(cfg, `${kind}/${fileName}`, local, {
        onProgress: (pct) => emit(res, { paso: "migrar", pct, n: hechos + saltados + 1, de: jobs.length }),
      });
      bytes += fs.statSync(local).size;
      hechos++;
      fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2));
    }
  } finally {
    fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2));
  }
  let publicado = false;
  if (publicarAhora && hechos > 0) publicado = publicar(res, "Migra videos de Vercel Blob a Cloudflare R2");
  emit(res, { listo: true, migrados: hechos, saltados, faltan, mb: Math.round(bytes / 1e6), publicado });
}

// ---------- servidor HTTP ----------
const server = http.createServer(async (req, res) => {
  try {
    const host = (req.headers.host || "").split(":")[0];
    if (host !== "localhost" && host !== "127.0.0.1") return json(res, 403, { error: "host" });
    const url = new URL(req.url, "http://localhost");

    if (req.method === "GET" && url.pathname === "/") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      return res.end(fs.readFileSync(path.join(HERE, "ui.html")));
    }
    if (req.method === "GET" && url.pathname === "/api/estado") {
      const src = fs.existsSync(PROJECTS_FILE) ? fs.readFileSync(PROJECTS_FILE, "utf8") : "";
      return json(res, 200, {
        ffmpeg: has("ffmpeg"),
        git: git(["rev-parse", "--is-inside-work-tree"]).status === 0,
        r2: cfgMissing.length === 0,
        r2Faltan: cfgMissing,
        proyectos: (src.match(/^\s+id: "/gm) || []).length,
        categorias: Object.keys(CATEGORIAS),
      });
    }

    if (req.method !== "POST") return json(res, 404, { error: "no existe" });
    if (req.headers["x-subir"] !== "1") return json(res, 403, { error: "origen" });

    if (url.pathname === "/api/subir") {
      const id = crypto.randomBytes(8).toString("hex");
      const ext = (path.extname(url.searchParams.get("nombre") || "") || ".mp4").replace(/[^.a-zA-Z0-9]/g, "").slice(0, 8);
      const dir = path.join(TMP_DIR, id);
      fs.mkdirSync(dir, { recursive: true });
      const out = fs.createWriteStream(path.join(dir, "original" + ext));
      req.pipe(out);
      out.on("finish", () => json(res, 200, { id }));
      out.on("error", (e) => json(res, 500, { error: e.message }));
      return;
    }

    if (url.pathname === "/api/procesar" || url.pathname === "/api/migrar") {
      const body = JSON.parse((await readBody(req)) || "{}");
      res.writeHead(200, { "content-type": "application/x-ndjson", "cache-control": "no-cache" });
      if (ocupado) {
        emit(res, { error: "Ya hay una tarea en curso. Esperá a que termine." });
        return res.end();
      }
      if (cfgMissing.length) {
        emit(res, { error: "Faltan datos de R2 en el archivo R2-CLAVES.txt: " + cfgMissing.join(", ") });
        return res.end();
      }
      ocupado = true;
      try {
        if (url.pathname === "/api/procesar") await procesar(res, body);
        else await migrar(res, body);
      } catch (e) {
        emit(res, { error: e.message });
      } finally {
        ocupado = false;
        res.end();
      }
      return;
    }
    json(res, 404, { error: "no existe" });
  } catch (e) {
    if (!res.headersSent) json(res, 500, { error: e.message });
    else res.end();
  }
});

let port = Number(env.SUBIR_PORT) || 4747;
server.on("error", (e) => {
  if (e.code === "EADDRINUSE" && port < 4760) {
    port++;
    server.listen(port, "127.0.0.1");
  } else {
    console.error(e);
    process.exit(1);
  }
});
server.listen(port, "127.0.0.1", () => {
  const url = `http://localhost:${port}`;
  console.log(`\nHerramienta de subida lista en ${url}\nDejá esta ventana abierta mientras la usás. Para cerrarla: Ctrl+C.\n`);
  if (process.platform === "darwin" && !process.env.SUBIR_NO_OPEN) spawn("open", [url], { stdio: "ignore", detached: true }).unref();
});
