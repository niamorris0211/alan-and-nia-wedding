exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Missing Supabase configuration" }),
    };
  }

  try {
    const payload = JSON.parse(event.body || "{}");
    const record = {
      guest_slug: payload.guest_slug,
      household_name: payload.household_name,
      attending_guests: Array.isArray(payload.attending_guests)
        ? payload.attending_guests
        : [],
      breakfast_attending: Array.isArray(payload.breakfastAttending)
        ? payload.breakfastAttending
        : [],
      breakfast_dietary_requirements:
        payload.breakfastDietaryRequirements || "",
      dietary_requirements: payload.dietary_requirements || "",
      song_request: payload.song_request || "",
      optional_note: payload.optional_note || "",
      submitted_at: new Date().toISOString(),
    };

    const response = await fetch(
      `${supabaseUrl}/rest/v1/rsvps?on_conflict=guest_slug`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify(record),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to submit RSVP" }),
    };
  }
};
