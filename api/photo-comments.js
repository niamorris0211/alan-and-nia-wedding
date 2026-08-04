const crypto = require("node:crypto");
const {
  getPhotoStorage,
  sendJson,
  setCorsHeaders,
} = require("../lib/photo-storage");

const COMMENTS_PATH = "gallery-comments/comments.json";
const MAX_NAME_LENGTH = 80;
const MAX_MESSAGE_LENGTH = 500;

function asText(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function isNotFoundStorageError(error) {
  return (
    error?.statusCode === "404" ||
    error?.status === 404 ||
    /not found|does not exist|object not found/i.test(error?.message || "")
  );
}

function normaliseComment(comment) {
  const id = asText(comment?.id, 80);
  const photoId = asText(comment?.photoId, 80);
  const name = asText(comment?.name, MAX_NAME_LENGTH);
  const message = asText(comment?.message, MAX_MESSAGE_LENGTH);
  const createdAt = asText(comment?.createdAt, 40);

  if (!id || !photoId || !name || !message || !createdAt) {
    return null;
  }

  return { id, photoId, name, message, createdAt };
}

async function readComments(client, bucket) {
  const { data, error } = await client.storage
    .from(bucket)
    .download(COMMENTS_PATH);

  if (error) {
    if (isNotFoundStorageError(error)) {
      return [];
    }

    throw error;
  }

  const parsed = JSON.parse(await data.text());
  return Array.isArray(parsed)
    ? parsed.map(normaliseComment).filter(Boolean)
    : [];
}

async function writeComments(client, bucket, comments) {
  const { error } = await client.storage.from(bucket).upload(
    COMMENTS_PATH,
    Buffer.from(`${JSON.stringify(comments, null, 2)}\n`, "utf8"),
    {
      contentType: "image/svg+xml",
      upsert: true,
    }
  );

  if (error) {
    throw error;
  }
}

function groupComments(comments) {
  return comments.reduce((grouped, comment) => {
    if (!grouped[comment.photoId]) {
      grouped[comment.photoId] = [];
    }

    grouped[comment.photoId].push(comment);
    return grouped;
  }, {});
}

function countComments(grouped) {
  return Object.fromEntries(
    Object.entries(grouped).map(([photoId, comments]) => [
      photoId,
      comments.length,
    ])
  );
}

module.exports = async function handler(request, response) {
  setCorsHeaders(request, response, "GET, POST");

  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    return response.end();
  }

  if (!["GET", "POST"].includes(request.method)) {
    return sendJson(response, 405, { error: "Method not allowed" });
  }

  try {
    const { bucket, client } = getPhotoStorage();
    const comments = await readComments(client, bucket);

    if (request.method === "GET") {
      const grouped = groupComments(comments);
      return sendJson(response, 200, {
        commentsByPhoto: grouped,
        counts: countComments(grouped),
      });
    }

    const photoId = asText(request.body?.photoId, 80);
    const name = asText(request.body?.name, MAX_NAME_LENGTH);
    const message = asText(request.body?.message, MAX_MESSAGE_LENGTH);

    if (!photoId || !name || !message) {
      return sendJson(response, 400, {
        error: "Please add your name and a comment.",
      });
    }

    const { data: photo, error: photoError } = await client
      .from("wedding_photo_uploads")
      .select("id")
      .eq("id", photoId)
      .eq("completed", true)
      .maybeSingle();

    if (photoError) {
      throw photoError;
    }

    if (!photo) {
      return sendJson(response, 404, { error: "Photo not found." });
    }

    const comment = {
      id: crypto.randomUUID(),
      photoId,
      name,
      message,
      createdAt: new Date().toISOString(),
    };

    const updatedComments = [comment, ...comments];
    await writeComments(client, bucket, updatedComments);

    return sendJson(response, 201, { comment });
  } catch (error) {
    console.error("Photo comments request failed.", error);
    return sendJson(response, 500, {
      error: "Comments could not be loaded. Please try again.",
    });
  }
};
