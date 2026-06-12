const PHOTO_API_ORIGIN = "https://alan-and-nia-wedding.vercel.app";
const isLocalPhotoServer =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1" ||
  /^192\.168\./.test(window.location.hostname);
const photoApiOrigin = isLocalPhotoServer ? "" : PHOTO_API_ORIGIN;

const galleryGrid = document.getElementById("photo-gallery-grid");
const galleryStatus = document.getElementById("photo-gallery-status");
const gallerySort = document.getElementById("photo-gallery-sort");
const filterButtons = Array.from(
  document.querySelectorAll("[data-filter]")
);
const lightbox = document.getElementById("photo-lightbox");
const lightboxStage = document.querySelector(".photo-lightbox-stage");
const lightboxMedia = document.getElementById("photo-lightbox-media");
const lightboxCaption = document.getElementById("photo-lightbox-caption");
const lightboxSaveHelp = document.getElementById(
  "photo-lightbox-save-help"
);
const lightboxPosition = document.getElementById(
  "photo-lightbox-position"
);
const lightboxDownload = document.getElementById("photo-lightbox-download");
const lightboxClose = document.getElementById("photo-lightbox-close");
const lightboxPrevious = document.getElementById("photo-lightbox-previous");
const lightboxNext = document.getElementById("photo-lightbox-next");
const selectToggle = document.getElementById("photo-select-toggle");
const selectionDownload = document.getElementById(
  "photo-selection-download"
);
const selectionCount = document.getElementById("photo-selection-count");
const downloadSelected = document.getElementById("photo-download-selected");
const selectionHelp = document.getElementById("photo-selection-help");
const saveAssistant = document.getElementById("photo-save-assistant");
const saveAssistantClose = document.getElementById(
  "photo-save-assistant-close"
);
const saveAssistantInstructions = document.getElementById(
  "photo-save-assistant-instructions"
);
const saveAssistantMedia = document.getElementById(
  "photo-save-assistant-media"
);
const saveAssistantMediaContent = document.getElementById(
  "photo-save-assistant-media-content"
);
const saveAssistantProgress = document.getElementById(
  "photo-save-assistant-progress"
);
const saveAssistantDots = document.getElementById(
  "photo-save-assistant-dots"
);
const saveAssistantOpen = document.getElementById("photo-save-assistant-open");
const saveAssistantDownload = document.getElementById(
  "photo-save-assistant-download"
);
const saveAssistantTitle = document.getElementById(
  "photo-save-assistant-title"
);
const videoSaveSteps = document.getElementById("photo-video-save-steps");
const saveAssistantPrevious = document.getElementById(
  "photo-save-assistant-previous"
);
const saveAssistantSlideNext = document.getElementById(
  "photo-save-assistant-slide-next"
);
const saveAssistantBack = document.getElementById("photo-save-assistant-back");
const saveAssistantNext = document.getElementById("photo-save-assistant-next");

let galleryItems = [];
let visibleItems = [];
let activeFilter = "all";
let activeIndex = 0;
let touchStartX = 0;
let selectionMode = false;
const selectedIds = new Set();
let saveQueue = [];
let saveQueueIndex = 0;
let saveAssistantTouchStartX = 0;

function getMediaKind(item) {
  return item.mimeType.startsWith("video/") ? "video" : "image";
}

function formatUploadDate(uploadedAt) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
  }).format(new Date(uploadedAt));
}

function getFileExtension(item) {
  const mediaUrl = new URL(item.mediaUrl);
  const pathnameExtension = mediaUrl.pathname.split(".").pop()?.toLowerCase();

  if (pathnameExtension && pathnameExtension.length <= 5) {
    return pathnameExtension;
  }

  const mimeExtensions = {
    "image/avif": "avif",
    "image/heic": "heic",
    "image/heif": "heif",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "video/webm": "webm",
  };

  return mimeExtensions[item.mimeType] || "file";
}

async function prepareSharedFile(item, index = 0) {
  const response = await fetch(item.downloadUrl);

  if (!response.ok) {
    throw new Error("One of the selected files could not be saved.");
  }

  const blob = await response.blob();
  return new File(
    [blob],
    `nia-alan-wedding-memory-${index + 1}.${getFileExtension(item)}`,
    { type: item.mimeType }
  );
}

function downloadFileSeparately(file) {
  const downloadUrl = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
}

function isAppleMobile() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isMobileDevice() {
  return (
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    window.matchMedia("(pointer: coarse)").matches
  );
}

function updateDeviceLabels() {
  const mobile = isMobileDevice();
  downloadSelected.textContent = mobile
    ? "Save selected to phone"
    : "Download selected";
  selectionHelp.textContent = mobile
    ? "We’ll use your phone’s best available save method."
    : "Selected files will download separately.";
}

function updateSaveAssistant() {
  const item = saveQueue[saveQueueIndex];

  if (!item) {
    closeSaveAssistant();
    return;
  }

  const isVideo = getMediaKind(item) === "video";
  saveAssistantMediaContent.replaceChildren(
    createMedia(item, { lightboxView: isVideo })
  );
  saveAssistantProgress.textContent = `${saveQueueIndex + 1} of ${
    saveQueue.length
  }`;
  saveAssistantOpen.href = item.mediaUrl;
  saveAssistantOpen.textContent = isVideo
    ? "Open video to save"
    : "Open full photo";
  saveAssistantOpen.classList.toggle("button-primary", isVideo);
  saveAssistantOpen.classList.toggle("button-secondary", !isVideo);
  saveAssistantDownload.href = item.downloadUrl;
  saveAssistantDownload.hidden = !isVideo;
  videoSaveSteps.hidden = !isVideo;
  saveAssistant.classList.toggle("is-saving-video", isVideo);
  saveAssistantTitle.textContent = isVideo
    ? "Save this video"
    : saveQueue.length > 1
      ? "Save selected memories"
      : "Save this photo";
  saveAssistantNext.textContent =
    saveQueueIndex === saveQueue.length - 1 ? "Done" : "Next memory";
  saveAssistantPrevious.hidden = saveQueue.length < 2;
  saveAssistantSlideNext.hidden = saveQueue.length < 2;
  saveAssistantBack.disabled = saveQueueIndex === 0;
  saveAssistantDots.replaceChildren();

  saveQueue.forEach((queueItem, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "photo-save-dot";
    dot.classList.toggle("is-active", index === saveQueueIndex);
    dot.setAttribute("aria-label", `View selected photo ${index + 1}`);
    dot.addEventListener("click", () => {
      saveQueueIndex = index;
      updateSaveAssistant();
    });
    saveAssistantDots.appendChild(dot);
  });

  if (isAppleMobile()) {
    saveAssistantInstructions.textContent =
      isVideo
        ? "iPhone saves videos through Safari’s Share menu. It only takes three taps:"
        : "Press and hold the photo below, then choose Save to Photos.";
  } else {
    saveAssistantInstructions.textContent =
      isVideo
        ? "Open the video, then use your phone’s download or share menu to save it."
        : "Press and hold the photo below, then choose Download image.";
  }
}

function openSaveAssistant(items) {
  saveQueue = items;
  saveQueueIndex = 0;
  updateSaveAssistant();
  saveAssistant.hidden = false;
  document.body.classList.add("photo-lightbox-open");
  saveAssistantClose.focus();
}

function closeSaveAssistant() {
  saveAssistant.hidden = true;
  saveAssistantMediaContent.replaceChildren();
  saveQueue = [];
  saveQueueIndex = 0;
  document.body.classList.remove("photo-lightbox-open");
}

function moveSaveAssistant(direction) {
  if (saveQueue.length < 2) {
    return;
  }

  saveQueueIndex =
    (saveQueueIndex + direction + saveQueue.length) % saveQueue.length;
  updateSaveAssistant();
}

function createMedia(item, { lightboxView = false } = {}) {
  const kind = getMediaKind(item);

  if (kind === "video") {
    const video = document.createElement("video");
    video.src = item.mediaUrl;
    video.preload = "metadata";
    video.playsInline = true;
    video.controls = lightboxView;
    if (!lightboxView) {
      video.muted = true;
    }
    return video;
  }

  const image = document.createElement("img");
  image.src = item.mediaUrl;
  image.alt = item.uploaderName
    ? `Wedding memory shared by ${item.uploaderName}`
    : "A shared wedding memory";
  image.loading = lightboxView ? "eager" : "lazy";
  image.decoding = "async";
  return image;
}

function getVisibleItems() {
  const items =
    activeFilter === "all"
      ? [...galleryItems]
      : galleryItems.filter((item) => getMediaKind(item) === activeFilter);

  return items.sort((left, right) => {
    const difference =
      new Date(right.uploadedAt).getTime() -
      new Date(left.uploadedAt).getTime();
    return gallerySort.value === "oldest" ? -difference : difference;
  });
}

function renderGallery() {
  visibleItems = getVisibleItems();
  galleryGrid.replaceChildren();

  if (!visibleItems.length) {
    galleryStatus.textContent =
      activeFilter === "all"
        ? "No photos yet — be the first to add one."
        : `No ${activeFilter === "image" ? "photos" : "videos"} here yet.`;
    return;
  }

  galleryStatus.textContent = `${visibleItems.length} ${
    visibleItems.length === 1 ? "memory" : "memories"
  }`;

  visibleItems.forEach((item, index) => {
    const card = document.createElement("button");
    card.className = `photo-gallery-card is-${getMediaKind(item)}`;
    card.classList.toggle("is-selected", selectedIds.has(item.id));
    card.type = "button";
    card.setAttribute(
      "aria-label",
      selectionMode
        ? `${selectedIds.has(item.id) ? "Deselect" : "Select"} memory ${
            index + 1
          }`
        : `Open memory ${index + 1}`
    );
    card.setAttribute("aria-pressed", selectedIds.has(item.id).toString());

    const media = createMedia(item);
    card.appendChild(media);

    if (selectionMode) {
      const selectionMark = document.createElement("span");
      selectionMark.className = "photo-selection-mark";
      selectionMark.textContent = selectedIds.has(item.id) ? "✓" : "";
      card.appendChild(selectionMark);
    }

    if (getMediaKind(item) === "video") {
      const videoBadge = document.createElement("span");
      videoBadge.className = "photo-video-badge";
      videoBadge.textContent = "Play video";
      card.appendChild(videoBadge);
    }

    card.addEventListener("click", () => {
      if (selectionMode) {
        toggleSelectedItem(item.id);
      } else {
        openLightbox(index);
      }
    });
    galleryGrid.appendChild(card);
  });
}

function updateSelectionControls() {
  const count = selectedIds.size;
  selectionDownload.hidden = !selectionMode;
  selectionCount.textContent = `${count} selected`;
  downloadSelected.disabled = count === 0;
  selectToggle.textContent = selectionMode ? "Cancel selection" : "Select photos";
}

function toggleSelectedItem(id) {
  if (selectedIds.has(id)) {
    selectedIds.delete(id);
  } else if (selectedIds.size < 25) {
    selectedIds.add(id);
  } else {
    galleryStatus.textContent = "Please choose no more than 25 items at once.";
    return;
  }

  updateSelectionControls();
  renderGallery();
}

function setSelectionMode(enabled) {
  selectionMode = enabled;

  if (!enabled) {
    selectedIds.clear();
  }

  galleryGrid.classList.toggle("is-selecting", enabled);
  updateSelectionControls();
  renderGallery();
}

async function downloadSelectedItems() {
  if (!selectedIds.size) {
    return;
  }

  const originalText = downloadSelected.textContent;
  downloadSelected.disabled = true;
  downloadSelected.textContent = "Preparing files...";
  galleryStatus.textContent = "Gathering your selected memories...";

  try {
    const selectedItems = galleryItems.filter((item) =>
      selectedIds.has(item.id)
    );
    const includesVideo = selectedItems.some(
      (item) => getMediaKind(item) === "video"
    );

    if (!isMobileDevice()) {
      for (let index = 0; index < selectedItems.length; index += 1) {
        galleryStatus.textContent = `Downloading ${index + 1} of ${
          selectedItems.length
        }...`;
        const file = await prepareSharedFile(selectedItems[index], index);
        downloadFileSeparately(file);
        await new Promise((resolve) => window.setTimeout(resolve, 300));
      }

      galleryStatus.textContent = "Your selected downloads have started.";
      setSelectionMode(false);
      return;
    }

    if (
      !includesVideo &&
      window.isSecureContext &&
      navigator.share &&
      navigator.canShare
    ) {
      try {
        const preparedFiles = [];

        for (let index = 0; index < selectedItems.length; index += 1) {
          galleryStatus.textContent = `Preparing ${index + 1} of ${
            selectedItems.length
          }...`;
          preparedFiles.push(
            await prepareSharedFile(selectedItems[index], index)
          );
        }

        if (navigator.canShare({ files: preparedFiles })) {
          await navigator.share({
            files: preparedFiles,
            title: "Nia & Alan wedding memories",
          });
          galleryStatus.textContent = "Your selected memories are ready.";
          setSelectionMode(false);
          return;
        }
      } catch (error) {
        if (error.name === "AbortError") {
          galleryStatus.textContent = "Save cancelled.";
          return;
        }

        console.warn("Multi-file share unavailable; using save guide.", error);
      }
    }

    openSaveAssistant(selectedItems);
    galleryStatus.textContent =
      "Follow the save guide for each selected memory.";
    if (window.isSecureContext) {
      setSelectionMode(false);
    } else {
      selectionMode = false;
      selectedIds.clear();
      galleryGrid.classList.remove("is-selecting");
      updateSelectionControls();
      renderGallery();
    }
  } catch (error) {
    if (error.name === "AbortError") {
      galleryStatus.textContent = "Download cancelled.";
      return;
    }

    console.error("Selected memories could not be downloaded.", error);
    galleryStatus.textContent =
      error.message || "The download could not be prepared. Please try again.";
  } finally {
    downloadSelected.textContent = originalText;
    updateDeviceLabels();
    downloadSelected.disabled = selectedIds.size === 0;
  }
}

function openLightbox(index) {
  activeIndex = index;
  updateLightbox();
  lightbox.hidden = false;
  document.body.classList.add("photo-lightbox-open");
  lightboxClose.focus();
}

function updateLightbox() {
  const item = visibleItems[activeIndex];

  if (!item) {
    return;
  }

  lightboxMedia.replaceChildren(createMedia(item, { lightboxView: true }));
  lightboxCaption.replaceChildren();

  const uploader = document.createElement("strong");
  uploader.textContent = item.uploaderName
    ? `Shared by ${item.uploaderName}`
    : "Shared by one of our lovely guests";
  const date = document.createElement("span");
  date.textContent = formatUploadDate(item.uploadedAt);
  lightboxCaption.append(uploader, date);
  const isVideo = getMediaKind(item) === "video";
  const mobile = isMobileDevice();
  const needsLongPressSave = mobile && !isVideo && !window.isSecureContext;
  lightboxSaveHelp.classList.remove("is-highlighted");
  lightboxSaveHelp.hidden = !mobile || isVideo;
  lightboxSaveHelp.textContent = needsLongPressSave
    ? isAppleMobile()
      ? "Press and hold the photo to save it."
      : "Press and hold the photo to download it."
    : "Tap below to save this photo.";
  lightboxPosition.textContent = `${activeIndex + 1} of ${visibleItems.length}`;
  lightboxDownload.hidden = needsLongPressSave;
  lightboxDownload.textContent = mobile
    ? isVideo
      ? "Save video to phone"
      : "Save photo to phone"
    : isVideo
      ? "Download video"
      : "Download photo";
  lightboxDownload.dataset.itemId = item.id;

  const hasMultiple = visibleItems.length > 1;
  lightboxPrevious.hidden = !hasMultiple;
  lightboxNext.hidden = !hasMultiple;
}

function moveLightbox(direction) {
  if (visibleItems.length < 2) {
    return;
  }

  activeIndex =
    (activeIndex + direction + visibleItems.length) % visibleItems.length;
  updateLightbox();
}

function closeLightbox() {
  lightbox.hidden = true;
  lightboxMedia.replaceChildren();
  document.body.classList.remove("photo-lightbox-open");
}

async function loadGallery() {
  try {
    const response = await fetch(`${photoApiOrigin}/api/photos-gallery`, {
      cache: "no-store",
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error);
    }

    galleryItems = result.items || [];
    renderGallery();
  } catch (error) {
    console.error("Shared gallery failed to load.", error);
    galleryStatus.textContent =
      "The gallery is having a little wobble — please try again.";
  }
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((item) => {
      item.classList.toggle("is-active", item === button);
    });
    renderGallery();
  });
});

gallerySort?.addEventListener("change", renderGallery);
selectToggle?.addEventListener("click", () => {
  setSelectionMode(!selectionMode);
});
downloadSelected?.addEventListener("click", downloadSelectedItems);
saveAssistantClose?.addEventListener("click", closeSaveAssistant);
saveAssistant?.addEventListener("click", (event) => {
  if (event.target === saveAssistant) {
    closeSaveAssistant();
  }
});
saveAssistantNext?.addEventListener("click", () => {
  if (saveQueueIndex >= saveQueue.length - 1) {
    closeSaveAssistant();
    return;
  }

  saveQueueIndex += 1;
  updateSaveAssistant();
});
saveAssistantBack?.addEventListener("click", () => {
  if (saveQueueIndex > 0) {
    saveQueueIndex -= 1;
    updateSaveAssistant();
  }
});
saveAssistantPrevious?.addEventListener("click", () =>
  moveSaveAssistant(-1)
);
saveAssistantSlideNext?.addEventListener("click", () =>
  moveSaveAssistant(1)
);
saveAssistantMedia?.addEventListener("touchstart", (event) => {
  saveAssistantTouchStartX = event.changedTouches[0]?.screenX || 0;
});
saveAssistantMedia?.addEventListener("touchend", (event) => {
  const touchEndX = event.changedTouches[0]?.screenX || 0;
  const distance = touchEndX - saveAssistantTouchStartX;

  if (Math.abs(distance) > 45) {
    moveSaveAssistant(distance > 0 ? -1 : 1);
  }
});
lightboxDownload?.addEventListener("click", async () => {
  const item = galleryItems.find(
    (galleryItem) => galleryItem.id === lightboxDownload.dataset.itemId
  );

  if (!item) {
    return;
  }

  const originalText = lightboxDownload.textContent;
  lightboxDownload.disabled = true;
  lightboxDownload.textContent = "Preparing...";

  try {
    if (!isMobileDevice()) {
      const file = await prepareSharedFile(item);
      downloadFileSeparately(file);
      return;
    }

    if (getMediaKind(item) === "video") {
      closeLightbox();
      openSaveAssistant([item]);
      return;
    }

    if (!window.isSecureContext) {
      return;
    }

    const file = await prepareSharedFile(item);

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: "Nia & Alan wedding memory",
      });
    } else {
      lightboxSaveHelp.hidden = false;
      lightboxSaveHelp.textContent = isAppleMobile()
        ? "Press and hold the photo to save it."
        : "Press and hold the photo to download it.";
      lightboxDownload.hidden = true;
      lightboxSaveHelp.classList.add("is-highlighted");
      window.setTimeout(() => {
        lightboxSaveHelp.classList.remove("is-highlighted");
      }, 1600);
    }
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Memory could not be saved.", error);
      galleryStatus.textContent =
        "That memory could not be saved — please try again.";
    }
  } finally {
    lightboxDownload.disabled = false;
    lightboxDownload.textContent = originalText;
  }
});
lightboxClose?.addEventListener("click", closeLightbox);
lightboxPrevious?.addEventListener("click", () => moveLightbox(-1));
lightboxNext?.addEventListener("click", () => moveLightbox(1));
lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    closeLightbox();
  }
});
lightboxStage?.addEventListener("touchstart", (event) => {
  touchStartX = event.changedTouches[0]?.screenX || 0;
});
lightboxStage?.addEventListener("touchend", (event) => {
  const touchEndX = event.changedTouches[0]?.screenX || 0;
  const distance = touchEndX - touchStartX;

  if (Math.abs(distance) > 50) {
    moveLightbox(distance > 0 ? -1 : 1);
  }
});
document.addEventListener("keydown", (event) => {
  if (lightbox.hidden) {
    return;
  }

  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowLeft") moveLightbox(-1);
  if (event.key === "ArrowRight") moveLightbox(1);
});

loadGallery();
updateDeviceLabels();
