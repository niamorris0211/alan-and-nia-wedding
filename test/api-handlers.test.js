const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const test = require("node:test");

const submitRsvp = require("../api/submit-rsvp");
const stripeGiftWebhook = require("../api/stripe-gift-webhook");

function createResponse() {
  return {
    headers: {},
    statusCode: 0,
    body: "",
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end(body = "") {
      this.body = body;
    },
  };
}

function preserveEnvironment(keys) {
  return Object.fromEntries(keys.map((key) => [key, process.env[key]]));
}

function restoreEnvironment(values) {
  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  });
}

test("RSVP endpoint stores the response and sends a notification", async () => {
  const originalFetch = global.fetch;
  const environment = preserveEnvironment([
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "RESEND_API_KEY",
    "NOTIFICATION_EMAIL_FROM",
    "NOTIFICATION_EMAIL_TO",
  ]);
  const requests = [];

  process.env.SUPABASE_URL = "https://project.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";
  process.env.RESEND_API_KEY = "re_test";
  process.env.NOTIFICATION_EMAIL_FROM =
    "Nia & Alan <wedding@notifications.alanandnia.co.uk>";
  process.env.NOTIFICATION_EMAIL_TO = "couple@example.com";

  global.fetch = async (url, options) => {
    requests.push({ url, options });

    if (url.startsWith(process.env.SUPABASE_URL)) {
      return new Response("", { status: 201 });
    }

    return new Response(JSON.stringify({ id: "email_rsvp" }), { status: 200 });
  };

  try {
    const response = createResponse();

    await submitRsvp(
      {
        method: "POST",
        body: {
          guest_slug: "test-household",
          household_name: "Test Household",
          invite_type: "day",
          attending_guests: ["Test Guest"],
          submitted_at: "2026-06-09T12:00:00.000Z",
        },
      },
      response
    );

    assert.equal(response.statusCode, 200);
    assert.equal(requests.length, 2);
    assert.match(requests[0].url, /supabase\.co\/rest\/v1\/rsvps/);
    assert.equal(requests[1].url, "https://api.resend.com/emails");
    assert.equal(
      requests[1].options.headers["Idempotency-Key"],
      "rsvp/test-household/2026-06-09T12:00:00.000Z"
    );
  } finally {
    global.fetch = originalFetch;
    restoreEnvironment(environment);
  }
});

test("Stripe webhook stores a payment and sends an idempotent notification", async () => {
  const originalFetch = global.fetch;
  const environment = preserveEnvironment([
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "RESEND_API_KEY",
    "NOTIFICATION_EMAIL_FROM",
    "NOTIFICATION_EMAIL_TO",
  ]);
  const requests = [];
  const event = {
    id: "evt_test_gift",
    type: "checkout.session.completed",
    created: 1781006400,
    data: {
      object: {
        id: "cs_test",
        payment_status: "paid",
        amount_total: 4400,
        currency: "gbp",
        payment_intent: "pi_test",
        metadata: {
          gift_id: "whisky-research",
          gift_action: "full",
        },
        customer_details: {
          name: "Test Guest",
          email: "guest@example.com",
        },
      },
    },
  };
  const rawBody = JSON.stringify(event);
  const timestamp = "1781006400";

  process.env.SUPABASE_URL = "https://project.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  process.env.RESEND_API_KEY = "re_test";
  process.env.NOTIFICATION_EMAIL_FROM =
    "Nia & Alan <wedding@notifications.alanandnia.co.uk>";
  process.env.NOTIFICATION_EMAIL_TO = "couple@example.com";

  const signature = crypto
    .createHmac("sha256", process.env.STRIPE_WEBHOOK_SECRET)
    .update(`${timestamp}.${rawBody}`, "utf8")
    .digest("hex");

  global.fetch = async (url, options) => {
    requests.push({ url, options });

    if (url.startsWith(process.env.SUPABASE_URL)) {
      return new Response(JSON.stringify([{ id: "payment_record" }]), {
        status: 201,
      });
    }

    return new Response(JSON.stringify({ id: "email_gift" }), { status: 200 });
  };

  try {
    const response = createResponse();

    await stripeGiftWebhook(
      {
        method: "POST",
        body: rawBody,
        headers: {
          "stripe-signature": `t=${timestamp},v1=${signature}`,
        },
      },
      response
    );

    assert.equal(response.statusCode, 200);
    assert.equal(requests.length, 2);
    assert.match(requests[0].url, /supabase\.co\/rest\/v1\/gift_payments/);
    assert.equal(requests[1].url, "https://api.resend.com/emails");
    assert.equal(
      requests[1].options.headers["Idempotency-Key"],
      "gift-payment/evt_test_gift"
    );
  } finally {
    global.fetch = originalFetch;
    restoreEnvironment(environment);
  }
});
