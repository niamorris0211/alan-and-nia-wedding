const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const test = require("node:test");

const giftStatus = require("../api/gift-status");
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

test("RSVP endpoint sends Formspree email and stores the response", async () => {
  const originalFetch = global.fetch;
  const environment = preserveEnvironment([
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "RSVP_FORMSPREE_ENDPOINT",
  ]);
  const requests = [];

  process.env.SUPABASE_URL = "https://project.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";
  process.env.RSVP_FORMSPREE_ENDPOINT = "https://formspree.io/f/test";

  global.fetch = async (url, options) => {
    requests.push({ url, options });

    if (url === process.env.RSVP_FORMSPREE_ENDPOINT) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    return new Response("", { status: 201 });
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
    assert.equal(requests[0].url, process.env.RSVP_FORMSPREE_ENDPOINT);
    assert.equal(
      requests[0].options.body.get("_subject"),
      "Wedding RSVP from Test Household"
    );
    assert.match(requests[1].url, /supabase\.co\/rest\/v1\/rsvps/);
  } finally {
    global.fetch = originalFetch;
    restoreEnvironment(environment);
  }
});

test("gift status adds multiple contributions for the same gift", async () => {
  const originalFetch = global.fetch;
  const environment = preserveEnvironment([
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ]);

  process.env.SUPABASE_URL = "https://project.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";
  global.fetch = async () =>
    new Response(
      JSON.stringify([
        {
          gift_id: "staffa-adventure",
          gift_action: "contribution",
          amount_total: 2500,
          currency: "gbp",
        },
        {
          gift_id: "staffa-adventure",
          gift_action: "contribution",
          amount_total: 1500,
          currency: "gbp",
        },
      ]),
      { status: 200 }
    );

  try {
    const response = createResponse();

    await giftStatus({ method: "GET" }, response);

    assert.equal(response.statusCode, 200);
    assert.deepEqual(JSON.parse(response.body).gifts["staffa-adventure"], {
      totalPaidPence: 4000,
      paymentCount: 2,
      currency: "gbp",
      fullGiftCount: 0,
      contributionCount: 2,
    });
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
