const crypto = require("node:crypto");
const path = require("node:path");
const WebSocket = require("ws");
const { createClient } = require("@supabase/supabase-js");

const MAX_FILES = 100;
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const DEFAULT_BUCKET = "wedding-photos";
const ALLOWED_ORIGINS = new Set([
  "https://www.alanandnia.co.uk",
  "https://alanandnia.co.uk",
]);

function sendJson(response, statusCode, body) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(body));
}

function setCorsHeaders(request, response, methods) {
  const origin = request.headers.origin;

  const isLocalOrigin =
    /^http:\/\/localhost:\d+$/.test(origin || "") ||
    /^http:\/\/127\.0\.0\.1:\d+$/.test(origin || "");

  if (ALLOWED_ORIGINS.has(origin) || isLocalOrigin) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
  }

  response.setHeader("Access-Control-Allow-Methods", `${methods}, OPTIONS`);
  response.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, X-Photo-Admin-Password"
  );
}

function getPhotoStorage() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase configuration");
  }

  return {
    bucket: process.env.PHOTO_STORAGE_BUCKET || DEFAULT_BUCKET,
    client: createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      realtime: {
        transport: WebSocket,
      },
    }),
  };
}

function asText(value, maxLength = 200) {
  return String(value || "").trim().slice(0, maxLength);
}

function isAllowedMediaType(type) {
  return type.startsWith("image/") || type.startsWith("video/");
}

function inferMediaType(filename, suppliedType) {
  const type = asText(suppliedType, 120).toLowerCase();

  if (isAllowedMediaType(type)) {
    return type;
  }

  const extension = path.extname(filename).toLowerCase();
  const inferredTypes = {
    ".avif": "image/avif",
    ".heic": "image/heic",
    ".heif": "image/heif",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".m4v": "video/x-m4v",
    ".mov": "video/quicktime",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
  };

  return inferredTypes[extension] || type;
}

function validateUploadInput(input) {
  const uploaderName = asText(input?.uploaderName, 120);
  const files = Array.isArray(input?.files) ? input.files : [];

  if (!files.length) {
    return { error: "Please choose at least one photo or video." };
  }

  if (files.length > MAX_FILES) {
    return { error: `Please upload no more than ${MAX_FILES} files at once.` };
  }

  const normalisedFiles = [];

  for (const file of files) {
    const name = asText(file?.name, 240);
    const type = inferMediaType(name, file?.type);
    const size = Number(file?.size);

    if (!name || !type || !Number.isFinite(size) || size <= 0) {
      return { error: "One of the selected files is invalid." };
    }

    if (!isAllowedMediaType(type)) {
      return { error: "Only photo and video files can be uploaded." };
    }

    if (size > MAX_FILE_SIZE_BYTES) {
      return { error: "One of the files is larger than 50 MB." };
    }

    normalisedFiles.push({ name, type, size });
  }

  return { uploaderName, files: normalisedFiles };
}

function safeExtension(filename) {
  const extension = path.extname(filename).toLowerCase();
  return /^[.][a-z0-9]{1,10}$/.test(extension) ? extension : "";
}

function createStoragePath(filename, now = new Date()) {
  return [
    "uploads",
    now.toISOString().slice(0, 10),
    `${crypto.randomUUID()}${safeExtension(filename)}`,
  ].join("/");
}

function timingSafePasswordMatches(provided, expected) {
  const providedBuffer = Buffer.from(String(provided || ""));
  const expectedBuffer = Buffer.from(String(expected || ""));

  return (
    expectedBuffer.length > 0 &&
    providedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

function hasValidAdminPassword(request) {
  return timingSafePasswordMatches(
    request.headers["x-photo-admin-password"],
    process.env.PHOTO_ADMIN_PASSWORD
  );
}

module.exports = {
  MAX_FILES,
  createStoragePath,
  getPhotoStorage,
  hasValidAdminPassword,
  sendJson,
  setCorsHeaders,
  timingSafePasswordMatches,
  validateUploadInput,
};
