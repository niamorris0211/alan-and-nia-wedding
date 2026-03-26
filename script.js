const navLinks = document.querySelectorAll('a[href^="#"]');
const faqButtons = document.querySelectorAll(".faq-question");
const guestWelcomeSection = document.getElementById("guest-welcome");
const guestWelcomeHeading = document.getElementById("guest-welcome-heading");
const guestWelcomeCopy = document.getElementById("guest-welcome-copy");
const scheduleWeekendOverview = document.getElementById("schedule-weekend-overview");
const genericRsvpCopy = document.getElementById("rsvp-generic-copy");
const genericRsvpCard = document.getElementById("rsvp-generic-card");
const personalisedRsvpCard = document.getElementById("rsvp-personalised");
const personalisedRsvpForm = document.getElementById("personalised-rsvp-form");
const rsvpSuccessState = document.getElementById("rsvp-success-state");
const rsvpSuccessHeading = document.getElementById("rsvp-success-heading");
const rsvpSuccessCopy = document.getElementById("rsvp-success-copy");
const attendingList = document.getElementById("rsvp-attending-list");
const rsvpFeedback = document.getElementById("rsvp-form-feedback");
const rsvpGuestSlugInput = document.getElementById("rsvp-guest-slug");
const rsvpHouseholdNameInput = document.getElementById("rsvp-household-name");
const stayGenericHeading = document.getElementById("stay-generic-heading");
const stayGenericContent = document.getElementById("stay-generic-content");
const stayPersonalised = document.getElementById("stay-personalised");
const stayPersonalisedLine = document.getElementById("stay-personalised-line");
const stayAccommodationTitle = document.getElementById("stay-accommodation-title");
const stayAccommodationLabel = document.getElementById("stay-accommodation-label");
const staySummary = document.getElementById("stay-summary");
const staySleeps = document.getElementById("stay-sleeps");
const stayTiming = document.getElementById("stay-timing");
const stayCheckoutRow = document.getElementById("stay-checkout-row");
const stayCheckout = document.getElementById("stay-checkout");
const stayLocation = document.getElementById("stay-location");
const stayNote = document.getElementById("stay-note");
const stayCarousel = document.getElementById("stay-carousel");
const stayCarouselPrev = document.getElementById("stay-carousel-prev");
const stayCarouselNext = document.getElementById("stay-carousel-next");
const ACCOMMODATION_NAME_ALIASES = {
  "Malvern Chase Shepherds Hut": "Malvern Chase Shepherd’s Hut",
  "Midsummer Shepherds Hut": "Midsummer Shepherd's Hut",
  "Sugarloaf Shepherds Hut": "Sugarloaf Shepherd's Hut",
};

function slugifyGuestName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function splitHouseholdNames(household) {
  if (!household) {
    return [];
  }

  return household
    .replace(/\s*&\s*/g, ",")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

function normaliseAccommodationName(stayName) {
  if (!stayName) {
    return null;
  }

  return ACCOMMODATION_NAME_ALIASES[stayName] || stayName;
}

function normaliseGuestHousehold(guest, index) {
  const displayName = guest.displayName || guest.household || "";
  const inviteType = guest.inviteType || guest.type || "day";
  const accommodationName = normaliseAccommodationName(
    guest.accommodationName || guest.stay || null
  );
  const guestNames = Array.isArray(guest.guests) && guest.guests.length
    ? guest.guests.map((householdGuest, guestIndex) => {
        const guestName =
          typeof householdGuest === "string"
            ? householdGuest
            : householdGuest.name || householdGuest.displayName || "";

        return {
          id:
            (typeof householdGuest === "object" && householdGuest.id) ||
            `${guest.slug || `guest-${index + 1}`}-${slugifyGuestName(guestName) || guestIndex + 1}`,
          name: guestName,
        };
      })
    : splitHouseholdNames(displayName).map((name, guestIndex) => ({
        id: `${guest.slug || `guest-${index + 1}`}-${slugifyGuestName(name) || guestIndex + 1}`,
        name,
      }));

  return {
    slug: guest.slug,
    displayName,
    inviteType,
    isStayingOnsite: Boolean(accommodationName),
    accommodationName,
    guests: guestNames,
  };
}

function getGuestHouseholds() {
  if (!Array.isArray(window.GUEST_HOUSEHOLDS)) {
    return [];
  }

  return window.GUEST_HOUSEHOLDS.map(normaliseGuestHousehold);
}

function getAccommodationData() {
  return window.ACCOMMODATION_DATA || {};
}

function getRsvpEndpoint() {
  return window.RSVP_CONFIG?.emailSubmitEndpoint?.trim() || "";
}

function resolveGuestFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const guestSlug = params.get("guest");

  if (!guestSlug) {
    return null;
  }

  return (
    getGuestHouseholds().find((guest) => guest.slug === guestSlug.trim()) || null
  );
}

function renderGuestWelcome(guest) {
  if (!guestWelcomeSection || !guestWelcomeHeading || !guest) {
    return;
  }

  guestWelcomeHeading.textContent = `Hi ${guest.displayName} 🤍`;

  if (guestWelcomeCopy) {
    const visitLabel = guest.inviteType === "weekend" ? "weekend" : "day";
    guestWelcomeCopy.textContent = `We’re so excited to celebrate with you. Everything you need for the ${visitLabel} is here.`;
  }

  guestWelcomeSection.hidden = false;
  guestWelcomeSection.removeAttribute("hidden");
  guestWelcomeSection.style.display = "block";
}

function renderGuestAttendanceOptions(guest) {
  if (!attendingList || !guest || !Array.isArray(guest.guests)) {
    return;
  }

  attendingList.innerHTML = "";

  guest.guests.forEach((householdGuest) => {
    const item = document.createElement("label");
    item.className = "rsvp-attending-item";
    item.innerHTML = `
      <input
        type="checkbox"
        name="attendingGuests"
        value="${householdGuest.name}"
      />
      <span>${householdGuest.name}</span>
    `;
    attendingList.appendChild(item);
  });
}

function renderPersonalisedRsvp(guest) {
  if (!guest || !personalisedRsvpCard || !genericRsvpCopy || !genericRsvpCard) {
    return;
  }

  renderGuestAttendanceOptions(guest);

  if (rsvpGuestSlugInput) {
    rsvpGuestSlugInput.value = guest.slug;
  }

  if (rsvpHouseholdNameInput) {
    rsvpHouseholdNameInput.value = guest.displayName;
  }

  genericRsvpCopy.hidden = true;
  genericRsvpCard.hidden = true;
  personalisedRsvpCard.hidden = false;

  if (personalisedRsvpForm) {
    personalisedRsvpForm.hidden = false;
  }

  if (rsvpSuccessState) {
    rsvpSuccessState.hidden = true;
  }

  if (rsvpFeedback) {
    rsvpFeedback.textContent = "";
  }
}

function showRsvpSuccessState(guest) {
  if (!rsvpSuccessState) {
    return;
  }

  const householdName = guest?.displayName?.trim();

  if (rsvpSuccessHeading) {
    rsvpSuccessHeading.textContent = householdName
      ? `Thanks ${householdName} — we’ve got your RSVP`
      : "Thanks — we’ve got your RSVP";
  }

  if (rsvpSuccessCopy) {
    rsvpSuccessCopy.textContent =
      "If anything changes, just message us and we’ll happily help.";
  }

  if (personalisedRsvpForm) {
    personalisedRsvpForm.hidden = true;
  }

  if (rsvpFeedback) {
    rsvpFeedback.textContent = "";
  }

  rsvpSuccessState.hidden = false;
}

function renderPersonalisedSchedule(guest) {
  if (!scheduleWeekendOverview) {
    return;
  }

  scheduleWeekendOverview.hidden = !guest || guest.inviteType !== "weekend";
}

function buildStayPlaceholder(title, index) {
  const placeholder = document.createElement("article");
  placeholder.className = "stay-carousel-slide stay-carousel-placeholder";
  placeholder.innerHTML = `
    <span>Photo ${index + 1}</span>
    <strong>${title}</strong>
  `;
  return placeholder;
}

function buildStayImageSlide(accommodation, src, index) {
  const figure = document.createElement("figure");
  figure.className = "stay-carousel-slide stay-carousel-image";
  figure.innerHTML = `
    <img src="${src}" alt="${accommodation.title} photo ${index + 1}" />
  `;

  const image = figure.querySelector("img");

  image.addEventListener("error", () => {
    figure.replaceWith(buildStayPlaceholder(accommodation.title, index));
  });

  return figure;
}

function updateStayCarouselControls() {
  if (!stayCarouselPrev || !stayCarouselNext || !stayCarousel) {
    return;
  }

  const hasSlides = stayCarousel.children.length > 1;
  stayCarouselPrev.hidden = !hasSlides;
  stayCarouselNext.hidden = !hasSlides;
}

function renderStayCarousel(accommodation) {
  if (!stayCarousel) {
    return;
  }

  stayCarousel.innerHTML = "";

  const imagePaths = Array.isArray(accommodation.images) ? accommodation.images : [];

  if (imagePaths.length) {
    imagePaths.forEach((src, index) => {
      stayCarousel.appendChild(buildStayImageSlide(accommodation, src, index));
    });
  } else {
    for (let index = 0; index < 3; index += 1) {
      stayCarousel.appendChild(buildStayPlaceholder(accommodation.title, index));
    }
  }

  stayCarousel.scrollTo({ left: 0, behavior: "auto" });
  updateStayCarouselControls();
}

function scrollStayCarousel(direction) {
  if (!stayCarousel) {
    return;
  }

  const amount = Math.max(stayCarousel.clientWidth * 0.84, 260);
  stayCarousel.scrollBy({
    left: direction * amount,
    behavior: "smooth",
  });
}

function renderPersonalisedStay(guest) {
  if (
    !guest ||
    !guest.accommodationName ||
    !stayPersonalised ||
    !stayGenericHeading ||
    !stayGenericContent
  ) {
    return;
  }

  const accommodation = getAccommodationData()[guest.accommodationName];

  if (!accommodation) {
    return;
  }

  stayGenericHeading.hidden = true;
  stayGenericContent.hidden = true;
  stayPersonalised.hidden = false;

  if (stayPersonalisedLine) {
    stayPersonalisedLine.textContent = `For the wedding weekend, you’ll be staying in ${accommodation.title}.`;
  }

  if (stayAccommodationTitle) {
    stayAccommodationTitle.textContent = accommodation.displayTitle || accommodation.title;
  }

  if (stayAccommodationLabel) {
    if (accommodation.secondaryLabel) {
      stayAccommodationLabel.textContent = accommodation.secondaryLabel;
      stayAccommodationLabel.hidden = false;
    } else {
      stayAccommodationLabel.hidden = true;
    }
  }

  if (staySummary) {
    staySummary.textContent = accommodation.shortSummary;
  }

  if (staySleeps) {
    staySleeps.textContent = accommodation.sleepsLabel;
  }

  if (stayTiming) {
    stayTiming.textContent = accommodation.timingLabel;
  }

  if (stayCheckoutRow && stayCheckout) {
    if (accommodation.checkoutLabel) {
      stayCheckout.textContent = accommodation.checkoutLabel;
      stayCheckoutRow.hidden = false;
    } else {
      stayCheckoutRow.hidden = true;
    }
  }

  if (stayLocation) {
    stayLocation.textContent = accommodation.locationNote;
  }

  if (stayNote) {
    if (accommodation.optionalNotes) {
      stayNote.textContent = accommodation.optionalNotes;
      stayNote.hidden = false;
    } else {
      stayNote.hidden = true;
    }
  }

  renderStayCarousel(accommodation);
}

function buildSubmissionPayload(guest, form) {
  const formData = new FormData(form);
  const attendingGuests = formData.getAll("attendingGuests");
  const dietaryRequirements =
    formData.get("dietary_requirements")?.toString().trim() || "";
  const songRequest = formData.get("song_request")?.toString().trim() || "";
  const optionalNote = formData.get("optional_note")?.toString().trim() || "";

  return {
    guest_slug: guest.slug,
    household_name: guest.displayName,
    attending_guests: attendingGuests,
    dietary_requirements: dietaryRequirements,
    song_request: songRequest,
    optional_note: optionalNote,
    submitted_at: new Date().toISOString(),
  };
}

async function submitToEmailService(payload) {
  const endpoint = getRsvpEndpoint();

  if (!endpoint) {
    throw new Error("Missing email endpoint.");
  }

  const formData = new FormData();
  formData.append("_subject", `Wedding RSVP: ${payload.household_name}`);
  formData.append("_captcha", "false");
  formData.append("_template", "table");
  formData.append("Household", payload.household_name);
  formData.append("Guest Link", payload.guest_slug);
  formData.append(
    "Attending",
    payload.attending_guests.length
      ? payload.attending_guests.join(", ")
      : "No one selected"
  );
  formData.append(
    "Dietary Requirements",
    payload.dietary_requirements || "None given"
  );
  formData.append("Song Request", payload.song_request || "None given");
  formData.append("Note", payload.optional_note || "None given");
  formData.append("Submitted At", payload.submitted_at);

  await fetch(endpoint, {
    method: "POST",
    body: formData,
  });
}

function savePreviewSubmission(payload) {
  const localSubmissions = JSON.parse(
    window.localStorage.getItem("rsvpPreviewSubmissions") || "[]"
  );

  localSubmissions.push(payload);

  window.localStorage.setItem(
    "rsvpPreviewSubmissions",
    JSON.stringify(localSubmissions)
  );
}

navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetId = link.getAttribute("href");

    if (!targetId || targetId === "#") {
      return;
    }

    const targetElement = document.querySelector(targetId);

    if (!targetElement) {
      return;
    }

    event.preventDefault();
    targetElement.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
});

faqButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const faqItem = button.closest(".faq-item");
    const answer = faqItem.querySelector(".faq-answer");
    const isOpen = faqItem.classList.contains("is-open");

    faqItem.classList.toggle("is-open", !isOpen);
    button.setAttribute("aria-expanded", String(!isOpen));
    answer.style.maxHeight = !isOpen ? `${answer.scrollHeight}px` : "0px";
  });
});

if (stayCarouselPrev) {
  stayCarouselPrev.addEventListener("click", () => scrollStayCarousel(-1));
}

if (stayCarouselNext) {
  stayCarouselNext.addEventListener("click", () => scrollStayCarousel(1));
}

const guest = resolveGuestFromQuery();

if (guest) {
  renderGuestWelcome(guest);
  renderPersonalisedSchedule(guest);
  renderPersonalisedRsvp(guest);
  renderPersonalisedStay(guest);
}

if (personalisedRsvpForm && rsvpFeedback) {
  personalisedRsvpForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const activeGuest = resolveGuestFromQuery();

    if (!activeGuest) {
      return;
    }

    const payload = buildSubmissionPayload(activeGuest, personalisedRsvpForm);

    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      savePreviewSubmission(payload);
      personalisedRsvpForm.reset();
      showRsvpSuccessState(activeGuest);
      return;
    }

    if (!getRsvpEndpoint()) {
      rsvpFeedback.textContent =
        "RSVP email is almost ready. Add your email endpoint in rsvp-config.js.";
      return;
    }

    rsvpFeedback.textContent = "Sending your RSVP...";

    try {
      await submitToEmailService(payload);
      personalisedRsvpForm.reset();
      showRsvpSuccessState(activeGuest);
    } catch (error) {
      rsvpFeedback.textContent = "Sorry, something went wrong. Please try again.";
    }
  });
}
