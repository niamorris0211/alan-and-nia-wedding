const PHOTO_API_ORIGIN = "https://alan-and-nia-wedding.vercel.app";
const isLocalPhotoServer =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1" ||
  /^192\.168\./.test(window.location.hostname);
const useLocalDisk =
  isLocalPhotoServer &&
  new URLSearchParams(window.location.search).get("storage") === "local";
const photoApiOrigin = isLocalPhotoServer ? "" : PHOTO_API_ORIGIN;

const photoUploadForm = document.getElementById("photo-upload-form");
const photoFiles = document.getElementById("photo-files");
const photoFileSummary = document.getElementById("photo-file-summary");
const photoFormFeedback = document.getElementById("photo-form-feedback");
const photoUploadSuccess = document.getElementById("photo-upload-success");
const photoUploadMore = document.getElementById("photo-upload-more");

function updateFileSummary() {
  const count = photoFiles?.files.length || 0;

  if (!photoFileSummary) {
    return;
  }

  photoFileSummary.textContent = count
    ? `${count} ${count === 1 ? "file" : "files"} selected`
    : "Select up to 100 files from your phone or computer";
}

async function uploadToSignedUrl(upload, file) {
  const body = new FormData();
  body.append("cacheControl", "3600");
  body.append("", file);

  const response = await fetch(upload.signedUrl, {
    method: "PUT",
    headers: { "x-upsert": "false" },
    body,
  });

  if (!response.ok) {
    throw new Error(`Could not upload ${file.name}.`);
  }
}

async function uploadOnline(uploaderName, files) {
  const initResponse = await fetch(`${photoApiOrigin}/api/photos-upload-init`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uploaderName,
      files: files.map((file) => ({
        name: file.name,
        type: file.type,
        size: file.size,
      })),
    }),
  });
  const initResult = await initResponse.json();

  if (!initResponse.ok) {
    throw new Error(initResult.error || "The upload could not be started.");
  }

  for (let index = 0; index < files.length; index += 1) {
    photoFormFeedback.textContent = `Uploading ${index + 1} of ${
      files.length
    }...`;
    await uploadToSignedUrl(initResult.uploads[index], files[index]);
  }

  const completeResponse = await fetch(
    `${photoApiOrigin}/api/photos-upload-complete`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uploadIds: initResult.uploads.map((upload) => upload.id),
      }),
    }
  );
  const completeResult = await completeResponse.json();

  if (!completeResponse.ok) {
    throw new Error(
      completeResult.error || "The upload could not be confirmed."
    );
  }
}

async function uploadLocally(uploaderName, files) {
  const formData = new FormData();
  formData.append("uploaderName", uploaderName);
  files.forEach((file) => formData.append("photos", file));

  const response = await fetch("/api/photos/upload", {
    method: "POST",
    body: formData,
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "The upload could not be completed.");
  }
}

photoFiles?.addEventListener("change", updateFileSummary);

photoUploadForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const files = Array.from(photoFiles?.files || []);
  const uploaderName = document
    .getElementById("photo-uploader-name")
    ?.value.trim();

  if (!uploaderName) {
    photoFormFeedback.textContent = "Please add your name before uploading.";
    document.getElementById("photo-uploader-name")?.focus();
    return;
  }

  if (!files.length) {
    photoFormFeedback.textContent =
      "Please choose at least one photo or video.";
    return;
  }

  if (files.length > 100) {
    photoFormFeedback.textContent =
      "Please choose no more than 100 files at once.";
    return;
  }

  const submitButton = photoUploadForm.querySelector('button[type="submit"]');
  photoFormFeedback.textContent = "Preparing your photos...";
  submitButton.disabled = true;
  submitButton.textContent = "Uploading...";

  try {
    if (useLocalDisk) {
      await uploadLocally(uploaderName, files);
    } else {
      await uploadOnline(uploaderName, files);
    }

    photoUploadForm.reset();
    updateFileSummary();
    photoUploadForm.hidden = true;
    photoUploadSuccess.hidden = false;
  } catch (error) {
    photoFormFeedback.textContent =
      error.message || "Something went wrong. Please try again.";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Upload photos";
  }
});

photoUploadMore?.addEventListener("click", () => {
  photoUploadSuccess.hidden = true;
  photoUploadForm.hidden = false;
  photoFormFeedback.textContent = "";
  document.getElementById("photo-uploader-name")?.focus();
});
