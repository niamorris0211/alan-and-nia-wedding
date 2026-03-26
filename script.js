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
const rsvpAttendingGuestsInput = document.getElementById("rsvp-attending-guests");

function getGuestHouseholds() {
  return Array.isArray(window.GUEST_HOUSEHOLDS) ? window.GUEST_HOUSEHOLDS : [];
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

function hasSubmittedQueryFlag() {
  const params = new URLSearchParams(window.location.search);
  return params.get("submitted") === "true";
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
  if (personalisedRsvpForm) {
    personalisedRsvpForm.action = `/?guest=${encodeURIComponent(
      guest.slug
    )}&submitted=true#rsvp`;
  }
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
    attendingGuests,
    dietaryRequirements,
    songRequest,
    optionalNote,
    record: {
      guest_slug: guest.slug,
      household_name: guest.displayName,
      attending_guests: attendingGuests,
      dietary_requirements: dietaryRequirements,
      song_request: songRequest,
      optional_note: optionalNote,
      submitted_at: new Date().toISOString(),
    },
  };
}

function syncRsvpHiddenFields(guest, attendingGuests) {
  if (rsvpGuestSlugInput) {
    rsvpGuestSlugInput.value = guest.slug;
  }
  if (rsvpHouseholdNameInput) {
    rsvpHouseholdNameInput.value = guest.displayName;
  }
  if (rsvpAttendingGuestsInput) {
    rsvpAttendingGuestsInput.value = JSON.stringify(attendingGuests);
  }
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
  if (hasSubmittedQueryFlag() && rsvpFeedback) {
    rsvpFeedback.textContent = "Thank you — your RSVP has been received.";
  }
}

if (personalisedRsvpForm && rsvpFeedback) {
  personalisedRsvpForm.addEventListener("submit", (event) => {
    const activeGuest = resolveGuestFromQuery();

    if (!activeGuest) {
      event.preventDefault();
      return;
    }

    const submission = buildSubmissionPayload(activeGuest, personalisedRsvpForm);
    syncRsvpHiddenFields(activeGuest, submission.attendingGuests);

    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      event.preventDefault();

      const localSubmissions = JSON.parse(
        window.localStorage.getItem("rsvpPreviewSubmissions") || "[]"
      );

      localSubmissions.push(submission.record);

      window.localStorage.setItem(
        "rsvpPreviewSubmissions",
        JSON.stringify(localSubmissions)
      );

      rsvpFeedback.textContent =
        "Preview saved locally. Live submissions will appear in Netlify.";
      personalisedRsvpForm.reset();
      if (rsvpAttendingGuestsInput) {
        rsvpAttendingGuestsInput.value = "";
      }
      syncRsvpHiddenFields(activeGuest, []);
      return;
    }

    rsvpFeedback.textContent = "Sending your RSVP...";
  });
}
