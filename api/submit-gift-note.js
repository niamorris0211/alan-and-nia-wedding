const { sendNotificationEmail } = require("../lib/email-notifications");

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

function asText(value) {
  return String(value || "").trim();
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
    const input = request.body || {};
    const payload = {
      gift_id: asText(input.gift_id),
      gift_title: asText(input.gift_title),
      selected_amount: asText(input.selected_amount),
      payment_link_key: asText(input.payment_link_key),
      guest_name: asText(input.guest_name),
      guest_email: asText(input.guest_email),
      optional_message: asText(input.optional_message),
      submitted_at: asText(input.submitted_at) || new Date().toISOString(),
    };

    if (!payload.gift_id || !payload.guest_name) {
      return sendJson(response, 400, { error: "Missing gift or guest details" });
    }

    const text = [
      "Nia & Alan Honeymoon Gift Selection",
      "",
      "This guest has continued to Stripe. Payment is confirmed separately.",
      "",
      `Gift: ${payload.gift_title}`,
      `Amount selected: ${payload.selected_amount}`,
      `Guest name: ${payload.guest_name}`,
      `Email address: ${payload.guest_email || "Not provided"}`,
      `Message: ${payload.optional_message || "None given"}`,
      `Submitted: ${payload.submitted_at}`,
    ].join("\n");

    await sendNotificationEmail({
      subject: `Honeymoon gift selection - ${payload.guest_name}`,
      text,
      idempotencyKey: `gift-note/${payload.gift_id}/${payload.submitted_at}`,
      replyTo: payload.guest_email || undefined,
      recipient: process.env.GIFT_NOTIFICATION_EMAIL_TO,
    });

    return sendJson(response, 200, {
      success: true,
      notificationAccepted: true,
    });
  } catch (error) {
    console.error("Gift note submission failed.", error);
    return sendJson(response, 500, { error: "Failed to submit gift note" });
  }
};
