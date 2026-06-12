const path = require("node:path");
const {
  getPhotoStorage,
  sendJson,
  setCorsHeaders,
} = require("../lib/photo-storage");

module.exports = async function handler(request, response) {
  setCorsHeaders(request, response, "GET");

  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    return response.end();
  }

  if (request.method !== "GET") {
    return sendJson(response, 405, { error: "Method not allowed" });
  }

  try {
    const { bucket, client } = getPhotoStorage();
    const { data: records, error } = await client
      .from("wedding_photo_uploads")
      .select("id,storage_path,uploader_name,mime_type,uploaded_at")
      .eq("completed", true)
      .order("uploaded_at", { ascending: false });

    if (error) {
      throw error;
    }

    // The bucket stays private. Guests receive temporary read-only URLs;
    // production should add moderation/reporting before wider public sharing.
    const items = await Promise.all(
      records.map(async (record) => {
        const extension = path.extname(record.storage_path).toLowerCase();
        const downloadName = `nia-alan-wedding-memory${extension}`;
        const [preview, download] = await Promise.all([
          client.storage.from(bucket).createSignedUrl(record.storage_path, 3600),
          client.storage
            .from(bucket)
            .createSignedUrl(record.storage_path, 3600, {
              download: downloadName,
            }),
        ]);

        if (preview.error || download.error) {
          throw preview.error || download.error;
        }

        return {
          id: record.id,
          uploaderName: record.uploader_name || "",
          mimeType: record.mime_type,
          uploadedAt: record.uploaded_at,
          mediaUrl: preview.data.signedUrl,
          downloadUrl: download.data.signedUrl,
        };
      })
    );

    return sendJson(response, 200, { items });
  } catch (error) {
    console.error("Public photo gallery failed.", error);
    return sendJson(response, 500, {
      error: "The shared gallery could not be loaded.",
    });
  }
};
