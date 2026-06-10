const {
  getPhotoStorage,
  hasValidAdminPassword,
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

  if (!hasValidAdminPassword(request)) {
    return sendJson(response, 401, { error: "Incorrect admin password." });
  }

  try {
    const { bucket, client } = getPhotoStorage();
    const { data: records, error } = await client
      .from("wedding_photo_uploads")
      .select(
        "id,storage_path,original_name,uploader_name,mime_type,size_bytes,uploaded_at"
      )
      .eq("completed", true)
      .order("uploaded_at", { ascending: false });

    if (error) {
      throw error;
    }

    const photos = await Promise.all(
      records.map(async (record) => {
        const [preview, download] = await Promise.all([
          client.storage.from(bucket).createSignedUrl(record.storage_path, 3600),
          client.storage
            .from(bucket)
            .createSignedUrl(record.storage_path, 3600, {
              download: record.original_name,
            }),
        ]);

        if (preview.error || download.error) {
          throw preview.error || download.error;
        }

        return {
          id: record.id,
          originalName: record.original_name,
          uploaderName: record.uploader_name,
          mimeType: record.mime_type,
          size: record.size_bytes,
          uploadedAt: record.uploaded_at,
          previewUrl: preview.data.signedUrl,
          downloadUrl: download.data.signedUrl,
        };
      })
    );

    return sendJson(response, 200, { photos });
  } catch (error) {
    console.error("Photo admin gallery failed.", error);
    return sendJson(response, 500, {
      error: "Uploads could not be loaded.",
    });
  }
};
