const lidlRsvpForm = document.getElementById("lidl-rsvp-form");
const lidlRsvpFeedback = document.getElementById("lidl-rsvp-feedback");
const lidlRsvpSuccess = document.getElementById("lidl-rsvp-success");

function getLidlRsvpEndpoint() {
  return window.RSVP_CONFIG?.emailSubmitEndpoint || "";
}

function formatLidlSubmittedAt(submittedAt) {
  return new Date(submittedAt).toLocaleString("en-GB", {
    dateStyle: "full",
    timeStyle: "short",
  });
}

function buildLidlPayload(form) {
  const formData = new FormData(form);

  return {
    invite_type: "lidl_shared_evening",
    full_name: formData.get("full_name")?.toString().trim() || "",
    email_address: formData.get("email_address")?.toString().trim() || "",
    attending: formData.get("attending")?.toString() || "",
    dietary_requirements:
      formData.get("dietary_requirements")?.toString().trim() || "",
    minibus_interest: formData.get("minibus_interest")?.toString() || "",
    optional_message: formData.get("optional_message")?.toString().trim() || "",
    submitted_at: new Date().toISOString(),
  };
}

function buildLidlEmailMessage(payload) {
  return [
    "Lidl shared evening invite RSVP",
    "",
    `Full name: ${payload.full_name}`,
    `Email address: ${payload.email_address || "Not given"}`,
    `Attending: ${payload.attending}`,
    `Dietary requirements: ${payload.dietary_requirements || "None given"}`,
    `Minibus interest: ${payload.minibus_interest || "Not answered"}`,
    `Optional message: ${payload.optional_message || "None given"}`,
    "",
    `Submitted: ${formatLidlSubmittedAt(payload.submitted_at)}`,
  ].join("\n");
}

async function submitLidlRsvp(payload) {
  const endpoint = getLidlRsvpEndpoint();

  if (!endpoint) {
    throw new Error("Missing email endpoint.");
  }

  const formData = new FormData();
  formData.append("_subject", `Lidl Evening RSVP — ${payload.full_name}`);
  formData.append("_captcha", "false");
  formData.append("_template", "box");
  formData.append("RSVP", buildLidlEmailMessage(payload));

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Lidl RSVP submission was not accepted.");
  }
}

function saveLidlPreviewSubmission(payload) {
  const localSubmissions = JSON.parse(
    window.localStorage.getItem("lidlRsvpPreviewSubmissions") || "[]"
  );

  localSubmissions.push(payload);
  window.localStorage.setItem(
    "lidlRsvpPreviewSubmissions",
    JSON.stringify(localSubmissions)
  );
}

document.querySelectorAll(".faq-question").forEach((button) => {
  button.addEventListener("click", () => {
    const item = button.closest(".faq-item");

    if (!item) {
      return;
    }

    item.classList.toggle("is-open");
    const answer = item.querySelector(".faq-answer");

    if (!answer) {
      return;
    }

    answer.style.maxHeight = item.classList.contains("is-open")
      ? `${answer.scrollHeight}px`
      : "";
  });
});

document.querySelectorAll(".site-nav a").forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetId = link.getAttribute("href");

    if (!targetId?.startsWith("#")) {
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

if (lidlRsvpForm && lidlRsvpFeedback) {
  lidlRsvpForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = buildLidlPayload(lidlRsvpForm);

    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      saveLidlPreviewSubmission(payload);
      lidlRsvpForm.reset();
      lidlRsvpForm.hidden = true;
      lidlRsvpSuccess.hidden = false;
      return;
    }

    if (!getLidlRsvpEndpoint()) {
      lidlRsvpFeedback.textContent =
        "RSVP email is almost ready. Add your email endpoint in rsvp-config.js.";
      return;
    }

    lidlRsvpFeedback.textContent = "Sending your RSVP...";

    try {
      await submitLidlRsvp(payload);
      lidlRsvpForm.reset();
      lidlRsvpForm.hidden = true;
      lidlRsvpSuccess.hidden = false;
    } catch (error) {
      lidlRsvpFeedback.textContent =
        "Sorry, that didn't send properly. Please try again in a moment.";
    }
  });
}
