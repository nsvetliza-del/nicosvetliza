import "dotenv/config";
import { put } from "@vercel/blob";
import fs from "fs";
import path from "path";

const folders = [
  {
    local: "public/videos/preview",
    remote: "preview",
  },
  {
    local: "public/videos/full",
    remote: "full",
  },
];

const manifest = {};

for (const folder of folders) {
  const files = fs.readdirSync(folder.local);

  manifest[folder.remote] = {};

  for (const file of files) {
    const filePath = path.join(folder.local, file);

    const stream = fs.createReadStream(filePath);

    console.log(`Uploading ${file}...`);

    const blob = await put(
      `${folder.remote}/${file}`,
      stream,
      {
        access: "public",
        multipart: true,
      }
    );

    manifest[folder.remote][file] = blob.url;

    console.log(`Done: ${blob.url}`);
  }
}

fs.writeFileSync(
  "src/data/blob-manifest.json",
  JSON.stringify(manifest, null, 2)
);

console.log("Manifest created.");