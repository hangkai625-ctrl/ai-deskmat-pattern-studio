import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = process.cwd();
const publicDir = join(root, "public");

async function loadDotEnv() {
  try {
    const content = await readFile(join(root, ".env"), "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separator = trimmed.indexOf("=");
      if (separator === -1) continue;
      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
      if (key && process.env[key] === undefined) process.env[key] = value;
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

await loadDotEnv();

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "0.0.0.0";
const imageApiUrl = process.env.IMAGE_API_URL || "https://api.mooko.ai/v1/images/generations";
const imageEditApiUrl = process.env.IMAGE_EDIT_API_URL || "https://api.mooko.ai/v1/images/edits";
const imageModel = process.env.IMAGE_MODEL || "gpt-image-2-pro";
const imageSize = process.env.IMAGE_SIZE || "2048x1152";
const imageQuality = process.env.IMAGE_QUALITY || "high";
const imageModeration = process.env.IMAGE_MODERATION || "auto";
const imageResponseFormat = process.env.IMAGE_RESPONSE_FORMAT || "b64_json";
const appVersion = "lan-only-20260505";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon"
};

function sendJson(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(payload));
}

function clamp(value, min, max) {
  const number = Number(value);
  if (Number.isNaN(number)) return min;
  return Math.min(max, Math.max(min, number));
}

async function readRequestBody(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 1024 * 1024 * 32) throw new Error("The request is too large. Please shorten the prompt or reference image.");
  }
  return JSON.parse(body || "{}");
}

function buildPrompt(input) {
  const prompt = String(input.prompt || "").trim();
  return prompt || "Generate an image based on the provided prompt.";
}

function pickAllowed(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function normalizeImageUrl(value) {
  if (!value) return null;
  if (value.startsWith("data:image/") || value.startsWith("http://") || value.startsWith("https://")) return value;
  return `data:image/png;base64,${value}`;
}

function stripDataUrl(value) {
  return value.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");
}

function parseDataUrl(value) {
  const match = String(value || "").match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return { mimeType: "image/png", base64: String(value || "") };
  return { mimeType: match[1], base64: match[2] };
}

function extensionForMimeType(mimeType) {
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "jpg";
  if (mimeType.includes("webp")) return "webp";
  return "png";
}

function extractImages(result) {
  return Array.isArray(result.data)
    ? result.data.map((item) => item.url ? normalizeImageUrl(item.url) : item.b64_json ? normalizeImageUrl(item.b64_json) : null).filter(Boolean)
    : [];
}

async function generateImages(request, response) {
  let input;
  try {
    input = await readRequestBody(request);
  } catch (error) {
    sendJson(response, 400, { error: error.message || "Invalid request format." });
    return;
  }

  const apiKey = process.env.IMAGE_API_TOKEN || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    sendJson(response, 500, { error: "服务端缺少 IMAGE_API_TOKEN。请把 API Key 写入公司内网服务器的 .env 文件后重启。" });
    return;
  }

  const prompt = buildPrompt(input);
  const count = clamp(input.count, 1, 4);
  const requestSize = pickAllowed(input.size, ["1024x1024", "1536x1024", "1024x1536", "2048x2048", "2048x1152", "3840x2160", "2160x3840", "auto"], imageSize);
  const requestQuality = pickAllowed(input.quality, ["low", "medium", "high", "auto"], imageQuality);
  const mode = input.mode === "img2img" ? "img2img" : "text2img";
  const referenceImage = mode === "img2img" ? String(input.referenceImage || "").trim() : "";
  const referenceBase64 = referenceImage ? stripDataUrl(referenceImage) : "";
  const requestBody = { model: imageModel, prompt, n: count, size: requestSize, moderation: imageModeration, quality: requestQuality, response_format: imageResponseFormat };

  try {
    let apiResponse;
    if (referenceImage) {
      const parsed = parseDataUrl(referenceImage);
      const imageBytes = Uint8Array.from(Buffer.from(parsed.base64, "base64"));
      const formData = new FormData();
      formData.append("model", imageModel);
      formData.append("prompt", prompt);
      formData.append("n", String(count));
      formData.append("size", requestSize);
      formData.append("quality", requestQuality);
      formData.append("response_format", imageResponseFormat);
      formData.append("image", new Blob([imageBytes], { type: parsed.mimeType }), `reference.${extensionForMimeType(parsed.mimeType)}`);

      apiResponse = await fetch(imageEditApiUrl, { method: "POST", headers: { Authorization: `Bearer ${apiKey}` }, body: formData });

      if ([400, 404, 405, 415].includes(apiResponse.status)) {
        apiResponse = await fetch(imageApiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ ...requestBody, image: referenceBase64 })
        });
      }
    } else {
      apiResponse = await fetch(imageApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(requestBody)
      });
    }

    const result = await apiResponse.json().catch(() => ({}));
    if (!apiResponse.ok) {
      sendJson(response, apiResponse.status, { error: result?.error?.message || "Image generation failed.", prompt });
      return;
    }

    const images = extractImages(result);
    if (!images.length) {
      sendJson(response, 502, { error: "The image service did not return a usable image.", prompt });
      return;
    }

    sendJson(response, 200, {
      images: images.map((url, index) => ({ id: `${Date.now()}-${index}`, url })),
      prompt,
      revisedPrompt: result.data?.[0]?.revised_prompt || "",
      usage: result.usage || null,
      model: imageModel,
      mode,
      version: appVersion
    });
  } catch (error) {
    sendJson(response, 502, { error: error.message || "Could not connect to the image generation service.", prompt });
  }
}

async function serveStatic(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const requestedPath = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = normalize(join(publicDir, requestedPath));

  if (!filePath.startsWith(publicDir)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const content = await readFile(filePath);
    response.writeHead(200, { "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream", "Cache-Control": "no-store" });
    response.end(content);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}

const server = createServer((request, response) => {
  if (request.method === "GET" && request.url === "/api/health") {
    sendJson(response, 200, { ok: true, version: appVersion });
    return;
  }

  if (request.method === "POST" && request.url === "/api/generate") {
    generateImages(request, response);
    return;
  }

  if (request.method === "GET") {
    serveStatic(request, response);
    return;
  }

  response.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Method not allowed");
});

server.listen(port, host, () => {
  console.log(`AI deskmat pattern studio ${appVersion} running at http://${host}:${port}`);
  console.log(`LAN users can visit http://<this-computer-lan-ip>:${port}`);
});
