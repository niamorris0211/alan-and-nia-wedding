const PHOTO_API_ORIGIN = "https://alan-and-nia-wedding.vercel.app";
const isLocalPhotoServer =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1" ||
  /^192\.168\./.test(window.location.hostname);
const useLocalDisk =
  isLocalPhotoServer &&
  new URLSearchParams(window.location.search).get("storage") === "local";
const photoApiOrigin = isLocalPhotoServer ? "" : PHOTO_API_ORIGIN;

const photoAdminGrid = document.getElementById("photo-admin-grid");
const photoAdminFeedback = document.getElementById("photo-admin-feedback");
const photoDownloadAll = document.getElementById("photo-download-all");
const photoAdminLogin = document.getElementById("photo-admin-login");
const photoAdminContent = document.getElementById("photo-admin-content");
const photoAdminPassword = document.getElementById("photo-admin-password");

function formatUploadDate(uploadedAt) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(uploadedAt));
}

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function createPreview(photo) {
  if (photo.mimeType.startsWith("image/")) {
    const image = document.createElement("img");
    image.src = photo.previewUrl;
    image.alt = photo.originalName;
    image.loading = "lazy";
    return image;
  }

  if (photo.mimeType.startsWith("video/")) {
    const video = document.createElement("video");
    video.src = photo.previewUrl;
    video.controls = true;
    video.preload = "metadata";
    return video;
  }

  return null;
}

function renderUploads(photos) {
  photoAdminGrid.replaceChildren();

  if (!photos.length) {
    photoAdminFeedback.textContent = "No photos have been uploaded yet.";
    return;
  }

  photoAdminFeedback.textContent = `${photos.length} ${
    photos.length === 1 ? "upload" : "uploads"
  }`;

  if (useLocalDisk) {
    photoDownloadAll.hidden = false;
  }

  photos.forEach((photo) => {
    const card = document.createElement("article");
    card.className = "photo-admin-card";
    const preview = createPreview(photo);

    if (preview) {
      const previewWrap = document.createElement("div");
      previewWrap.className = "photo-admin-preview";
      previewWrap.appendChild(preview);
      card.appendChild(previewWrap);
    }

    const details = document.createElement("div");
    details.className = "photo-admin-details";
    const title = document.createElement("h2");
    title.textContent = photo.originalName;
    const uploader = document.createElement("p");
    uploader.textContent = `Uploaded by: ${
      photo.uploaderName || "Name not provided"
    }`;
    const date = document.createElement("p");
    date.textContent = formatUploadDate(photo.uploadedAt);
    const type = document.createElement("p");
    type.textContent = `${photo.mimeType} · ${formatFileSize(photo.size)}`;
    const download = document.createElement("a");
    download.className = "button button-secondary photo-download-button";
    download.href =
      photo.downloadUrl ||
      `/api/photos/download/${encodeURIComponent(photo.id)}`;
    download.download = photo.originalName;
    download.textContent = "Download";
    details.append(title, uploader, date, type, download);
    card.appendChild(details);
    photoAdminGrid.appendChild(card);
  });
}

async function loadUploads(password = "") {
  const endpoint = useLocalDisk
    ? "/api/photos"
    : `${photoApiOrigin}/api/photos-admin`;
  const response = await fetch(endpoint, {
    cache: "no-store",
    headers: password ? { "X-Photo-Admin-Password": password } : {},
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Uploads could not be loaded.");
  }

  photoAdminLogin.hidden = true;
  photoAdminContent.hidden = false;
  renderUploads(result.photos);
}

photoAdminLogin?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const password = photoAdminPassword.value;
  photoAdminFeedback.textContent = "Opening your gallery...";

  try {
    await loadUploads(password);
    sessionStorage.setItem("photoAdminPassword", password);
  } catch (error) {
    photoAdminFeedback.textContent =
      error.message || "Uploads could not be loaded.";
  }
});

if (useLocalDisk) {
  loadUploads().catch((error) => {
    photoAdminFeedback.textContent =
      error.message || "Uploads could not be loaded.";
  });
} else {
  const savedPassword = sessionStorage.getItem("photoAdminPassword");

  if (savedPassword) {
    loadUploads(savedPassword).catch(() => {
      sessionStorage.removeItem("photoAdminPassword");
      photoAdminLogin.hidden = false;
      photoAdminContent.hidden = true;
      photoAdminFeedback.textContent = "Please enter the admin password.";
    });
  } else {
    photoAdminFeedback.textContent = "Please enter the admin password.";
  }
}
