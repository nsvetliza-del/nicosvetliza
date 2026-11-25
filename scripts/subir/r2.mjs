// Subida a Cloudflare R2 sin dependencias: firma AWS SigV4 propia (S3 compatible).
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import https from "node:https";

const enc = (s) =>
  encodeURIComponent(s).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
const sha256 = (d) => crypto.createHash("sha256").update(d).digest("hex");
const hmac = (k, d) => crypto.createHmac("sha256", k).update(d).digest();

export const objectPath = (bucket, key) => "/" + [bucket, ...key.split("/")].map(enc).join("/");

export function publicUrl(base, key) {
  return base.replace(/\/+$/, "") + "/" + key.split("/").map(enc).join("/");
}

export function signPut({ pathname, headers, accessKey, secretKey, now = new Date(), region = "auto" }) {
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const all = { ...headers, "x-amz-content-sha256": "UNSIGNED-PAYLOAD", "x-amz-date": amzDate };
  const lower = Object.fromEntries(Object.entries(all).map(([k, v]) => [k.toLowerCase(), String(v).trim()]));
  const names = Object.keys(lower).sort();
  const canonicalHeaders = names.map((n) => `${n}:${lower[n]}\n`).join("");
  const signedHeaders = names.join(";");
  const canonicalRequest = ["PUT", pathname, "", canonicalHeaders, signedHeaders, "UNSIGNED-PAYLOAD"].join("\n");
  const scope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256(canonicalRequest)].join("\n");
  const kDate = hmac("AWS4" + secretKey, dateStamp);
  const kSigning = hmac(hmac(hmac(kDate, region), "s3"), "aws4_request");
  const signature = crypto.createHmac("sha256", kSigning).update(stringToSign).digest("hex");
  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  return { ...lower, authorization };
}

function putOnce(cfg, key, filePath, size, contentType, onProgress) {
  const u = new URL(cfg.endpoint);
  const pathname = objectPath(cfg.bucket, key);
  const headers = signPut({
    pathname,
    headers: {
      host: u.host,
      "content-length": size,
      "content-type": contentType,
      "cache-control": "public, max-age=31536000, immutable",
    },
    accessKey: cfg.accessKey,
    secretKey: cfg.secretKey,
  });
  const lib = u.protocol === "http:" ? http : https;
  return new Promise((resolve, reject) => {
    const req = lib.request(
      { method: "PUT", hostname: u.hostname, port: u.port || (u.protocol === "http:" ? 80 : 443), path: pathname, headers },
      (res) => {
        let body = "";
        res.on("data", (d) => (body += d));
        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) resolve();
          else reject(new Error(`R2 respondió ${res.statusCode}: ${body.slice(0, 300)}`));
        });
      }
    );
    req.on("error", reject);
    let sent = 0;
    const rs = fs.createReadStream(filePath);
    rs.on("data", (c) => {
      sent += c.length;
      if (onProgress) onProgress(sent / size);
    });
    rs.on("error", reject);
    rs.pipe(req);
  });
}

export async function putObject(cfg, key, filePath, { contentType = "video/mp4", onProgress } = {}) {
  const { size } = await fs.promises.stat(filePath);
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await putOnce(cfg, key, filePath, size, contentType, onProgress);
      return publicUrl(cfg.publicUrl, key);
    } catch (e) {
      lastError = e;
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  throw lastError;
}
