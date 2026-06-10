const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const express = require("express");
const multer = require("multer");
const dotenv = require("dotenv");
const photosUploadInit = require("./api/photos-upload-init");
const photosUploadComplete = require("./api/photos-upload-complete");
const photosAdmin = require("./api/photos-admin");

dotenv.config({ path: path.join(__dirname, ".env.local"), quiet: true });
dotenv.config({ path: path.join(__dirname, ".env"), quiet: true });

const DEFAULT_PORT = 8000;
const DEFAULT_HOST = "127.0.0.1";
const MAX_FILES = 100;
const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function readMetadata(metadataPath) {
  try {
    const data = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
}

function writeMetadata(metadataPath, records) {
  const temporaryPath = `${metadataPath}.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(records, null, 2)}\n`);
  fs.renameSync(temporaryPath, metadataPath);
}

function safeExtension(originalName) {
  const extension = path.extname(originalName).toLowerCase();
  return /^[.][a-z0-9]{1,10}$/.test(extension) ? extension : "";
}

function safeDownloadName(name) {
  const cleaned = path.basename(name).replace(/[\r\n"]/g, "_").trim();
  return cleaned || "wedding-photo";
}

function getLocalNetworkUrls(port) {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter(
      (address) =>
        address &&
        address.family === "IPv4" &&
        !address.internal
    )
    .map((address) => `http://${address.address}:${port}`);
}

function createApp({
  publicRoot = __dirname,
  uploadRoot = path.join(__dirname, "uploads", "wedding-photos"),
} = {}) {
  ensureDirectory(uploadRoot);
  const metadataPath = path.join(uploadRoot, "metadata.json");
  const app = express();
  app.use(express.json({ limit: "1mb" }));
  const storage = multer.diskStorage({
    destination: uploadRoot,
    filename(request, file, callback) {
      callback(
        null,
        `${Date.now()}-${crypto.randomUUID()}${safeExtension(file.originalname)}`
      );
    },
  });
  const upload = multer({
    storage,
    limits: {
      files: MAX_FILES,
      fileSize: MAX_FILE_SIZE_BYTES,
    },
    fileFilter(request, file, callback) {
      const allowed =
        file.mimetype.startsWith("image/") ||
        file.mimetype.startsWith("video/");

      if (!allowed) {
        return callback(new multer.MulterError("LIMIT_UNEXPECTED_FILE"));
      }

      return callback(null, true);
    },
  });

  // Local-only safety: uploaded files are never exposed by the static server.
  app.use("/uploads", (request, response) => {
    response.status(404).send("Not found");
  });

  app.get("/photos", (request, response) => {
    response.sendFile(path.join(publicRoot, "photos.html"));
  });

  app.get("/photos-admin", (request, response) => {
    response.sendFile(path.join(publicRoot, "photos-admin.html"));
  });

  app.post(
    "/api/photos/upload",
    upload.array("photos", MAX_FILES),
    (request, response) => {
      const files = request.files || [];

      if (!files.length) {
        return response.status(400).json({
          error: "Please choose at least one photo or video.",
        });
      }

      const uploaderName = String(request.body.uploaderName || "")
        .trim()
        .slice(0, 120);

      if (!uploaderName) {
        files.forEach((file) => fs.rmSync(file.path, { force: true }));
        return response.status(400).json({
          error: "Please add your name before uploading.",
        });
      }

      const uploadedAt = new Date().toISOString();
      const newRecords = files.map((file) => ({
        id: crypto.randomUUID(),
        storedName: file.filename,
        originalName: file.originalname,
        uploaderName,
        uploadedAt,
        mimeType: file.mimetype,
        size: file.size,
      }));

      try {
        const existingRecords = readMetadata(metadataPath);
        writeMetadata(metadataPath, [...newRecords, ...existingRecords]);
        return response.status(201).json({
          success: true,
          uploadedCount: newRecords.length,
        });
      } catch (error) {
        files.forEach((file) => fs.rmSync(file.path, { force: true }));
        return response.status(500).json({
          error: "The upload could not be saved. Please try again.",
        });
      }
    }
  );

  // These are the same Supabase-backed handlers used in production. Keeping
  // them mounted locally lets us test the real storage flow before deployment.
  app.all("/api/photos-upload-init", photosUploadInit);
  app.all("/api/photos-upload-complete", photosUploadComplete);
  app.all("/api/photos-admin", photosAdmin);

  app.get("/api/photos", (request, response) => {
    const records = readMetadata(metadataPath).map(
      ({ storedName, ...record }) => ({
        ...record,
        previewUrl: `/api/photos/files/${encodeURIComponent(record.id)}`,
      })
    );
    response.json({ photos: records });
  });

  app.get("/api/photos/files/:id", (request, response) => {
    const record = readMetadata(metadataPath).find(
      (item) => item.id === request.params.id
    );

    if (!record) {
      return response.status(404).json({ error: "Upload not found" });
    }

    response.setHeader("Cache-Control", "private, no-store");
    response.type(record.mimeType);
    return response.sendFile(path.join(uploadRoot, record.storedName));
  });

  app.get("/api/photos/download/:id", (request, response) => {
    const record = readMetadata(metadataPath).find(
      (item) => item.id === request.params.id
    );

    if (!record) {
      return response.status(404).json({ error: "Upload not found" });
    }

    return response.download(
      path.join(uploadRoot, record.storedName),
      safeDownloadName(record.originalName)
    );
  });

  app.get("/api/photos/download-all", async (request, response, next) => {
    const records = readMetadata(metadataPath);

    if (!records.length) {
      return response.status(404).json({ error: "There are no uploads yet." });
    }

    try {
      const { ZipArchive } = await import("archiver");

      response.attachment(
        `nia-alan-wedding-photos-${new Date().toISOString().slice(0, 10)}.zip`
      );
      const archive = new ZipArchive({ zlib: { level: 6 } });

      archive.on("error", next);
      archive.pipe(response);

      const usedNames = new Set();
      records.forEach((record, index) => {
        const originalName = safeDownloadName(record.originalName);
        let archiveName = originalName;

        if (usedNames.has(archiveName.toLowerCase())) {
          const extension = path.extname(originalName);
          const basename = path.basename(originalName, extension);
          archiveName = `${basename}-${index + 1}${extension}`;
        }

        usedNames.add(archiveName.toLowerCase());
        archive.file(path.join(uploadRoot, record.storedName), {
          name: archiveName,
        });
      });

      return archive.finalize();
    } catch (error) {
      return next(error);
    }
  });

  app.use(express.static(publicRoot, { index: "index.html" }));

  app.use((error, request, response, next) => {
    if (error instanceof multer.MulterError) {
      const message =
        error.code === "LIMIT_FILE_SIZE"
          ? "One of the files is larger than 100 MB."
          : error.code === "LIMIT_FILE_COUNT"
            ? `Please upload no more than ${MAX_FILES} files at once.`
            : "Only photo and video files can be uploaded.";
      return response.status(400).json({ error: message });
    }

    console.error("Local photo upload failed.", error);
    return response.status(500).json({
      error: "Something went wrong while uploading. Please try again.",
    });
  });

  return app;
}

if (require.main === module) {
  const app = createApp({
    uploadRoot:
      process.env.PHOTO_UPLOAD_DIR ||
      path.join(__dirname, "uploads", "wedding-photos"),
  });
  const port = Number(process.env.PORT) || DEFAULT_PORT;
  const host = process.env.PHOTO_SERVER_HOST || DEFAULT_HOST;

  // TODO production: use authenticated cloud storage before changing this
  // into a publicly reachable service. 0.0.0.0 is only for trusted home Wi-Fi.
  app.listen(port, host, () => {
    console.log(`Wedding site running at http://localhost:${port}`);
    console.log(`Photo upload: http://localhost:${port}/photos`);
    console.log(`Photo admin:  http://localhost:${port}/photos-admin`);

    if (
      !process.env.SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY ||
      !process.env.PHOTO_ADMIN_PASSWORD
    ) {
      console.log(
        "\nSupabase photo storage needs the values listed in .env.example " +
          "added to .env.local."
      );
    }

    if (host === "0.0.0.0") {
      console.log("\nPhone links on this Wi-Fi:");
      getLocalNetworkUrls(port).forEach((origin) => {
        console.log(`Photo upload: ${origin}/photos`);
        console.log(`Photo admin:  ${origin}/photos-admin`);
      });
      console.log("\nOnly use this option on a trusted private network.");
    }
  });
}

module.exports = {
  createApp,
};
