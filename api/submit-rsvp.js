const DEFAULT_FORMSPREE_ENDPOINT = "https://formspree.io/f/xwvydezz";

function setCorsHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
}

function sendJson(response, statusCode, body) {
  setCorsHeaders(response);
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(body));
}

function asStringArray(value) {
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];
}

function formatList(names) {
  return names.length ? names.join(", ") : "No one";
}

function formatSubmittedAt(submittedAt) {
  const date = submittedAt ? new Date(submittedAt) : new Date();

  return date.toLocaleString("en-GB", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/London",
  });
}

function buildRsvpEmailMessage(payload) {
  const isEveningRsvp = payload.invite_type === "evening";
  const breakfastLines =
    !isEveningRsvp &&
    (payload.breakfast_attending.length ||
      payload.breakfast_not_attending.length)
      ? [
          "",
          "BREAKFAST AT THE DUKE OF YORK",
          `Coming: ${formatList(payload.breakfast_attending)}`,
          `Not coming: ${formatList(payload.breakfast_not_attending)}`,
          `Breakfast dietary requirements: ${
            payload.breakfast_dietary_requirements || "None given"
          }`,
        ]
      : [];

  return [
    isEveningRsvp ? "Nia & Alan Evening RSVP" : "Nia & Alan Wedding RSVP",
    "",
    payload.household_name,
    "",
    isEveningRsvp ? "EVENING PARTY" : "WEDDING DAY",
    `Coming: ${formatList(payload.attending_guests)}`,
    `Can't make it: ${formatList(payload.not_attending_guests)}`,
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

function normalisePayload(input) {
  return {
    guest_slug: String(input.guest_slug || "").trim(),
    household_name: String(input.household_name || "").trim(),
    invite_type: String(input.invite_type || "day").trim(),
    attending_guests: asStringArray(input.attending_guests),
    not_attending_guests: asStringArray(input.not_attending_guests),
    breakfast_attending: asStringArray(
      input.breakfast_attending || input.breakfastAttending
    ),
    breakfast_not_attending: asStringArray(
      input.breakfast_not_attending || input.breakfastNotAttending
    ),
    breakfast_dietary_requirements: String(
      input.breakfast_dietary_requirements ||
        input.breakfastDietaryRequirements ||
        ""
    ).trim(),
    dietary_requirements: String(input.dietary_requirements || "").trim(),
    song_request: String(input.song_request || "").trim(),
    optional_note: String(input.optional_note || "").trim(),
    submitted_at: input.submitted_at || new Date().toISOString(),
  };
}

async function saveRsvpToSupabase(payload) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      stored: false,
      error: "Missing Supabase environment variables",
    };
  }

  const supabaseResponse = await fetch(
    `${supabaseUrl}/rest/v1/rsvps?on_conflict=guest_slug`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(payload),
    }
  );

  if (supabaseResponse.ok) {
    return { stored: true, error: "" };
  }

  const errorBody = await supabaseResponse.text();

  return {
    stored: false,
    error: errorBody || `Supabase returned ${supabaseResponse.status}`,
  };
}

async function sendRsvpToFormspree(payload) {
  const endpoint =
    process.env.RSVP_FORMSPREE_ENDPOINT || DEFAULT_FORMSPREE_ENDPOINT;
  const subject = `${
    payload.invite_type === "evening" ? "Evening RSVP" : "Wedding RSVP"
  } from ${payload.household_name}`;
  const formData = new FormData();

  formData.append("subject", subject);
  formData.append("RSVP", buildRsvpEmailMessage(payload));

  Object.entries(payload).forEach(([key, value]) => {
    formData.append(key, Array.isArray(value) ? value.join(", ") : value || "");
  });

  const formspreeResponse = await fetch(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    body: formData,
  });

  if (!formspreeResponse.ok) {
    throw new Error("Formspree RSVP submission was not accepted.");
  }
}

module.exports = async function handler(request, response) {
  setCorsHeaders(response);

  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    return response.end();
  }

  if (request.method !== "POST") {
    return sendJson(response, 405, { error: "Method not allowed" });
  }

  try {
    const payload = normalisePayload(request.body || {});

    if (!payload.guest_slug || !payload.household_name) {
      return sendJson(response, 400, {
        error: "Missing guest or household details",
      });
    }

    const storageResult = await saveRsvpToSupabase(payload).catch((error) => ({
      stored: false,
      error: error.message,
    }));
    await sendRsvpToFormspree(payload);

    return sendJson(response, 200, {
      success: true,
      stored: storageResult.stored,
      storageError: storageResult.error,
      notificationAccepted: true,
    });
  } catch (error) {
    return sendJson(response, 500, {
      error: "Failed to submit RSVP",
    });
  }
};
