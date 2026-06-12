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
const photoUploadButton = document.getElementById("photo-upload-button");
const photoUploadResult = document.getElementById("photo-upload-result");
const photoUploadProgress = document.getElementById("photo-upload-progress");
const photoUploadProgressLabel = document.getElementById(
  "photo-upload-progress-label"
);
const photoUploadProgressPercent = document.getElementById(
  "photo-upload-progress-percent"
);
const photoUploadProgressTrack = document.getElementById(
  "photo-upload-progress-track"
);
const photoUploadProgressBar = document.getElementById(
  "photo-upload-progress-bar"
);
const photoPickerPreparing = document.getElementById(
  "photo-picker-preparing"
);
const photoIphoneNote = document.getElementById("photo-iphone-note");
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
let isPhotoPickerOpen = false;
let pickerPreparingTimer;

function isAppleMobile() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function showPickerPreparing() {
  if (!isPhotoPickerOpen || !photoPickerPreparing) {
    return;
  }

  photoPickerPreparing.hidden = false;
  clearTimeout(pickerPreparingTimer);
  pickerPreparingTimer = window.setTimeout(() => {
    hidePickerPreparing();
  }, 30000);
}

function hidePickerPreparing() {
  clearTimeout(pickerPreparingTimer);
  isPhotoPickerOpen = false;

  if (photoPickerPreparing) {
    photoPickerPreparing.hidden = true;
  }
}

function setUploadProgress(percent, label) {
  const safePercent = Math.max(0, Math.min(100, Math.round(percent)));
  photoUploadProgress.hidden = false;
  photoUploadProgressLabel.textContent = label;
  photoUploadProgressPercent.textContent = `${safePercent}%`;
  photoUploadProgressTrack.setAttribute("aria-valuenow", safePercent);
  photoUploadProgressBar.style.width = `${safePercent}%`;
}

function resetUploadProgress() {
  photoUploadProgress.hidden = true;
  setUploadProgress(0, "Preparing upload...");
  photoUploadProgress.hidden = true;
}

function inferBrowserMediaType(file) {
  if (file.type?.startsWith("image/") || file.type?.startsWith("video/")) {
    return file.type;
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  const inferredTypes = {
    avif: "image/avif",
    heic: "image/heic",
    heif: "image/heif",
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    m4v: "video/x-m4v",
    mov: "video/quicktime",
    mp4: "video/mp4",
    webm: "video/webm",
  };

  return inferredTypes[extension] || file.type || "";
}

async function readJsonResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    throw new Error(
      "The photo service could not be reached. Please refresh and try again."
    );
  }

  return response.json();
}

function updateFileSummary() {
  const files = Array.from(photoFiles?.files || []);
  const { validFiles, skippedFiles } = classifyFiles(files);
  const count = validFiles.length;

  if (!photoFileSummary) {
    return;
  }

  const filePicker = document.querySelector(".photo-file-picker");

  if (count && skippedFiles.length) {
    photoFileSummary.textContent = `✓ ${count} ready · ${skippedFiles.length} ${
      skippedFiles.length === 1 ? "file" : "files"
    } will be skipped`;
  } else if (count) {
    photoFileSummary.textContent = `✓ ${count} ${
      count === 1 ? "file" : "files"
    } ready to upload`;
  } else if (skippedFiles.length) {
    photoFileSummary.textContent =
      skippedFiles[0].reason || "No uploadable files selected";
  } else {
    photoFileSummary.textContent =
      "Select up to 100 files from your phone or computer";
  }

  filePicker?.classList.toggle("has-files", count > 0);
  filePicker?.classList.toggle("has-file-error", count === 0 && files.length > 0);

  if (photoUploadButton) {
    photoUploadButton.disabled = count === 0;
    photoUploadButton.textContent = count
      ? `Upload ${count} ${count === 1 ? "file" : "files"}`
      : "Add to the shared album";
  }
}

function classifyFiles(files) {
  const validFiles = [];
  const skippedFiles = [];

  files.forEach((file) => {
    const mediaType = inferBrowserMediaType(file);

    if (file.size > MAX_FILE_SIZE_BYTES) {
      skippedFiles.push({
        file,
        reason: `${file.name} is over the 50 MB limit`,
      });
    } else if (!mediaType.match(/^(image|video)\//)) {
      skippedFiles.push({
        file,
        reason: `${file.name} isn’t recognised as a photo or video`,
      });
    } else {
      validFiles.push(file);
    }
  });

  return { validFiles, skippedFiles };
}

function handleFileSelection() {
  hidePickerPreparing();
  updateFileSummary();
  photoFormFeedback.textContent = "";

  if (photoFiles?.files.length) {
    window.setTimeout(() => {
      photoUploadButton?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      photoUploadButton?.focus({ preventScroll: true });
    }, 150);
  }
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
  setUploadProgress(5, "Preparing your upload...");
  const initResponse = await fetch(`${photoApiOrigin}/api/photos-upload-init`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uploaderName,
      files: files.map((file) => ({
        name: file.name,
        type: inferBrowserMediaType(file),
        size: file.size,
      })),
    }),
  });
  const initResult = await readJsonResponse(initResponse);

  if (!initResponse.ok) {
    throw new Error(initResult.error || "The upload could not be started.");
  }

  const successfulUploadIds = [];
  const failedFiles = [];

  for (let index = 0; index < files.length; index += 1) {
    const startPercent = 10 + (index / files.length) * 80;
    setUploadProgress(
      startPercent,
      `Uploading ${index + 1} of ${files.length}...`
    );

    try {
      await uploadToSignedUrl(initResult.uploads[index], files[index]);
      successfulUploadIds.push(initResult.uploads[index].id);
      setUploadProgress(
        10 + ((index + 1) / files.length) * 80,
        `Uploaded ${index + 1} of ${files.length}`
      );
    } catch (error) {
      console.error(`Upload failed for ${files[index].name}.`, error);
      failedFiles.push({
        file: files[index],
        reason: `${files[index].name} could not be uploaded`,
      });
    }
  }

  if (!successfulUploadIds.length) {
    throw new Error("None of the selected files could be uploaded.");
  }

  const completeResponse = await fetch(
    `${photoApiOrigin}/api/photos-upload-complete`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uploadIds: successfulUploadIds,
      }),
    }
  );
  setUploadProgress(94, "Finishing your shared album...");
  const completeResult = await readJsonResponse(completeResponse);

  if (!completeResponse.ok) {
    throw new Error(
      completeResult.error || "The upload could not be confirmed."
    );
  }

  setUploadProgress(100, "Upload complete");
  return {
    uploadedCount: successfulUploadIds.length,
    failedFiles,
  };
}

async function uploadLocally(uploaderName, files) {
  setUploadProgress(10, "Uploading your files...");
  const formData = new FormData();
  formData.append("uploaderName", uploaderName);
  files.forEach((file) => formData.append("photos", file));

  const response = await fetch("/api/photos/upload", {
    method: "POST",
    body: formData,
  });
  const result = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(result.error || "The upload could not be completed.");
  }

  setUploadProgress(100, "Upload complete");
  return {
    uploadedCount: result.uploadedCount,
    failedFiles: [],
  };
}

photoFiles?.addEventListener("click", () => {
  isPhotoPickerOpen = true;
});
photoFiles?.addEventListener("change", handleFileSelection);
photoFiles?.addEventListener("input", handleFileSelection);
photoFiles?.addEventListener("cancel", hidePickerPreparing);
window.addEventListener("focus", () => {
  showPickerPreparing();
  window.setTimeout(updateFileSummary, 250);
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    showPickerPreparing();
  }
});

photoUploadForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const selectedFiles = Array.from(photoFiles?.files || []);
  const { validFiles: files, skippedFiles } = classifyFiles(selectedFiles);
  const uploaderName = document
    .getElementById("photo-uploader-name")
    ?.value.trim();

  if (!selectedFiles.length) {
    photoFormFeedback.textContent =
      "Please choose at least one photo or video.";
    return;
  }

  if (selectedFiles.length > 100) {
    photoFormFeedback.textContent =
      "Please choose no more than 100 files at once.";
    return;
  }

  if (!files.length) {
    photoFormFeedback.textContent =
      skippedFiles[0]?.reason || "Please choose a photo or video under 50 MB.";
    return;
  }

  const submitButton = photoUploadForm.querySelector('button[type="submit"]');
  photoFormFeedback.textContent = "Preparing your photos...";
  setUploadProgress(2, "Preparing your photos...");
  submitButton.disabled = true;
  submitButton.textContent = "Uploading...";

  try {
    const result = useLocalDisk
      ? await uploadLocally(uploaderName, files)
      : await uploadOnline(uploaderName, files);
    const allSkippedFiles = [...skippedFiles, ...result.failedFiles];

    photoUploadForm.reset();
    updateFileSummary();
    photoUploadForm.hidden = true;
    photoUploadSuccess.hidden = false;
    photoUploadResult.textContent = allSkippedFiles.length
      ? `${result.uploadedCount} ${
          result.uploadedCount === 1 ? "memory was" : "memories were"
        } added. ${allSkippedFiles.length} ${
          allSkippedFiles.length === 1 ? "file was" : "files were"
        } skipped: ${allSkippedFiles
          .map((item) => item.file.name)
          .join(", ")}.`
      : `${result.uploadedCount} ${
          result.uploadedCount === 1 ? "memory was" : "memories were"
        } added successfully. Opening the shared gallery...`;

    window.setTimeout(() => {
      window.location.assign(
        isLocalPhotoServer ? "/photos-gallery" : "/photos-gallery/"
      );
    }, allSkippedFiles.length ? 2500 : 1200);
  } catch (error) {
    console.error("Photo upload failed.", error);
    photoFormFeedback.textContent =
      error.message || "Something went wrong — please try again.";
    photoUploadProgressLabel.textContent = "Upload paused";
  } finally {
    updateFileSummary();
  }
});

photoUploadMore?.addEventListener("click", () => {
  photoUploadSuccess.hidden = true;
  photoUploadForm.hidden = false;
  photoFormFeedback.textContent = "";
  photoUploadResult.textContent = "";
  resetUploadProgress();
  updateFileSummary();
  document.getElementById("photo-uploader-name")?.focus();
});

updateFileSummary();

if (photoIphoneNote && isAppleMobile()) {
  photoIphoneNote.hidden = false;
}
