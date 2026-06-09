const assert = require("node:assert/strict");
const test = require("node:test");

const {
  sendNotificationEmail,
} = require("../lib/email-notifications");

test("sends through Resend with an idempotency key", async () => {
  const originalFetch = global.fetch;
  const originalEnvironment = {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    NOTIFICATION_EMAIL_FROM: process.env.NOTIFICATION_EMAIL_FROM,
    NOTIFICATION_EMAIL_TO: process.env.NOTIFICATION_EMAIL_TO,
  };
  const requests = [];

  process.env.RESEND_API_KEY = "re_test";
  process.env.NOTIFICATION_EMAIL_FROM =
    "Nia & Alan <notifications@alanandnia.co.uk>";
  process.env.NOTIFICATION_EMAIL_TO = "couple@example.com";
  global.fetch = async (url, options) => {
    requests.push({ url, options });

    return new Response(JSON.stringify({ id: "email_123" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const result = await sendNotificationEmail({
      subject: "Wedding RSVP from Test Household",
      text: "Test message",
      idempotencyKey: "rsvp/test/2026-06-09T12:00:00.000Z",
    });

    assert.equal(result.id, "email_123");
    assert.equal(requests.length, 1);
    assert.equal(
      requests[0].options.headers["Idempotency-Key"],
      "rsvp/test/2026-06-09T12:00:00.000Z"
    );
    assert.deepEqual(JSON.parse(requests[0].options.body).to, [
      "couple@example.com",
    ]);
  } finally {
    global.fetch = originalFetch;

    Object.entries(originalEnvironment).forEach(([key, value]) => {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    });
  }
});

test("retries a transient Resend failure", async () => {
  const originalFetch = global.fetch;
  const originalEnvironment = {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    NOTIFICATION_EMAIL_FROM: process.env.NOTIFICATION_EMAIL_FROM,
    NOTIFICATION_EMAIL_TO: process.env.NOTIFICATION_EMAIL_TO,
  };
  let attempts = 0;

  process.env.RESEND_API_KEY = "re_test";
  process.env.NOTIFICATION_EMAIL_FROM =
    "Nia & Alan <notifications@alanandnia.co.uk>";
  process.env.NOTIFICATION_EMAIL_TO = "couple@example.com";
  global.fetch = async () => {
    attempts += 1;

    if (attempts === 1) {
      return new Response("temporarily unavailable", { status: 503 });
    }

    return new Response(JSON.stringify({ id: "email_456" }), {
      status: 200,
    });
  };

  try {
    const result = await sendNotificationEmail({
      subject: "Gift payment",
      text: "Test payment",
      idempotencyKey: "gift-payment/evt_test",
    });

    assert.equal(result.id, "email_456");
    assert.equal(attempts, 2);
  } finally {
    global.fetch = originalFetch;

    Object.entries(originalEnvironment).forEach(([key, value]) => {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    });
  }
});
