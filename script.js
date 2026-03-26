const navLinks = document.querySelectorAll('a[href^="#"]');
const faqButtons = document.querySelectorAll(".faq-question");
const guestWelcomeSection = document.getElementById("guest-welcome");
const guestWelcomeHeading = document.getElementById("guest-welcome-heading");
const genericRsvpCopy = document.getElementById("rsvp-generic-copy");
const genericRsvpCard = document.getElementById("rsvp-generic-card");
const personalisedRsvpCard = document.getElementById("rsvp-personalised");
const personalisedRsvpForm = document.getElementById("personalised-rsvp-form");
const attendingList = document.getElementById("rsvp-attending-list");
const rsvpFeedback = document.getElementById("rsvp-form-feedback");
const rsvpGuestSlugInput = document.getElementById("rsvp-guest-slug");
const rsvpHouseholdNameInput = document.getElementById("rsvp-household-name");

function getGuestHouseholds() {
  return Array.isArray(window.GUEST_HOUSEHOLDS) ? window.GUEST_HOUSEHOLDS : [];
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

const guest = resolveGuestFromQuery();

if (guest) {
  renderGuestWelcome(guest);
  renderPersonalisedRsvp(guest);
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
      rsvpFeedback.textContent =
        "Thank you so much — we’re so excited to celebrate with you, and we’ve got your RSVP.";
      personalisedRsvpForm.reset();
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
      rsvpFeedback.textContent =
        "Thank you so much — we’re so excited to celebrate with you, and we’ve got your RSVP.";
      personalisedRsvpForm.reset();
    } catch (error) {
      rsvpFeedback.textContent = "Sorry, something went wrong. Please try again.";
    }
  });
}
