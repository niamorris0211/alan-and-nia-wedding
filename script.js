const navLinks = document.querySelectorAll('a[href^="#"]');
const faqList = document.getElementById("faq-list");
const guestWelcomeSection = document.getElementById("guest-welcome");
const guestWelcomeHeading = document.getElementById("guest-welcome-heading");
const guestWelcomeCopy = document.getElementById("guest-welcome-copy");
const scheduleWeekendOverview = document.getElementById("schedule-weekend-overview");
const scheduleSection = document.getElementById("schedule");
const eveningDetailsSection = document.getElementById("evening-details");
const venueGallerySection = document.getElementById("venue-gallery");
const staySection = document.getElementById("stay");
const genericRsvpCopy = document.getElementById("rsvp-generic-copy");
const genericRsvpCard = document.getElementById("rsvp-generic-card");
const personalisedRsvpCard = document.getElementById("rsvp-personalised");
const personalisedRsvpForm = document.getElementById("personalised-rsvp-form");
const rsvpSuccessState = document.getElementById("rsvp-success-state");
const rsvpSuccessHeading = document.getElementById("rsvp-success-heading");
const rsvpSuccessCopy = document.getElementById("rsvp-success-copy");
const rsvpSuccessReset = document.getElementById("rsvp-success-reset");
const attendingList = document.getElementById("rsvp-attending-list");
const breakfastSection = document.getElementById("rsvp-breakfast-section");
const breakfastAttendingList = document.getElementById(
  "rsvp-breakfast-attending-list"
);
const rsvpFeedback = document.getElementById("rsvp-form-feedback");
const rsvpGuestSlugInput = document.getElementById("rsvp-guest-slug");
const rsvpHouseholdNameInput = document.getElementById("rsvp-household-name");
const songRequestLabel = document.getElementById("song-request-label");
const songRequestInput = document.getElementById("song-request");
const optionalNoteLabel = document.getElementById("optional-note-label");
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
const BREAKFAST_ELIGIBLE_GUESTS = new Set([
  "Debby",
  "Kai",
  "Ruby",
  "Lisa",
  "Anthony",
  "Holly",
  "Katie",
  "Ben",
  "Amber",
  "Mark",
  "Andy",
  "Amy",
  "Sofi",
  "George",
  "Pippa",
  "Steve",
  "Nicole",
  "Ali",
  "Sarah",
  "Dan",
  "Greg",
  "Lailly",
  "Diane",
  "Graham",
  "Andrea",
  "Alan",
  "Nia",
]);
const EVENING_FAQ_ITEMS = [
  {
    question: "What time should I arrive?",
    answer:
      "Please arrive from 7:00pm. The first dance is at 7:30pm, so you’ll have time to get settled and grab a drink.",
  },
  {
    question: "Is there evening food?",
    answer:
      "Yes - sausage and bacon baps will be served around 9:00pm. Very necessary after dancing.",
  },
  {
    question: "What time does the party finish?",
    answer: "The party will finish at midnight.",
  },
  {
    question: "Should I book a taxi?",
    answer:
      "Yes, we recommend booking transport in advance as taxis may be limited late at night.",
  },
  {
    question: "Where is the venue?",
    answer: "Birtsmorton Court. Please use the map section above for directions.",
  },
];

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

function getFaqItems() {
  const activeGuest = resolveGuestFromQuery();

  if (activeGuest?.inviteType === "evening") {
    return EVENING_FAQ_ITEMS;
  }

  return Array.isArray(window.FAQ_ITEMS) ? window.FAQ_ITEMS : [];
}

function getRsvpEndpoint() {
  return window.RSVP_CONFIG?.emailSubmitEndpoint?.trim() || "";
}

function getRsvpSubmissionEndpoint() {
  const endpoint = getRsvpEndpoint();

  if (!endpoint) {
    return "";
  }

  if (endpoint.includes("formsubmit.co/") && !endpoint.includes("formsubmit.co/ajax/")) {
    return endpoint.replace("formsubmit.co/", "formsubmit.co/ajax/");
  }

  return endpoint;
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

  if (guest.inviteType === "evening") {
    guestWelcomeHeading.textContent = `${guest.displayName}, you’re invited to celebrate with us in the evening`;
  } else {
    guestWelcomeHeading.textContent = `Hi ${guest.displayName} 🤍`;
  }

  if (guestWelcomeCopy) {
    if (guest.inviteType === "evening") {
      guestWelcomeCopy.textContent =
        "We’d love you to join us for drinks, dancing, evening food and a very happy party.";
    } else {
      const visitLabel = guest.inviteType === "weekend" ? "weekend" : "day";
      guestWelcomeCopy.textContent = `We’re so excited to celebrate with you. Everything you need for the ${visitLabel} is here.`;
    }
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
    const item = document.createElement("fieldset");
    const legend = document.createElement("legend");
    const options = document.createElement("div");

    item.className = "rsvp-response-choice";
    legend.textContent = householdGuest.name;
    options.className = "rsvp-response-choice-options";

    [
      ["attending", "Coming"],
      ["declined", "Can't make it"],
    ].forEach(([value, labelText]) => {
      const option = document.createElement("label");
      const input = document.createElement("input");
      const label = document.createElement("span");

      option.className = "rsvp-response-choice-option";
      input.type = "radio";
      input.name = `attendanceStatus-${householdGuest.id}`;
      input.value = value;
      input.required = true;
      label.textContent = labelText;

      option.append(input, label);
      options.appendChild(option);
    });

    item.append(legend, options);
    attendingList.appendChild(item);
  });
}

function getBreakfastEligibleGuests(guest) {
  if (!guest || !guest.isStayingOnsite || !Array.isArray(guest.guests)) {
    return [];
  }

  return guest.guests.filter((householdGuest) =>
    BREAKFAST_ELIGIBLE_GUESTS.has(householdGuest.name.trim())
  );
}

function renderBreakfastOptions(guest) {
  if (!breakfastSection || !breakfastAttendingList) {
    return;
  }

  breakfastAttendingList.innerHTML = "";

  const eligibleGuests = getBreakfastEligibleGuests(guest);

  if (!eligibleGuests.length) {
    breakfastSection.hidden = true;
    return;
  }

  eligibleGuests.forEach((householdGuest) => {
    const item = document.createElement("fieldset");
    const legend = document.createElement("legend");
    const options = document.createElement("div");

    item.className = "rsvp-breakfast-choice";
    legend.textContent = householdGuest.name;
    options.className = "rsvp-breakfast-choice-options";

    [
      ["attending", "Coming"],
      ["declined", "Not coming"],
    ].forEach(([value, labelText]) => {
      const option = document.createElement("label");
      const input = document.createElement("input");
      const label = document.createElement("span");

      option.className = "rsvp-breakfast-choice-option";
      input.type = "radio";
      input.name = `breakfastStatus-${householdGuest.id}`;
      input.value = value;
      input.required = true;
      label.textContent = labelText;

      option.append(input, label);
      options.appendChild(option);
    });

    item.append(legend, options);
    breakfastAttendingList.appendChild(item);
  });

  breakfastSection.hidden = false;
}

function renderPersonalisedRsvp(guest) {
  if (!guest || !personalisedRsvpCard || !genericRsvpCopy || !genericRsvpCard) {
    return;
  }

  renderGuestAttendanceOptions(guest);
  renderBreakfastOptions(guest);

  if (songRequestLabel && songRequestInput) {
    const hideSongRequest = guest.inviteType === "evening";
    songRequestLabel.hidden = hideSongRequest;
    songRequestInput.hidden = hideSongRequest;
    songRequestInput.disabled = hideSongRequest;
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

  if (personalisedRsvpForm) {
    personalisedRsvpForm.hidden = false;
  }

  if (rsvpSuccessState) {
    rsvpSuccessState.hidden = true;
  }

  if (rsvpFeedback) {
    rsvpFeedback.textContent = "";
  }

  if (guest.inviteType === "evening") {
    const heading = personalisedRsvpCard.querySelector(".rsvp-copy-personalised h2");
    const intro = personalisedRsvpCard.querySelector(
      ".rsvp-copy-personalised .section-intro"
    );

    if (heading) {
      heading.textContent = "Evening RSVP";
    }

    if (intro) {
      intro.textContent =
        "Please let us know who will be joining us for the evening. Please RSVP by 30th June.";
    }

    if (optionalNoteLabel) {
      optionalNoteLabel.textContent = "Optional message";
    }
  }
}

function renderEveningGuestPage(guest) {
  const isEveningGuest = guest?.inviteType === "evening";

  if (scheduleSection) {
    scheduleSection.hidden = isEveningGuest;
  }

  if (eveningDetailsSection) {
    eveningDetailsSection.hidden = !isEveningGuest;
  }

  if (venueGallerySection) {
    venueGallerySection.hidden = isEveningGuest;
  }

  if (stayGenericHeading) {
    stayGenericHeading.hidden = isEveningGuest;
  }

  if (stayGenericContent) {
    stayGenericContent.hidden = isEveningGuest;
  }

  if (stayPersonalised) {
    stayPersonalised.hidden = true;
  }

  if (staySection) {
    staySection.hidden = isEveningGuest;
  }

  if (!isEveningGuest) {
    return;
  }

  const scheduleNavLink = document.querySelector('.site-nav a[href="#schedule"]');
  const stayNavLink = document.querySelector('.site-nav a[href="#stay"]');
  const venueNavLink = document.querySelector('.site-nav a[href="#venue-gallery"]');
  const heroScheduleButton = document.querySelector('.hero-actions a[href="#schedule"]');
  const heroEyebrow = document.querySelector(".hero-copy .eyebrow");
  const heroIntro = document.querySelector(".hero-intro");

  if (scheduleNavLink) {
    scheduleNavLink.href = "#evening-details";
    scheduleNavLink.textContent = "Evening";
  }

  if (heroScheduleButton) {
    heroScheduleButton.href = "#evening-details";
    heroScheduleButton.textContent = "Evening Details";
  }

  if (heroEyebrow) {
    heroEyebrow.textContent = "Evening invitation · Monday 3 August 2026";
  }

  if (heroIntro) {
    heroIntro.textContent =
      "Join us in the evening at Birtsmorton Court for drinks, dancing, food and a very happy celebration.";
  }

  if (stayNavLink) {
    stayNavLink.hidden = true;
  }

  if (venueNavLink) {
    venueNavLink.hidden = true;
  }

  if (genericRsvpCopy) {
    const intro = genericRsvpCopy.querySelector(".section-intro");
    if (intro) {
      intro.textContent =
        "Use your personalised evening RSVP link to let us know if you can make it.";
    }
  }
}

function showRsvpSuccessState(guest) {
  if (!rsvpSuccessState) {
    return;
  }

  const householdName = guest?.displayName?.trim();

  if (rsvpSuccessHeading) {
    rsvpSuccessHeading.textContent = householdName
      ? `Thanks, ${householdName}. We’ve got your RSVP.`
      : "Thanks. We’ve got your RSVP.";
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

function showRsvpForm() {
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

function renderPersonalisedSchedule(guest) {
  if (!scheduleWeekendOverview) {
    return;
  }

  scheduleWeekendOverview.hidden =
    !guest || guest.inviteType !== "weekend";
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

function formatFaqParagraph(paragraph) {
  return paragraph
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => (index === 0 && line.endsWith(":") ? `<strong>${line}</strong>` : line))
    .join("<br />");
}

function renderFaqSection() {
  if (!faqList) {
    return;
  }

  const faqItems = getFaqItems();
  faqList.innerHTML = "";

  faqItems.forEach((item, index) => {
    const article = document.createElement("article");
    article.className = "faq-item";

    const questionId = `faq-question-${index + 1}`;
    const answerId = `faq-answer-${index + 1}`;
    const paragraphs = Array.isArray(item.answer) ? item.answer : [item.answer];

    article.innerHTML = `
      <button
        class="faq-question"
        id="${questionId}"
        type="button"
        aria-expanded="false"
        aria-controls="${answerId}"
      >
        <span>${item.question}</span>
      </button>
      <div class="faq-answer" id="${answerId}" role="region" aria-labelledby="${questionId}">
        ${paragraphs.map((paragraph) => `<p>${formatFaqParagraph(paragraph)}</p>`).join("")}
      </div>
    `;

    faqList.appendChild(article);
  });
}

function setupFaqAccordion() {
  if (!faqList) {
    return;
  }

  const faqButtons = faqList.querySelectorAll(".faq-question");

  faqButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const faqItem = button.closest(".faq-item");
      const answer = faqItem?.querySelector(".faq-answer");
      const isOpen = faqItem?.classList.contains("is-open");

      faqList.querySelectorAll(".faq-item").forEach((item) => {
        const itemButton = item.querySelector(".faq-question");
        const itemAnswer = item.querySelector(".faq-answer");

        item.classList.remove("is-open");
        itemButton?.setAttribute("aria-expanded", "false");

        if (itemAnswer) {
          itemAnswer.style.maxHeight = "0px";
        }
      });

      if (!faqItem || !answer || isOpen) {
        return;
      }

      faqItem.classList.add("is-open");
      button.setAttribute("aria-expanded", "true");
      answer.style.maxHeight = `${answer.scrollHeight}px`;
    });
  });
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

function setupScrollReveals() {
  const revealItems = document.querySelectorAll(
    ".section-heading, .hero-image, .hero-copy, .weekend-card, .evening-detail-card, .evening-info-card, .timeline-card, .gallery-card, .stay-group, .stay-personalised-card, .rsvp-card, .faq-item, .bottom-image-card"
  );

  if (!revealItems.length) {
    return;
  }

  revealItems.forEach((item) => item.classList.add("reveal"));

  if (!("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.14 }
  );

  revealItems.forEach((item) => observer.observe(item));
}

function renderPersonalisedStay(guest) {
  if (
    !guest ||
    guest.inviteType === "evening" ||
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
  const attendingGuests = guest.guests
    .filter(
      (householdGuest) =>
        formData.get(`attendanceStatus-${householdGuest.id}`) === "attending"
    )
    .map((householdGuest) => householdGuest.name);
  const notAttendingGuests = guest.guests
    .filter(
      (householdGuest) =>
        formData.get(`attendanceStatus-${householdGuest.id}`) === "declined"
    )
    .map((householdGuest) => householdGuest.name);
  const breakfastEligibleGuests = getBreakfastEligibleGuests(guest);
  const breakfastAttending = breakfastEligibleGuests
    .filter(
      (householdGuest) =>
        formData.get(`breakfastStatus-${householdGuest.id}`) === "attending"
    )
    .map((householdGuest) => householdGuest.name);
  const breakfastNotAttending = breakfastEligibleGuests
    .filter(
      (householdGuest) =>
        formData.get(`breakfastStatus-${householdGuest.id}`) === "declined"
    )
    .map((householdGuest) => householdGuest.name);
  const dietaryRequirements =
    formData.get("dietary_requirements")?.toString().trim() || "";
  const songRequest = formData.get("song_request")?.toString().trim() || "";
  const breakfastDietaryRequirements =
    formData.get("breakfast_dietary_requirements")?.toString().trim() || "";
  const optionalNote = formData.get("optional_note")?.toString().trim() || "";

  return {
    guest_slug: guest.slug,
    household_name: guest.displayName,
    invite_type: guest.inviteType,
    attending_guests: attendingGuests,
    not_attending_guests: notAttendingGuests,
    breakfastAttending,
    breakfastNotAttending,
    breakfastDietaryRequirements,
    dietary_requirements: dietaryRequirements,
    song_request: songRequest,
    optional_note: optionalNote,
    submitted_at: new Date().toISOString(),
  };
}

function formatEmailList(names) {
  return names.length ? names.join(", ") : "No one";
}

function formatSubmittedAt(submittedAt) {
  return new Date(submittedAt).toLocaleString("en-GB", {
    dateStyle: "full",
    timeStyle: "short",
  });
}

function buildRsvpEmailMessage(payload) {
  const isEveningRsvp = payload.invite_type === "evening";
  const breakfastLines =
    !isEveningRsvp &&
    (payload.breakfastAttending.length || payload.breakfastNotAttending.length)
      ? [
          "",
          "BREAKFAST AT THE DUKE OF YORK",
          `Coming: ${formatEmailList(payload.breakfastAttending)}`,
          `Not coming: ${formatEmailList(payload.breakfastNotAttending)}`,
          `Breakfast dietary requirements: ${
            payload.breakfastDietaryRequirements || "None given"
          }`,
        ]
      : [];

  return [
    isEveningRsvp ? "Nia & Alan Evening RSVP" : "Nia & Alan Wedding RSVP",
    "",
    payload.household_name,
    "",
    isEveningRsvp ? "EVENING PARTY" : "WEDDING DAY",
    `Coming: ${formatEmailList(payload.attending_guests)}`,
    `Can't make it: ${formatEmailList(payload.not_attending_guests)}`,
    `Dietary requirements: ${payload.dietary_requirements || "None given"}`,
    ...(isEveningRsvp
      ? []
      : [`Song request: ${payload.song_request || "None given"}`]),
    ...breakfastLines,
    "",
    `Optional note: ${payload.optional_note || "None given"}`,
    "",
    `Guest link: ${payload.guest_slug}`,
    `Submitted: ${formatSubmittedAt(payload.submitted_at)}`,
  ].join("\n");
}

async function submitToEmailService(payload) {
  const endpoint = getRsvpSubmissionEndpoint();

  if (!endpoint) {
    throw new Error("Missing email endpoint.");
  }

  const formData = new FormData();
  formData.append(
    "_subject",
    `${
      payload.invite_type === "evening" ? "Evening RSVP" : "Wedding RSVP"
    } from ${payload.household_name}`
  );
  formData.append("_captcha", "false");
  formData.append("_template", "box");
  formData.append("RSVP", buildRsvpEmailMessage(payload));

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    body: formData,
  });

  let responseData = null;
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    responseData = await response.json();
  } else {
    responseData = await response.text();
  }

  if (!response.ok) {
    throw new Error(
      typeof responseData === "object" && responseData?.message
        ? responseData.message
        : "RSVP submission was not accepted."
    );
  }

  return responseData;
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

renderFaqSection();
setupFaqAccordion();

if (rsvpSuccessReset) {
  rsvpSuccessReset.addEventListener("click", () => {
    showRsvpForm();
  });
}

if (stayCarouselPrev) {
  stayCarouselPrev.addEventListener("click", () => scrollStayCarousel(-1));
}

if (stayCarouselNext) {
  stayCarouselNext.addEventListener("click", () => scrollStayCarousel(1));
}

const guest = resolveGuestFromQuery();

if (guest) {
  renderEveningGuestPage(guest);
  renderGuestWelcome(guest);
  renderPersonalisedSchedule(guest);
  renderPersonalisedRsvp(guest);
  renderPersonalisedStay(guest);
}

setupScrollReveals();

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
      rsvpFeedback.textContent =
        "Sorry, that didn’t send properly. If this is your first test, check Hotmail for a FormSubmit activation email, then try again.";
    }
  });
}
