const {
  getPhotoStorage,
  sendJson,
  setCorsHeaders,
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

  const uploadIds = Array.isArray(request.body?.uploadIds)
    ? request.body.uploadIds.map(String).filter(Boolean)
    : [];

  if (!uploadIds.length || uploadIds.length > 100) {
    return sendJson(response, 400, { error: "Invalid completed upload list." });
  }

  try {
    const { bucket, client } = getPhotoStorage();
    const { data: records, error: selectError } = await client
      .from("wedding_photo_uploads")
      .select("id,storage_path")
      .in("id", uploadIds);

    if (selectError || records.length !== uploadIds.length) {
      throw selectError || new Error("Upload records were not found");
    }

    await Promise.all(
      records.map(async (record) => {
        const { error } = await client.storage
          .from(bucket)
          .info(record.storage_path);

        if (error) {
          throw error;
        }
      })
    );

    const { error: updateError } = await client
      .from("wedding_photo_uploads")
      .update({ completed: true })
      .in("id", uploadIds);

    if (updateError) {
      throw updateError;
    }

    return sendJson(response, 200, {
      success: true,
      uploadedCount: uploadIds.length,
    });
  } catch (error) {
    console.error("Photo upload confirmation failed.", error);
    return sendJson(response, 500, {
      error: "The upload could not be confirmed. Please try again.",
    });
  }
};
