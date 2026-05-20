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
const giftGrid = document.getElementById("gift-grid");
const giftPrivateNotes = document.getElementById("gift-private-notes");
const giftPrivateNotesList = document.getElementById("gift-private-notes-list");
const giftModal = document.getElementById("gift-modal");
const giftModalClose = document.getElementById("gift-modal-close");
const giftModalTitle = document.getElementById("gift-modal-title");
const giftModalAmount = document.getElementById("gift-modal-amount");
const giftNoteForm = document.getElementById("gift-note-form");
const giftNoteSuccess = document.getElementById("gift-note-success");
const giftNoteFeedback = document.getElementById("gift-note-feedback");
const giftGuestNameInput = document.getElementById("gift-guest-name");
const giftNoteIdInput = document.getElementById("gift-note-id");
const giftNoteTitleInput = document.getElementById("gift-note-title");
const giftNoteAmountInput = document.getElementById("gift-note-amount");
const giftPaymentLinkKeyInput = document.getElementById(
  "gift-payment-link-key"
);
const ACCOMMODATION_NAME_ALIASES = {
  "Malvern Chase Shepherds Hut": "Malvern Chase Shepherd’s Hut",
  "Midsummer Shepherds Hut": "Midsummer Shepherd's Hut",
  "Sugarloaf Shepherds Hut": "Sugarloaf Shepherd's Hut",
};
const GIFT_NOTES_STORAGE_KEY = "niaAlanGiftNotes";
const PAYMENT_LINKS = {
  testOnePenny: "PASTE_1P_STRIPE_LINK_HERE",
  whisky: "PASTE_FIXED_STRIPE_LINK_FOR_WHISKY",
  staffa: "PASTE_FIXED_STRIPE_LINK_FOR_STAFFA",
  otter: "PASTE_FIXED_STRIPE_LINK_FOR_OTTER",
  safari: "PASTE_FIXED_STRIPE_LINK_FOR_SAFARI",
  flexibleContribution: "PASTE_ONE_FLEXIBLE_STRIPE_LINK_HERE",
};
const HONEYMOON_GIFTS = [
  {
    id: "test-biscuit",
    fixedPaymentLinkKey: "testOnePenny",
    fullGiftAmount: "£0.01",
    allowFlexibleContribution: true,
    title: "Emergency Biscuit Fund",
    priceLabel: "£0.01",
    description:
      "In case wedding planning gets too much and we require immediate emergency biscuit intervention.",
    status: "Available",
    imagePlaceholder: "TEST ITEM",
    isTestItem: true,
    badgeLabel: "Testing only",
  },
  {
    id: "whisky-research",
    fixedPaymentLinkKey: "whisky",
    fullGiftAmount: "£44",
    allowFlexibleContribution: true,
    title: "Alan’s Very Serious Whisky Research",
    priceLabel: "£44",
    description:
      "Apparently sampling Scottish whisky is an important cultural activity and definitely not just Alan having the time of his life.",
    status: "Available",
    imagePlaceholder: "Whisky research",
    imageUrl: "images/whisky tour.jpeg",
  },
  {
    id: "staffa-adventure",
    fixedPaymentLinkKey: "staffa",
    fullGiftAmount: "£90",
    allowFlexibleContribution: true,
    title: "Staffa Adventure",
    priceLabel: "£90",
    description:
      "Help send us off to explore dramatic cliffs, sea air, caves, and the kind of scenery that makes you say “wow” every five minutes.",
    status: "Available",
    imagePlaceholder: "Staffa cliffs",
    imageUrl: "images/staffa tour.jpeg",
  },
  {
    id: "otter-detective-mission",
    fixedPaymentLinkKey: "otter",
    fullGiftAmount: "£180",
    allowFlexibleContribution: true,
    title: "Otter Detective Mission",
    priceLabel: "£180 total / £90 each",
    description:
      "Fund our deeply important investigation into whether we can actually spot wild otters without getting wildly overexcited too early.",
    status: "Available",
    imagePlaceholder: "Otter mission",
    imageUrl: "images/otter detective walk.jpg",
  },
  {
    id: "wildlife-sea-safari",
    fixedPaymentLinkKey: "safari",
    fullGiftAmount: "£222",
    allowFlexibleContribution: true,
    title: "Wildlife Sea Safari",
    priceLabel: "£222 total / £111 each",
    description:
      "Whales, dolphins, sea eagles, seals… basically the honeymoon version of Planet Earth, but wetter and with less David Attenborough.",
    status: "Available",
    imagePlaceholder: "Sea safari",
    imageUrl: "images/wildlife tour.jpeg",
  },
  {
    id: "honeymoon-pot",
    fixedPaymentLinkKey: null,
    fullGiftAmount: null,
    allowFlexibleContribution: true,
    title: "Honeymoon Pot",
    priceLabel: "Any amount",
    description:
      "A little pot for anything from coffees with a view to an extra special dinner while we’re away.",
    status: "Available",
    imagePlaceholder: "Honeymoon pot",
    imageUrl: "images/honeymoon fund.jpeg",
  },
];
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

function getGoogleAppsScriptEndpoint() {
  return window.RSVP_CONFIG?.googleAppsScriptUrl?.trim() || "";
}

function getFormspreeEndpoint() {
  return window.RSVP_CONFIG?.formspreeEndpoint?.trim() || "";
}

function getFallbackRsvpEmail() {
  const configuredEmail = window.RSVP_CONFIG?.fallbackEmail?.trim();

  if (configuredEmail) {
    return configuredEmail;
  }

  const endpoint = getRsvpEndpoint();
  const match = endpoint.match(/formsubmit\.co\/(?:ajax\/)?([^/?#]+)/);

  return match ? decodeURIComponent(match[1]) : "";
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

function buildMailtoLink(emailAddress, subject, body) {
  return `mailto:${emailAddress}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
}

function showRsvpEmailFallback(feedbackElement, subject, message) {
  const fallbackEmail = getFallbackRsvpEmail();

  if (!feedbackElement || !fallbackEmail) {
    return;
  }

  const intro = document.createElement("span");
  intro.textContent =
    "Sorry, the automatic RSVP sender is having trouble. Please tap below to send your RSVP by email instead.";

  const fallbackLink = document.createElement("a");
  fallbackLink.className = "button button-secondary rsvp-email-fallback";
  fallbackLink.href = buildMailtoLink(fallbackEmail, subject, message);
  fallbackLink.textContent = "Send RSVP by email";

  const note = document.createElement("span");
  note.textContent = "Your RSVP details will be filled in for you.";

  feedbackElement.replaceChildren(intro, fallbackLink, note);
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

function getGiftStatusClass(status) {
  return `status-${status.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function isGiftAvailable(gift) {
  return gift.status.toLowerCase() !== "gifted";
}

function isGiftPartFunded(gift) {
  return gift.status.toLowerCase() === "part-funded";
}

function isPlaceholderPaymentLink(link) {
  return !link || link.startsWith("PASTE_");
}

function getPaymentLink(paymentLinkKey) {
  return PAYMENT_LINKS[paymentLinkKey] || "";
}

function getGiftActions(gift) {
  if (gift.id === "honeymoon-pot") {
    return [
      {
        type: "flexible",
        label: "Contribute to honeymoon pot",
        selectedAmount: "General honeymoon contribution",
        paymentLinkKey: "flexibleContribution",
        disabled: !gift.allowFlexibleContribution,
      },
    ];
  }

  return [
    {
      type: "full",
      label: `Gift the full experience — ${gift.fullGiftAmount}`,
      selectedAmount: gift.fullGiftAmount,
      paymentLinkKey: gift.fixedPaymentLinkKey,
      disabled: gift.status.toLowerCase() === "gifted",
    },
    {
      type: "flexible",
      label: "Contribute towards this",
      selectedAmount: `Contribution towards ${gift.title}`,
      paymentLinkKey: "flexibleContribution",
      disabled: !gift.allowFlexibleContribution,
    },
  ];
}

function getSavedGiftNotes() {
  try {
    const savedNotes = JSON.parse(
      window.localStorage.getItem(GIFT_NOTES_STORAGE_KEY) || "[]"
    );

    return Array.isArray(savedNotes) ? savedNotes : [];
  } catch (error) {
    return [];
  }
}

function saveGiftNoteLocally(payload) {
  try {
    const localGiftNote = {
      giftId: payload.gift_id,
      giftTitle: payload.gift_title,
      selectedAmount: payload.selected_amount,
      guestName: payload.guest_name,
      optionalMessage: payload.optional_message,
      submittedAt: payload.submitted_at,
    };
    const giftNotes = getSavedGiftNotes();

    giftNotes.unshift(localGiftNote);

    window.localStorage.setItem(
      GIFT_NOTES_STORAGE_KEY,
      JSON.stringify(giftNotes)
    );
  } catch (error) {
    console.warn("Gift note could not be saved locally.", error);
  }
}

function renderPrivateGiftNotes() {
  if (!giftPrivateNotes || !giftPrivateNotesList) {
    return;
  }

  const giftNotes = getSavedGiftNotes();

  giftPrivateNotes.hidden = !giftNotes.length;
  giftPrivateNotesList.innerHTML = "";

  giftNotes.forEach((note) => {
    const noteCard = document.createElement("article");
    noteCard.className = "gift-private-note-card";

    const submittedDate = note.submittedAt
      ? formatSubmittedAt(note.submittedAt)
      : "Date not saved";

    const choice = document.createElement("p");
    choice.className = "gift-private-choice";
    choice.textContent = `You chose: ${note.giftTitle} — ${note.selectedAmount}`;
    noteCard.appendChild(choice);

    if (note.optionalMessage) {
      const message = document.createElement("p");
      message.className = "gift-private-message";
      message.textContent = `Your note: ${note.optionalMessage}`;
      noteCard.appendChild(message);
    }

    const date = document.createElement("p");
    date.className = "gift-private-date";
    date.textContent = submittedDate;
    noteCard.appendChild(date);

    giftPrivateNotesList.appendChild(noteCard);
  });
}

function renderGiftList() {
  if (!giftGrid) {
    return;
  }

  giftGrid.innerHTML = "";

  HONEYMOON_GIFTS.forEach((gift) => {
    const isAvailable = isGiftAvailable(gift);
    const card = document.createElement("article");
    card.className = `gift-card ${isAvailable ? "" : "is-gifted"} ${
      gift.isTestItem ? "gift-card-test" : ""
    }`.trim();
    const statusNote = isGiftAvailable(gift)
      ? ""
      : `<p class="gift-status-note">This one has been kindly gifted.</p>`;
    const testBadge = gift.badgeLabel
      ? `<span class="gift-test-badge">${gift.badgeLabel}</span>`
      : "";
    const testLabel = gift.isTestItem
      ? `<p class="gift-test-label">TEST ITEM</p>`
      : "";

    const giftImage = gift.imageUrl
      ? `<figure class="gift-card-image">
          <img src="${gift.imageUrl}" alt="${gift.title}" loading="lazy" />
        </figure>`
      : `<div class="gift-image-placeholder" aria-hidden="true">
          <span>${gift.imagePlaceholder}</span>
        </div>`;

    card.innerHTML = `
      ${giftImage}
      <div class="gift-card-body">
        <div class="gift-card-header">
          <div>
            ${testLabel}
            <h3>${gift.title}</h3>
            <p class="gift-price">${gift.priceLabel}</p>
          </div>
          <div class="gift-card-badges">
            ${testBadge}
            <span class="gift-status-badge ${getGiftStatusClass(gift.status)}">
              ${isGiftPartFunded(gift) ? "Part-funded" : gift.status}
            </span>
          </div>
        </div>
        <p class="gift-description">${gift.description}</p>
        ${statusNote}
        <div class="gift-actions"></div>
      </div>
    `;

    const giftActions = card.querySelector(".gift-actions");

    getGiftActions(gift).forEach((option) => {
      const button = document.createElement("button");
      button.className = "button button-primary gift-button";
      button.type = "button";
      button.textContent = option.label;
      button.dataset.giftId = gift.id;
      button.dataset.actionType = option.type;
      button.disabled = option.disabled;

      giftActions.appendChild(button);
    });

    giftGrid.appendChild(card);
  });
}

function getSelectedGift(giftId, actionType) {
  const gift = HONEYMOON_GIFTS.find((item) => item.id === giftId);

  if (!gift) {
    return null;
  }

  const option = getGiftActions(gift).find(
    (action) => action.type === actionType
  );

  if (!option) {
    return null;
  }

  return { gift, option };
}

function openGiftModal(giftId, actionType) {
  const selectedGift = getSelectedGift(giftId, actionType);

  if (!selectedGift || !giftModal || !giftNoteForm) {
    return;
  }

  const { gift, option } = selectedGift;

  if (giftModalTitle) {
    giftModalTitle.textContent = gift.title;
  }

  if (giftModalAmount) {
    giftModalAmount.textContent = option.selectedAmount;
  }

  giftNoteForm.reset();

  if (giftNoteIdInput) {
    giftNoteIdInput.value = gift.id;
  }

  if (giftNoteTitleInput) {
    giftNoteTitleInput.value = gift.title;
  }

  if (giftNoteAmountInput) {
    giftNoteAmountInput.value = option.selectedAmount;
  }

  if (giftPaymentLinkKeyInput) {
    giftPaymentLinkKeyInput.value = option.paymentLinkKey;
  }

  giftNoteForm.hidden = false;

  if (giftNoteFeedback) {
    giftNoteFeedback.textContent = "";
  }

  if (giftNoteSuccess) {
    giftNoteSuccess.hidden = true;
  }

  giftModal.hidden = false;
  document.body.classList.add("modal-open");

  window.setTimeout(() => {
    giftGuestNameInput?.focus();
  }, 80);
}

function closeGiftModal() {
  if (!giftModal) {
    return;
  }

  giftModal.hidden = true;
  document.body.classList.remove("modal-open");
}

function buildGiftNoteEmailMessage(payload) {
  return [
    "Nia & Alan Honeymoon Gift Note",
    "",
    `Gift: ${payload.gift_title}`,
    `Amount selected: ${payload.selected_amount}`,
    `Payment link key: ${payload.payment_link_key}`,
    "",
    `Guest name: ${payload.guest_name}`,
    `Email address: ${payload.guest_email}`,
    `Message: ${payload.optional_message || "None given"}`,
    "",
    `Submitted: ${formatSubmittedAt(payload.submitted_at)}`,
  ].join("\n");
}

function getGiftNoteEmailSubject(payload) {
  return `Honeymoon Gift Note - ${payload.guest_name}`;
}

async function submitGiftNote(payload) {
  const endpoint = getFormspreeEndpoint();

  if (!endpoint) {
    return;
  }

  const formData = new FormData();
  formData.append("subject", getGiftNoteEmailSubject(payload));
  formData.append("Gift Note", buildGiftNoteEmailMessage(payload));

  Object.entries(payload).forEach(([key, value]) => {
    formData.append(key, value || "");
  });

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Gift note submission was not accepted.");
  }
}

async function handleGiftNoteSubmit(event) {
  event.preventDefault();

  if (!giftNoteForm || !giftNoteSuccess) {
    return;
  }

  const formData = new FormData(giftNoteForm);
  const storedAmount = formData.get("gift_amount")?.toString() || "";
  const paymentLinkKey = formData.get("payment_link_key")?.toString() || "";
  const paymentLink = getPaymentLink(paymentLinkKey);
  const payload = {
    gift_id: formData.get("gift_id")?.toString() || "",
    gift_title: formData.get("gift_title")?.toString() || "",
    selected_amount: storedAmount,
    payment_link_key: paymentLinkKey,
    guest_name: formData.get("guest_name")?.toString().trim() || "",
    guest_email: formData.get("guest_email")?.toString().trim() || "",
    optional_message: formData.get("gift_message")?.toString().trim() || "",
    submitted_at: new Date().toISOString(),
  };

  saveGiftNoteLocally(payload);
  renderPrivateGiftNotes();

  if (giftNoteFeedback) {
    giftNoteFeedback.textContent = "Sending your gift note...";
  }

  if (
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    submitGiftNote(payload).catch((error) => {
      console.warn("Gift note email could not be sent.", error);
    });
  }

  giftNoteForm.reset();
  giftNoteForm.hidden = true;
  giftNoteSuccess.hidden = false;

  if (paymentLink && !isPlaceholderPaymentLink(paymentLink)) {
    window.open(paymentLink, "_blank", "noopener,noreferrer");
  } else if (giftNoteFeedback) {
    giftNoteFeedback.textContent =
      "Gift note saved. Add the Stripe payment link in script.js when it’s ready.";
  }
}

function setupScrollReveals() {
  const revealItems = document.querySelectorAll(
    ".section-heading, .hero-image, .hero-copy, .weekend-card, .evening-detail-card, .evening-info-card, .timeline-card, .gallery-card, .stay-group, .stay-personalised-card, .gift-note-card, .gift-card, .rsvp-card, .faq-item, .bottom-image-card"
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

function getRsvpEmailSubject(payload) {
  return `${
    payload.invite_type === "evening" ? "Evening RSVP" : "Wedding RSVP"
  } from ${payload.household_name}`;
}

async function submitToEmailService(payload) {
  const endpoint = getRsvpSubmissionEndpoint();

  if (!endpoint) {
    throw new Error("Missing email endpoint.");
  }

  const formData = new FormData();
  formData.append("_subject", getRsvpEmailSubject(payload));
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

async function submitToGoogleAppsScript(payload) {
  const endpoint = getGoogleAppsScriptEndpoint();

  if (!endpoint) {
    throw new Error("Missing Google Apps Script endpoint.");
  }

  await fetch(endpoint, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      ...payload,
      email_subject: getRsvpEmailSubject(payload),
      email_message: buildRsvpEmailMessage(payload),
    }),
  });
}

function appendFormspreeField(formData, key, value) {
  if (Array.isArray(value)) {
    formData.append(key, value.join(", "));
    return;
  }

  formData.append(key, value || "");
}

async function submitToFormspree(payload) {
  const endpoint = getFormspreeEndpoint();

  if (!endpoint) {
    throw new Error("Missing Formspree endpoint.");
  }

  const formData = new FormData();
  formData.append("subject", getRsvpEmailSubject(payload));
  formData.append("RSVP", buildRsvpEmailMessage(payload));

  Object.entries(payload).forEach(([key, value]) => {
    appendFormspreeField(formData, key, value);
  });

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Formspree RSVP submission was not accepted.");
  }
}

async function submitRsvp(payload) {
  if (getGoogleAppsScriptEndpoint()) {
    await submitToGoogleAppsScript(payload);
    return;
  }

  if (getFormspreeEndpoint()) {
    await submitToFormspree(payload);
    return;
  }

  await submitToEmailService(payload);
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
renderGiftList();
renderPrivateGiftNotes();

if (giftGrid) {
  giftGrid.addEventListener("click", (event) => {
    const target = event.target;
    const button =
      target instanceof Element ? target.closest(".gift-button") : null;

    if (!button || button.disabled) {
      return;
    }

    openGiftModal(button.dataset.giftId, button.dataset.actionType);
  });
}

if (giftModal) {
  giftModal.addEventListener("click", (event) => {
    const target = event.target;

    if (target instanceof Element && target.matches("[data-gift-close]")) {
      closeGiftModal();
    }
  });
}

if (giftModalClose) {
  giftModalClose.addEventListener("click", closeGiftModal);
}

if (giftNoteForm) {
  giftNoteForm.addEventListener("submit", handleGiftNoteSubmit);
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && giftModal && !giftModal.hidden) {
    closeGiftModal();
  }
});

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
      await submitRsvp(payload);
      personalisedRsvpForm.reset();
      showRsvpSuccessState(activeGuest);
    } catch (error) {
      showRsvpEmailFallback(
        rsvpFeedback,
        getRsvpEmailSubject(payload),
        buildRsvpEmailMessage(payload)
      );
    }
  });
}
