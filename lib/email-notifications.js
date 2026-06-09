const RESEND_API_URL = "https://api.resend.com/emails";
const RETRYABLE_STATUS_CODES = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function getEmailConfiguration(recipientOverride) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_EMAIL_FROM;
  const to =
    recipientOverride ||
    process.env.NOTIFICATION_EMAIL_TO ||
    "niamorris0211@hotmail.co.uk";

  if (!apiKey || !from || !to) {
    throw new Error(
      "Missing RESEND_API_KEY, NOTIFICATION_EMAIL_FROM, or NOTIFICATION_EMAIL_TO"
    );
  }

  return { apiKey, from, to };
}

async function sendNotificationEmail({
  subject,
  text,
  idempotencyKey,
  replyTo,
  recipient,
}) {
  const { apiKey, from, to } = getEmailConfiguration(recipient);
  const body = {
    from,
    to: [to],
    subject,
    text,
  };

  if (replyTo) {
    body.reply_to = replyTo;
  }

  let lastError;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(body),
      });
      const responseBody = await response.text();

      if (response.ok) {
        return responseBody ? JSON.parse(responseBody) : {};
      }

      lastError = new Error(
        `Resend returned ${response.status}: ${responseBody || "no response body"}`
      );

      if (!RETRYABLE_STATUS_CODES.has(response.status)) {
        break;
      }
    } catch (error) {
      lastError = error;
    }

    if (attempt < 2) {
      await sleep(250 * 2 ** attempt);
    }
  }

  throw lastError || new Error("Email notification could not be sent");
}

module.exports = {
  sendNotificationEmail,
};
