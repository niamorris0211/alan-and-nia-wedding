const { sendNotificationEmail } = require("../../lib/email-notifications");

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Accept",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
}

function asStringArray(value) {
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];
}

function formatList(names) {
  return names.length ? names.join(", ") : "No one";
}

function normalisePayload(input) {
  const inviteType = String(input.invite_type || "day").trim();
  const householdName = String(
    input.household_name || input.full_name || ""
  ).trim();
  const generatedSlug = householdName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return {
    guest_slug: String(
      input.guest_slug ||
        (inviteType === "lidl_shared_evening" ? `lidl-${generatedSlug}` : "")
    ).trim(),
    household_name: householdName,
    invite_type: inviteType,
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
    optional_note: String(
      input.optional_note || input.optional_message || ""
    ).trim(),
    email_address: String(input.email_address || "").trim(),
    attending_response: String(input.attending || "").trim(),
    minibus_interest: String(input.minibus_interest || "").trim(),
    submitted_at: input.submitted_at || new Date().toISOString(),
  };
}

function formatSubmittedAt(submittedAt) {
  return new Date(submittedAt).toLocaleString("en-GB", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/London",
  });
}

function buildRsvpEmailMessage(payload) {
  if (payload.invite_type === "lidl_shared_evening") {
    return [
      "Lidl shared evening invite RSVP",
      "",
      `Full name: ${payload.household_name}`,
      `Email address: ${payload.email_address || "Not given"}`,
      `Attending: ${payload.attending_response || "Not answered"}`,
      `Dietary requirements: ${payload.dietary_requirements || "None given"}`,
      `Minibus interest: ${payload.minibus_interest || "Not answered"}`,
      `Optional message: ${payload.optional_note || "None given"}`,
      "",
      `Submitted: ${formatSubmittedAt(payload.submitted_at)}`,
    ].join("\n");
  }

  return [
    payload.invite_type === "evening"
      ? "Nia & Alan Evening RSVP"
      : "Nia & Alan Wedding RSVP",
    "",
    payload.household_name,
    "",
    `Coming: ${formatList(payload.attending_guests)}`,
    `Can't make it: ${formatList(payload.not_attending_guests)}`,
    `Dietary requirements: ${payload.dietary_requirements || "None given"}`,
    `Song request: ${payload.song_request || "None given"}`,
    "",
    `Breakfast coming: ${formatList(payload.breakfast_attending)}`,
    `Breakfast not coming: ${formatList(payload.breakfast_not_attending)}`,
    `Breakfast dietary requirements: ${
      payload.breakfast_dietary_requirements || "None given"
    }`,
    "",
    `Optional note: ${payload.optional_note || "None given"}`,
    `Guest link: ${payload.guest_slug}`,
    `Submitted: ${formatSubmittedAt(payload.submitted_at)}`,
  ].join("\n");
}

async function saveRsvp(payload) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase configuration");
  }

  const databasePayload = {
    guest_slug: payload.guest_slug,
    household_name: payload.household_name,
    invite_type: payload.invite_type,
    attending_guests: payload.attending_guests,
    not_attending_guests: payload.not_attending_guests,
    breakfast_attending: payload.breakfast_attending,
    breakfast_not_attending: payload.breakfast_not_attending,
    breakfast_dietary_requirements: payload.breakfast_dietary_requirements,
    dietary_requirements: payload.dietary_requirements,
    song_request: payload.song_request,
    optional_note:
      payload.invite_type === "lidl_shared_evening"
        ? [
            payload.optional_note,
            `Email: ${payload.email_address || "Not given"}`,
            `Attending: ${payload.attending_response || "Not answered"}`,
            `Minibus: ${payload.minibus_interest || "Not answered"}`,
          ]
            .filter(Boolean)
            .join("\n")
        : payload.optional_note,
    submitted_at: payload.submitted_at,
  };
  const response = await fetch(
    `${supabaseUrl}/rest/v1/rsvps?on_conflict=guest_slug`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(databasePayload),
    }
  );

  if (!response.ok) {
    throw new Error(`Supabase returned ${response.status}: ${await response.text()}`);
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return jsonResponse(204, {});
  }

  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  try {
    const payload = normalisePayload(JSON.parse(event.body || "{}"));

    if (!payload.guest_slug || !payload.household_name) {
      return jsonResponse(400, {
        error: "Missing guest or household details",
      });
    }

    await saveRsvp(payload);

    const subject = `${
      payload.invite_type === "lidl_shared_evening"
        ? "Lidl Evening RSVP"
        : payload.invite_type === "evening"
          ? "Evening RSVP"
          : "Wedding RSVP"
    } from ${payload.household_name}`;

    await sendNotificationEmail({
      subject,
      text: buildRsvpEmailMessage(payload),
      idempotencyKey: `rsvp/${payload.guest_slug}/${payload.submitted_at}`,
      recipient: process.env.RSVP_NOTIFICATION_EMAIL_TO,
    });

    return jsonResponse(200, {
      success: true,
      stored: true,
      notificationAccepted: true,
    });
  } catch (error) {
    console.error("RSVP submission failed.", error);
    return jsonResponse(500, { error: "Failed to submit RSVP" });
  }
};
