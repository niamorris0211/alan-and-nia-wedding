const crypto = require("node:crypto");
const {
  createStoragePath,
  getPhotoStorage,
  sendJson,
  setCorsHeaders,
  validateUploadInput,
} = require("../lib/photo-storage");

module.exports = async function handler(request, response) {
  setCorsHeaders(request, response, "POST");

  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    return response.end();
  }

  if (request.method !== "POST") {
    return sendJson(response, 405, { error: "Method not allowed" });
  }

  const validated = validateUploadInput(request.body);

  if (validated.error) {
    return sendJson(response, 400, { error: validated.error });
  }

  try {
    const { bucket, client } = getPhotoStorage();
    const uploadedAt = new Date().toISOString();
    const records = validated.files.map((file) => ({
      id: crypto.randomUUID(),
      storage_path: createStoragePath(file.name),
      original_name: file.name,
      uploader_name: validated.uploaderName,
      mime_type: file.type,
      size_bytes: file.size,
      uploaded_at: uploadedAt,
      completed: false,
    }));

    const signedUploads = await Promise.all(
      records.map(async (record) => {
        const { data, error } = await client.storage
          .from(bucket)
          .createSignedUploadUrl(record.storage_path);

        if (error) {
          throw error;
        }

        return {
          id: record.id,
          path: record.storage_path,
          signedUrl: data.signedUrl,
          token: data.token,
        };
      })
    );

    const { error: insertError } = await client
      .from("wedding_photo_uploads")
      .insert(records);

    if (insertError) {
      throw insertError;
    }

    return sendJson(response, 200, { uploads: signedUploads });
  } catch (error) {
    console.error("Photo upload initialisation failed.", error);
    return sendJson(response, 500, {
      error: "The upload could not be started. Please try again.",
    });
  }
};
