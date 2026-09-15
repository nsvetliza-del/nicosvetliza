import { config as loadEnv } from "dotenv";
import { put } from "@vercel/blob";
import fs from "fs";
import path from "path";
import readline from "readline";

const PROJECTS_FILE = path.resolve("src/data/projects.js");
const MANIFEST_FILE = path.resolve("src/data/blob-manifest.json");

const CATEGORY_TYPE_MAP = {
  "Short Film / Documentary": "short-film",
  "Music Video": "music-video",
  "Ads / Commercial / Fashion Film": "commercial",
};

const CATEGORIES = Object.keys(CATEGORY_TYPE_MAP);

loadEnv({ path: ".env.local" });
loadEnv();

function slugify(text) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

function stripQuotes(value) {
  return value.trim().replace(/^['"]|['"]$/g, "");
}

function loadManifest() {
  if (!fs.existsSync(MANIFEST_FILE)) return { preview: {}, full: {} };
  const raw = JSON.parse(fs.readFileSync(MANIFEST_FILE, "utf8"));
  return { preview: raw.preview ?? {}, full: raw.full ?? {} };
}

// readline's promise-based question() can hang on a second call when stdin
// is piped/redirected instead of a real TTY (observed on Node 24). For a
// real terminal we prompt interactively line by line; otherwise we read all
// of stdin up front and answer sequentially from that buffer.
function createAsker() {
  if (process.stdin.isTTY) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ask = (question) => new Promise((resolve) => rl.question(question, resolve));
    const close = () => rl.close();
    return { ask, close };
  }

  const lines = fs.readFileSync(0, "utf8").split("\n");
  let index = 0;
  const ask = async (question) => {
    const line = lines[index] ?? "";
    index += 1;
    process.stdout.write(`${question}${line}\n`);
    return line;
  };
  const close = () => {};
  return { ask, close };
}

async function uploadFile(localPath, remoteFolder) {
  const fileName = path.basename(localPath);
  console.log(`Subiendo ${fileName} a "${remoteFolder}"...`);

  const blob = await put(`${remoteFolder}/${fileName}`, fs.createReadStream(localPath), {
    access: "public",
    multipart: true,
  });

  console.log(`Listo: ${blob.url}`);
  return { fileName, url: blob.url };
}

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error(
      "Falta BLOB_READ_WRITE_TOKEN en tu .env.local. Sin eso no puedo subir videos a Vercel Blob."
    );
    process.exit(1);
  }

  const { ask, close } = createAsker();

  console.log("== Agregar nuevo video al portfolio ==\n");

  let fullPath = stripQuotes(
    await ask("Ruta del video en máxima calidad (podés arrastrar el archivo a la terminal): ")
  );
  while (!fullPath || !fs.existsSync(fullPath)) {
    fullPath = stripQuotes(await ask("No encontré ese archivo. Probá de nuevo: "));
  }

  let previewPath = stripQuotes(
    await ask(
      "Ruta del video de preview (el que se ve chico en la rueda). Dejalo vacío para usar el mismo archivo: "
    )
  );
  if (previewPath && !fs.existsSync(previewPath)) {
    console.log("No encontré ese preview, voy a usar el video completo también como preview.");
    previewPath = "";
  }

  let title = stripQuotes(await ask("Título del proyecto: "));
  while (!title) {
    title = stripQuotes(await ask("El título no puede estar vacío. Título del proyecto: "));
  }

  console.log("\nCategorías disponibles:");
  CATEGORIES.forEach((category, index) => console.log(`  ${index + 1}. ${category}`));

  let category = null;
  while (!category) {
    const answer = await ask(`Elegí un número (1-${CATEGORIES.length}): `);
    category = CATEGORIES[Number(answer) - 1] ?? null;
  }

  close();

  const type = CATEGORY_TYPE_MAP[category];
  const projectsSource = fs.readFileSync(PROJECTS_FILE, "utf8");

  let id = slugify(title);
  if (projectsSource.includes(`id: "${id}"`)) {
    id = `${id}-${Date.now().toString(36)}`;
  }

  const manifest = loadManifest();

  const full = await uploadFile(fullPath, "full");
  manifest.full[full.fileName] = full.url;

  const previewSourcePath = previewPath || fullPath;
  const preview = await uploadFile(previewSourcePath, "preview");
  manifest.preview[preview.fileName] = preview.url;

  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2));

  const entry = `  {
    id: "${id}",
    title: "${title.replace(/"/g, '\\"')}",
    category: "${category}",
    type: "${type}",
    previewVideo: blobManifest.preview["${preview.fileName}"],
    fullVideo: blobManifest.full["${full.fileName}"],
  },\n`;

  const closingIndex = projectsSource.indexOf("\n];");
  const updatedSource =
    projectsSource.slice(0, closingIndex + 1) + entry + projectsSource.slice(closingIndex + 1);

  fs.writeFileSync(PROJECTS_FILE, updatedSource);

  console.log(`\nListo! Agregué "${title}" (id: ${id}) a projects.js.`);
  console.log("Para que se vea en la web en vivo: git add, commit y push (Vercel hace el deploy solo).");
}

main().catch((error) => {
  console.error("Algo falló:", error);
  process.exit(1);
});
